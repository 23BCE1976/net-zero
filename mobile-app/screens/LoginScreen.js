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

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 8,
        bounciness: 12,
      }),
    ]).start();
  }, []);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email format";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/api/user/login", {
        email: email.trim().toLowerCase(),
        password,
      });
      if (data.success) {
        navigation.replace("Home");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong";
      Alert.alert("Login Failed", msg);
    } finally {
      setLoading(false);
    }
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
            style={[
              styles.header,
              { opacity: fadeAnim, transform: [{ scale: logoScale }] },
            ]}
          >
            <View style={styles.logoMark}>
              <Ionicons name="wallet-outline" size={28} color={colors.bg} />
            </View>
            <Text style={styles.brand}>Net Zero</Text>
          </Animated.View>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to settle up with your crew
            </Text>

            <View style={styles.form}>
              <FloatingInput
                label="Email address"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (errors.email) setErrors((p) => ({ ...p, email: null }));
                }}
                keyboardType="email-address"
                error={errors.email}
              />
              <FloatingInput
                label="Password"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errors.password)
                    setErrors((p) => ({ ...p, password: null }));
                }}
                secureTextEntry
                error={errors.password}
              />

              <Pressable
                onPress={() => navigation.navigate("ForgotPassword")}
                hitSlop={8}
                style={styles.forgotBtn}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>

              <PrimaryButton
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
              />
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            <Pressable
              onPress={() => navigation.navigate("Register")}
              style={styles.switchRow}
            >
              <Text style={styles.switchText}>Don't have an account? </Text>
              <Text style={styles.switchLink}>Create one</Text>
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
  header: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  brand: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.xs,
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
    marginBottom: spacing.lg,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: spacing.lg,
    marginTop: -spacing.sm,
  },
  forgotText: {
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
