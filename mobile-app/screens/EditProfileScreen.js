import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Image,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { colors, spacing, radius, typography } from "../constants/theme";
import FloatingInput from "../components/FloatingInput";
import PrimaryButton from "../components/PrimaryButton";
import api from "../api";

export default function EditProfileScreen({ navigation }) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [upiId, setUpiId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const { data } = await api.get("/api/user/profile");
          if (data.success) {
            const u = data.data;
            setName(u.name || "");
            setMobile(u.mobile || "");
            setUpiId(u.upiId || "");
            setAvatarUrl(u.avatarUrl || "");
            setEmail(u.email?.value || "");
          }
        } catch (_) {}
      })();
    }, []),
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }
    setLoading(true);
    try {
      const body = { name: name.trim() };
      if (mobile) body.mobile = mobile.trim();
      if (upiId) body.upiId = upiId.trim();

      const { data } = await api.put("/api/user/edit", body);
      if (data.success) {
        Alert.alert("Saved", "Profile updated successfully", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
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
            <Text style={styles.topTitle}>Edit Profile</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrap}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: "#333" }]} />
                )}
              </View>
              <Text style={styles.emailText}>{email}</Text>
            </View>

            <FloatingInput
              label="Full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <FloatingInput
              label="Mobile number"
              value={mobile}
              onChangeText={(t) => setMobile(t.replace(/[^0-9+]/g, ""))}
              keyboardType="phone-pad"
            />

            <FloatingInput
              label="UPI ID"
              value={upiId}
              onChangeText={setUpiId}
              autoCapitalize="none"
            />

            <View style={styles.hintCard}>
              <Ionicons
                name="card-outline"
                size={18}
                color={colors.textMuted}
              />
              <Text style={styles.hintText}>
                Your UPI ID will be shown to others when they settle up with
                you.
              </Text>
            </View>

            <PrimaryButton
              title="Save Changes"
              onPress={handleSave}
              loading={loading}
            />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { ...typography.h2, color: colors.textPrimary },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: colors.accent,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  emailText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  hintCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  hintText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});
