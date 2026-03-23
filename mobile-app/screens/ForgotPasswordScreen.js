import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, typography } from "../constants/theme";
import FloatingInput from "../components/FloatingInput";
import PrimaryButton from "../components/PrimaryButton";
import Orbs from "../components/Orbs";
import api from "../api";

const STEPS = { EMAIL: 0, OTP: 1, RESET: 2, DONE: 3 };

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    animateIn();
  }, [step]);

  const handleSendOTP = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: "Enter a valid email" });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const { data } = await api.post("/api/user/forgot-password", {
        email: email.trim().toLowerCase(),
      });
      if (data.success) setStep(STEPS.OTP);
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setErrors({ otp: "Enter the OTP" });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const { data } = await api.post("/api/user/verify-forgot-password-otp", {
        email: email.trim().toLowerCase(),
        otp: Number(otp),
      });
      if (data.success) setStep(STEPS.RESET);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const e = {};
    if (!newPassword) e.newPassword = "Required";
    else if (newPassword.length < 6) e.newPassword = "Minimum 6 characters";
    if (newPassword !== confirmPassword)
      e.confirmPassword = "Passwords don't match";
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const { data } = await api.post("/api/user/reset-password", {
        email: email.trim().toLowerCase(),
        newPassword,
        confirmPassword,
      });
      if (data.success) setStep(STEPS.DONE);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field) => {
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
  };

  const stepConfig = {
    [STEPS.EMAIL]: {
      icon: "mail-outline",
      title: "Forgot password?",
      subtitle: "Enter your email and we'll send you a reset code",
    },
    [STEPS.OTP]: {
      icon: "keypad-outline",
      title: "Enter OTP",
      subtitle: `We sent a code to ${email}`,
    },
    [STEPS.RESET]: {
      icon: "lock-closed-outline",
      title: "New password",
      subtitle: "Choose a strong password for your account",
    },
    [STEPS.DONE]: {
      icon: "checkmark-circle-outline",
      title: "Password reset!",
      subtitle: "You can now sign in with your new password",
    },
  };

  const current = stepConfig[step];

  return (
    <SafeAreaView style={styles.safe}>
      <Orbs />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => {
              if (step === STEPS.EMAIL) navigation.goBack();
              else if (step === STEPS.OTP) setStep(STEPS.EMAIL);
              else if (step === STEPS.RESET) setStep(STEPS.OTP);
            }}
            style={styles.backBtn}
            hitSlop={12}
          >
            {step !== STEPS.DONE && (
              <Ionicons
                name="arrow-back"
                size={22}
                color={colors.textSecondary}
              />
            )}
          </Pressable>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <View style={styles.iconWrap}>
              <View
                style={[
                  styles.iconCircle,
                  step === STEPS.DONE && { backgroundColor: colors.accent },
                ]}
              >
                <Ionicons
                  name={current.icon}
                  size={28}
                  color={step === STEPS.DONE ? colors.bg : colors.accent}
                />
              </View>
            </View>

            <Text style={styles.title}>{current.title}</Text>
            <Text style={styles.subtitle}>{current.subtitle}</Text>

            {step === STEPS.EMAIL && (
              <View style={styles.form}>
                <FloatingInput
                  label="Email address"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    clearError("email");
                  }}
                  keyboardType="email-address"
                  error={errors.email}
                />
                <PrimaryButton
                  title="Send Code"
                  onPress={handleSendOTP}
                  loading={loading}
                />
              </View>
            )}

            {step === STEPS.OTP && (
              <View style={styles.form}>
                <FloatingInput
                  label="6-digit OTP"
                  value={otp}
                  onChangeText={(t) => {
                    setOtp(t.replace(/[^0-9]/g, ""));
                    clearError("otp");
                  }}
                  keyboardType="number-pad"
                  error={errors.otp}
                />
                <PrimaryButton
                  title="Verify"
                  onPress={handleVerifyOTP}
                  loading={loading}
                />
                <Pressable onPress={handleSendOTP} style={styles.resendBtn}>
                  <Text style={styles.resendText}>Resend code</Text>
                </Pressable>
              </View>
            )}

            {step === STEPS.RESET && (
              <View style={styles.form}>
                <FloatingInput
                  label="New password"
                  value={newPassword}
                  onChangeText={(t) => {
                    setNewPassword(t);
                    clearError("newPassword");
                  }}
                  secureTextEntry
                  error={errors.newPassword}
                />
                <FloatingInput
                  label="Confirm password"
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    clearError("confirmPassword");
                  }}
                  secureTextEntry
                  error={errors.confirmPassword}
                />
                <PrimaryButton
                  title="Reset Password"
                  onPress={handleReset}
                  loading={loading}
                />
              </View>
            )}

            {step === STEPS.DONE && (
              <View style={styles.form}>
                <PrimaryButton
                  title="Back to Sign In"
                  onPress={() => navigation.navigate("Login")}
                />
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    justifyContent: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  iconWrap: { alignItems: "center", marginBottom: spacing.lg },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentBg,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  form: { gap: 4 },
  resendBtn: { alignSelf: "center", paddingVertical: spacing.md },
  resendText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: "600",
  },
});
