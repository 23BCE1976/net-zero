import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Animated,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../constants/theme";
import PrimaryButton from "../components/PrimaryButton";
import api from "../api";

export default function VerifyEmailScreen({ route, navigation }) {
  const code = route?.params?.code || "";
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.6)).current;

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 8,
        bounciness: 10,
      }),
    ]).start();
  };

  useEffect(() => {
    const alreadyVerified = route?.params?.verified;

    // If already verified via website
    if (alreadyVerified) {
      setStatus("success");
      setMessage("Email verified successfully!");
      animateIn();
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("Missing verification code");
      animateIn();
      return;
    }

    (async () => {
      try {
        const { data } = await api.patch("/api/user/verify-email", {
          verificationCode: code,
        });
        if (data.success) {
          setStatus("success");
          setMessage("Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed");
        }
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed");
      }
      animateIn();
    })();
  }, [code]);

  const handleContinue = () => {
    if (status === "success") {
      navigation.replace("Login");
    } else {
      navigation.navigate("Register");
    }
  };

  const isSuccess = status === "success";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {status === "loading" ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Verifying your email...</Text>
          </View>
        ) : (
          <Animated.View
            style={[
              styles.content,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: isSuccess ? colors.accent : colors.error },
              ]}
            >
              <Ionicons
                name={isSuccess ? "checkmark-sharp" : "close-sharp"}
                size={36}
                color={colors.bg}
              />
            </View>

            <Text style={styles.title}>
              {isSuccess ? "You're all set!" : "Verification failed"}
            </Text>
            <Text style={styles.body}>{message}</Text>

            <View style={styles.btnWrap}>
              <PrimaryButton
                title={isSuccess ? "Continue to Login" : "Try Again"}
                onPress={handleContinue}
              />
            </View>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  loadingWrap: {
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  content: {
    alignItems: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    maxWidth: 300,
  },
  btnWrap: {
    width: "100%",
  },
});
