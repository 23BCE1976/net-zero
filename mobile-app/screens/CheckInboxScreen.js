import { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, typography } from "../constants/theme";
import PrimaryButton from "../components/PrimaryButton";
import Orbs from "../components/Orbs";
import api from "../api";

export default function CheckInboxScreen({ route, navigation }) {
  const email = route?.params?.email || "";

  const [checking, setChecking] = useState(false);

  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0)).current;
  const ringOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 6,
          bounciness: 14,
        }),
      ]),
      Animated.loop(
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();
  }, []);

  const refresh = async () => {
    setChecking(true);
    try {
      const { data } = await api.get(
        `/api/user/check-verify-status?email=${email}`,
      );

      if (data.success && data.verified) {
        navigation.replace("VerifyEmail", { verified: true });
      } else {
        Alert.alert("Not verified yet");
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Orbs />
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: bounceAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Animated.View
              style={[
                styles.ring,
                {
                  opacity: ringOpacity,
                  transform: [
                    {
                      scale: ringScale.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2.2],
                      }),
                    },
                  ],
                },
              ]}
            />
            <View style={styles.iconCircle}>
              <Ionicons name="mail-outline" size={36} color={colors.bg} />
            </View>
          </View>

          <Text style={styles.title}>Check your inbox</Text>
          <Text style={styles.body}>We've sent a verification link to</Text>
          <Text style={styles.email}>{email}</Text>
          <Text style={styles.hint}>
            Click the link in the email to activate your account. It may take a
            minute to arrive.
          </Text>

          <View style={styles.actions}>
            <PrimaryButton
              title="Refresh"
              onPress={refresh}
              loading={checking}
            />
          </View>

          <View style={styles.tipsCard}>
            <View style={styles.tipRow}>
              <Ionicons
                name="search-outline"
                size={16}
                color={colors.textMuted}
              />
              <Text style={styles.tipText}>Check your spam or junk folder</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons
                name="time-outline"
                size={16}
                color={colors.textMuted}
              />
              <Text style={styles.tipText}>Link expires in 24 hours</Text>
            </View>
          </View>

          <Pressable
            onPress={() => navigation.navigate("Login")}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>Back to Sign In</Text>
          </Pressable>
        </Animated.View>
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
  content: {
    alignItems: "center",
  },
  iconContainer: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  ring: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
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
  },
  email: {
    ...typography.bodyMedium,
    color: colors.accent,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: spacing.xl,
  },
  actions: {
    width: "100%",
    marginBottom: spacing.lg,
  },
  tipsCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 12,
    marginBottom: spacing.xl,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  backBtn: {
    paddingVertical: spacing.sm,
  },
  backText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
});
