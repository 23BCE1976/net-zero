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
import { getGroupMeta } from "../constants/groupMeta";
import FloatingInput from "../components/FloatingInput";
import PrimaryButton from "../components/PrimaryButton";
import api from "../api";

const GROUP_TYPES = ["trip", "home", "friends", "food", "office", "other"];

function TypeChip({ type, selected, onPress }) {
  const meta = getGroupMeta(type);
  const active = selected === type;
  return (
    <Pressable
      onPress={() => onPress(type)}
      style={[
        styles.chip,
        {
          backgroundColor: active ? meta.color + "25" : colors.surface,
          borderColor: active ? meta.color : colors.border,
        },
      ]}
    >
      <Ionicons
        name={meta.icon}
        size={16}
        color={active ? meta.color : colors.textMuted}
      />
      <Text
        style={[
          styles.chipLabel,
          { color: active ? meta.color : colors.textMuted },
        ]}
      >
        {type}
      </Text>
    </Pressable>
  );
}

export default function CreateGroupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleCreate = async () => {
    const e = {};
    if (!name.trim()) e.name = "Group name is required";
    if (!type) e.type = "Pick a type";
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/api/group", {
        name: name.trim(),
        type,
        members: [],
      });
      if (data.success) {
        navigation.replace("GroupDetail", { groupId: data.data.groupId });
      }
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to create group",
      );
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
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
              <Text style={styles.topTitle}>New Group</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.form}>
              <FloatingInput
                label="Group name"
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (errors.name) setErrors((p) => ({ ...p, name: null }));
                }}
                autoCapitalize="words"
                error={errors.name}
              />

              <Text style={styles.fieldLabel}>Type</Text>
              <View style={styles.chipGrid}>
                {GROUP_TYPES.map((t) => (
                  <TypeChip
                    key={t}
                    type={t}
                    selected={type}
                    onPress={(v) => {
                      setType(v);
                      if (errors.type) setErrors((p) => ({ ...p, type: null }));
                    }}
                  />
                ))}
              </View>
              {errors.type && (
                <Text style={styles.errorText}>{errors.type}</Text>
              )}

              <View style={styles.infoCard}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={colors.textMuted}
                />
                <Text style={styles.infoText}>
                  You can invite members after creating the group by sharing the
                  invite code.
                </Text>
              </View>

              <PrimaryButton
                title="Create Group"
                onPress={handleCreate}
                loading={loading}
              />
            </View>
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
  },
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
  form: { gap: 4 },
  fieldLabel: {
    ...typography.small,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: spacing.lg,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  chipLabel: {
    ...typography.small,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});
