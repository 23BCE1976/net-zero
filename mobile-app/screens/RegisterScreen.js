import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, typography } from "../constants/theme";
import FloatingInput from "../components/FloatingInput";
import PrimaryButton from "../components/PrimaryButton";
import Orbs from "../components/Orbs";
import api from "../api";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [upiId, setUpiId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 550,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 550,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validate = () => {
    const e = {};

    if (!name.trim()) e.name = "Name is required";

    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email format";

    if (!mobile.trim()) e.mobile = "Mobile number is required";
    else if (!/^\d{10}$/.test(mobile))
      e.mobile = "Mobile number must be of 10 digits";

    if (!upiId.trim()) e.upiId = "UPI ID is required";
    else if (!/^[\w.-]+@[\w.-]+$/.test(upiId)) e.upiId = "Invalid UPI ID";

    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Minimum 6 characters";

    if (password !== confirmPassword)
      e.confirmPassword = "Passwords don't match";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/api/user/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        mobile: mobile.trim(),
        upiId: upiId.trim(),
      });
      if (data.success) {
        navigation.replace("CheckInbox", { email: email.trim().toLowerCase() });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      Alert.alert("Oops", msg);
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

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
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              hitSlop={12}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color={colors.textSecondary}
              />
            </Pressable>

            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Split bills, track expenses, stay even
            </Text>

            <View style={styles.form}>
              <FloatingInput
                label="Full name"
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  clearError("name");
                }}
                autoCapitalize="words"
                error={errors.name}
              />
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
              <FloatingInput
                label="Mobile Number"
                value={mobile}
                onChangeText={(t) => {
                  setMobile(t);
                  clearError("mobile");
                }}
                keyboardType="phone-pad"
                error={errors.mobile}
              />
              <FloatingInput
                label="UPI ID"
                value={upiId}
                onChangeText={(t) => {
                  setUpiId(t);
                  clearError("upiId");
                }}
                autoCapitalize="none"
                error={errors.upiId}
              />
              <FloatingInput
                label="Password"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  clearError("password");
                }}
                secureTextEntry
                error={errors.password}
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

              <View style={styles.strengthRow}>
                {[1, 2, 3, 4].map((i) => {
                  const strength = !password
                    ? 0
                    : password.length >= 12 &&
                        /[A-Z]/.test(password) &&
                        /\d/.test(password)
                      ? 4
                      : password.length >= 8 && /[A-Z]/.test(password)
                        ? 3
                        : password.length >= 6
                          ? 2
                          : 1;
                  const active = i <= strength;
                  const barColor =
                    strength <= 1
                      ? colors.error
                      : strength === 2
                        ? "#FFA94D"
                        : colors.accent;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        { backgroundColor: active ? barColor : colors.border },
                      ]}
                    />
                  );
                })}
              </View>

              <PrimaryButton
                title="Create Account"
                onPress={handleRegister}
                loading={loading}
              />
            </View>

            <View style={styles.termsRow}>
              <Text style={styles.termsText}>
                By signing up you agree to our{" "}
              </Text>
              <Pressable hitSlop={4}>
                <Text style={styles.termsLink}>Terms & Privacy</Text>
              </Pressable>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            <Pressable
              onPress={() => navigation.navigate("Login")}
              style={styles.switchRow}
            >
              <Text style={styles.switchText}>Already have an account? </Text>
              <Text style={styles.switchLink}>Sign in</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
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
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.hero,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  form: {
    marginBottom: spacing.md,
  },
  strengthRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: spacing.lg,
    marginTop: -spacing.sm,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  termsRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: spacing.sm,
  },
  termsText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  termsLink: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textMuted,
    marginHorizontal: spacing.md,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  switchText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  switchLink: {
    ...typography.bodyMedium,
    color: colors.accent,
  },
});
