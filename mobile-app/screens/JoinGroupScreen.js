import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, typography } from "../constants/theme";
import FloatingInput from "../components/FloatingInput";
import PrimaryButton from "../components/PrimaryButton";
import api from "../api";

export default function JoinGroupScreen({ navigation }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleJoin = async () => {
    if (!code.trim()) {
      setError("Invite code is required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/group/join", {
        joinCode: code.trim(),
      });
      if (data.success) {
        Alert.alert("Joined!", data.message, [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid invite code";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.topBar}>
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
          <Text style={styles.topTitle}>Join Group</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <View style={styles.iconCircle}>
              <Ionicons name="enter-outline" size={32} color={colors.accent} />
            </View>
          </View>

          <Text style={styles.heading}>Got an invite code?</Text>
          <Text style={styles.subtext}>
            Paste the code shared by your group member to join their group
          </Text>

          <FloatingInput
            label="Invite code"
            value={code}
            onChangeText={(t) => {
              setCode(t);
              if (error) setError("");
            }}
            autoCapitalize="none"
            error={error}
          />

          <PrimaryButton
            title="Join Group"
            onPress={handleJoin}
            loading={loading}
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, paddingHorizontal: spacing.lg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: spacing.xxxl,
  },
  iconWrap: { alignItems: "center", marginBottom: spacing.lg },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentBg,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    maxWidth: 300,
    alignSelf: "center",
  },
});
