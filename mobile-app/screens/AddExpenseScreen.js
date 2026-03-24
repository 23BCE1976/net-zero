import { useState, useRef, useEffect, useCallback } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import { colors, spacing, radius, typography } from "../constants/theme";
import FloatingInput from "../components/FloatingInput";
import PrimaryButton from "../components/PrimaryButton";
import api from "../api";

const SPLIT_TYPES = [
  { label: "Equal", value: "equal" },
  { label: "Exact", value: "exact" },
  { label: "%tage", value: "percentage" },
  { label: "Ratio", value: "ratio" },
  { label: "AI", value: "ai", icon: "sparkles" },
];

function MemberToggle({ member, selected, onToggle }) {
  const active = selected.includes(member._id);
  return (
    <Pressable
      onPress={() => onToggle(member._id)}
      style={[styles.memberToggle, active && styles.memberToggleActive]}
    >
      <View style={[styles.toggleDot, active && styles.toggleDotActive]}>
        {active && <Ionicons name="checkmark" size={12} color={colors.bg} />}
      </View>
      <Text
        style={[styles.toggleName, active && { color: colors.textPrimary }]}
        numberOfLines={1}
      >
        {member.name || "Unknown"}
      </Text>
    </Pressable>
  );
}

function PayerPicker({ members, paidBy, onSelect }) {
  return (
    <View style={styles.payerList}>
      {members.map((m) => (
        <Pressable
          key={m._id}
          onPress={() => onSelect(m._id)}
          style={[styles.payerChip, paidBy === m._id && styles.payerChipActive]}
        >
          <Text
            style={[styles.payerText, paidBy === m._id && { color: colors.bg }]}
            numberOfLines={1}
          >
            {m.name || "?"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function AddExpenseScreen({ route, navigation }) {
  const routeGroupId = route?.params?.groupId;
  const routeUserId = route?.params?.userId;

  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState(routeGroupId || "");
  const [members, setMembers] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitType, setSplitType] = useState("equal");
  const [splitValues, setSplitValues] = useState({});
  const [aiDescription, setAiDescription] = useState("");
  const [aiSplits, setAiSplits] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
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

  useFocusEffect(
    useCallback(() => {
      if (!routeGroupId) {
        api
          .get("/api/group")
          .then(({ data }) => {
            if (data.success) setGroups(data.data);
          })
          .catch(() => {});
      }
    }, []),
  );

  useEffect(() => {
    if (!groupId) return;
    const applyMembers = (rawMembers) => {
      const mapped = rawMembers.map((m) => ({
        _id: m.id || m._id,
        name: m.name,
      }));
      setMembers(mapped);
      setSelectedMembers(mapped.map((m) => m._id));
      if (routeUserId) setPaidBy(routeUserId);
    };
    const found = groups.find((g) => g._id === groupId);
    if (found) {
      applyMembers(found.members);
      return;
    }
    api
      .get(`/api/group/${groupId}`)
      .then(({ data }) => {
        if (data.success) applyMembers(data.data.members);
      })
      .catch(() => {});
  }, [groupId, groups]);

  useEffect(() => {
    setSplitValues({});
    setAiSplits(null);
  }, [splitType]);

  const toggleMember = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const buildSplits = () => {
    const total = Number(amount);
    if (!total || total <= 0) return null;

    if (splitType === "equal") {
      const perPerson =
        Math.round((total / selectedMembers.length) * 100) / 100;
      const splits = selectedMembers.map((userId) => ({
        userId,
        share: perPerson,
      }));
      const diff = total - perPerson * selectedMembers.length;
      if (Math.abs(diff) > 0.001) splits[splits.length - 1].share += diff;
      return splits;
    }

    if (splitType === "exact") {
      const splits = selectedMembers.map((id) => ({
        userId: id,
        share: Number(splitValues[id]) || 0,
      }));
      const sum = splits.reduce((a, s) => a + s.share, 0);
      if (Math.abs(sum - total) > 0.01) {
        Alert.alert(
          "Mismatch",
          `Shares add up to ₹${sum.toFixed(2)} but total is ₹${total.toFixed(2)}`,
        );
        return null;
      }
      return splits;
    }

    if (splitType === "percentage") {
      const splits = selectedMembers.map((id) => ({
        userId: id,
        share:
          Math.round(((Number(splitValues[id]) || 0) / 100) * total * 100) /
          100,
      }));
      const pctSum = selectedMembers.reduce(
        (a, id) => a + (Number(splitValues[id]) || 0),
        0,
      );
      if (Math.abs(pctSum - 100) > 0.01) {
        Alert.alert(
          "Percentages must add up to 100",
          `Currently: ${pctSum.toFixed(1)}%`,
        );
        return null;
      }
      const diff = total - splits.reduce((a, s) => a + s.share, 0);
      if (Math.abs(diff) > 0.001) splits[splits.length - 1].share += diff;
      return splits;
    }

    if (splitType === "ratio") {
      const ratioTotal = selectedMembers.reduce(
        (a, id) => a + (Number(splitValues[id]) || 0),
        0,
      );
      if (ratioTotal === 0) {
        Alert.alert("Invalid", "Enter ratio values for at least one member");
        return null;
      }
      const splits = selectedMembers.map((id) => ({
        userId: id,
        share:
          Math.round(
            ((Number(splitValues[id]) || 0) / ratioTotal) * total * 100,
          ) / 100,
      }));
      const diff = total - splits.reduce((a, s) => a + s.share, 0);
      if (Math.abs(diff) > 0.001) splits[splits.length - 1].share += diff;
      return splits;
    }

    return null;
  };

  const handleCompute = async () => {
    const e = {};
    if (!groupId) e.group = "Select a group";
    if (!title.trim()) e.title = "Title is required";
    if (!aiDescription.trim()) e.ai = "Describe how to split";
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/api/expense/ai-split", {
        groupId,
        description: aiDescription.trim(),
      });

      if (data.success) {
        setAmount(String(data.total));
        setPaidBy(data.paidBy);
        setAiSplits(data.splits);
      }
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to compute expense",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const e = {};
    if (!groupId) e.group = "Select a group";
    if (!title.trim()) e.title = "Title is required";

    if (isAI) {
      if (!aiSplits) e.ai = "Compute the split first";
    } else {
      if (!amount || Number(amount) <= 0) e.amount = "Enter a valid amount";
      if (!paidBy) e.paidBy = "Select who paid";
      if (selectedMembers.length === 0)
        e.members = "Select at least one member";
    }

    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setLoading(true);
    try {
      let payload;
      let splits;

      if (isAI) {
        splits = aiSplits;
      } else {
        splits = buildSplits();
        if (!splits) {
          setLoading(false);
          return;
        }
      }

      payload = {
        groupId,
        title: title.trim(),
        amount: Number(amount),
        paidBy,
        splitType,
        splits,
      };

      const { data } = await api.post("/api/expense", payload);
      if (data.success) navigation.goBack();
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to add expense",
      );
    } finally {
      setLoading(false);
    }
  };

  const isAI = splitType === "ai";
  const numAmount = Number(amount) || 0;

  const splitInputLabel = (id, suffix) => {
    const name = members.find((m) => m._id === id)?.name || "Member";
    return `${name} ${suffix}`;
  };

  const getName = (id) => members.find((m) => m._id === id)?.name || "?";

  const computedSplits = () => {
    if (isAI) {
      if (!aiSplits) return null;
      return aiSplits.map((s) => ({
        id: s.userId,
        name: getName(s.userId),
        share: s.share,
      }));
    }

    if (!numAmount || selectedMembers.length === 0) return null;

    if (splitType === "equal") {
      const per = Math.round((numAmount / selectedMembers.length) * 100) / 100;
      return selectedMembers.map((id, i) => ({
        id,
        name: getName(id),
        share:
          i === selectedMembers.length - 1
            ? Math.round(
                (numAmount - per * (selectedMembers.length - 1)) * 100,
              ) / 100
            : per,
      }));
    }

    if (splitType === "exact") {
      return selectedMembers.map((id) => ({
        id,
        name: getName(id),
        share: Number(splitValues[id]) || 0,
      }));
    }

    if (splitType === "percentage") {
      return selectedMembers.map((id) => {
        const pct = Number(splitValues[id]) || 0;
        return {
          id,
          name: getName(id),
          share: Math.round((pct / 100) * numAmount * 100) / 100,
          pct,
        };
      });
    }

    if (splitType === "ratio") {
      const ratioSum = selectedMembers.reduce(
        (a, id) => a + (Number(splitValues[id]) || 0),
        0,
      );
      if (ratioSum === 0) return null;
      return selectedMembers.map((id) => {
        const r = Number(splitValues[id]) || 0;
        return {
          id,
          name: getName(id),
          share: Math.round((r / ratioSum) * numAmount * 100) / 100,
          ratio: r,
        };
      });
    }

    return null;
  };

  const previewSplits = computedSplits();
  const previewTotal = previewSplits
    ? previewSplits.reduce((a, s) => a + s.share, 0)
    : 0;

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
            <Text style={styles.topTitle}>Add Expense</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!routeGroupId && (
              <>
                <Text style={styles.fieldLabel}>Group</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: spacing.md }}
                >
                  {groups.map((g) => (
                    <Pressable
                      key={g._id}
                      onPress={() => setGroupId(g._id)}
                      style={[
                        styles.chip,
                        groupId === g._id && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          groupId === g._id && { color: colors.bg },
                        ]}
                        numberOfLines={1}
                      >
                        {g.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
                {errors.group && (
                  <Text style={styles.errorText}>{errors.group}</Text>
                )}
              </>
            )}

            <FloatingInput
              label="What's this for?"
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (errors.title) setErrors((p) => ({ ...p, title: null }));
              }}
              error={errors.title}
            />

            <Text style={styles.fieldLabel}>Split type</Text>
            <View style={styles.splitTypeRow}>
              {SPLIT_TYPES.map((type) => {
                const active = splitType === type.value;
                return (
                  <Pressable
                    key={type.value}
                    onPress={() => setSplitType(type.value)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <View style={styles.chipInner}>
                      {type.icon && (
                        <Ionicons
                          name={type.icon}
                          size={14}
                          color={active ? colors.bg : colors.accent}
                        />
                      )}
                      <Text
                        style={[
                          styles.chipText,
                          active && { color: colors.bg },
                        ]}
                      >
                        {type.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {!isAI && (
              <View style={{ marginTop: spacing.md }}>
                <FloatingInput
                  label="Total Amount"
                  prefix="₹"
                  value={amount}
                  onChangeText={(t) => {
                    setAmount(t.replace(/[^0-9.]/g, ""));
                    if (errors.amount)
                      setErrors((p) => ({ ...p, amount: null }));
                  }}
                  keyboardType="numeric"
                  error={errors.amount}
                />
              </View>
            )}

            {!isAI && members.length > 0 && (
              <>
                <Text style={[styles.fieldLabel, { marginTop: 0 }]}>
                  Paid by
                </Text>
                <PayerPicker
                  members={members}
                  paidBy={paidBy}
                  onSelect={setPaidBy}
                />
                {errors.paidBy && (
                  <Text style={styles.errorText}>{errors.paidBy}</Text>
                )}
              </>
            )}

            {!isAI && members.length > 0 && (
              <>
                <Text style={styles.fieldLabel}>Split between</Text>
                <View style={styles.membersList}>
                  {members.map((m) => (
                    <MemberToggle
                      key={m._id}
                      member={m}
                      selected={selectedMembers}
                      onToggle={toggleMember}
                    />
                  ))}
                </View>
                {errors.members && (
                  <Text style={styles.errorText}>{errors.members}</Text>
                )}
              </>
            )}

            {splitType === "exact" &&
              selectedMembers.map((id) => (
                <FloatingInput
                  key={id}
                  label={splitInputLabel(id, "(amount)")}
                  prefix="₹"
                  value={splitValues[id]?.toString() || ""}
                  onChangeText={(val) =>
                    setSplitValues((prev) => ({
                      ...prev,
                      [id]: val.replace(/[^0-9.]/g, ""),
                    }))
                  }
                  keyboardType="numeric"
                />
              ))}

            {splitType === "percentage" &&
              selectedMembers.map((id) => (
                <FloatingInput
                  key={id}
                  label={splitInputLabel(id, "(%)")}
                  value={splitValues[id]?.toString() || ""}
                  onChangeText={(val) =>
                    setSplitValues((prev) => ({
                      ...prev,
                      [id]: val.replace(/[^0-9.]/g, ""),
                    }))
                  }
                  keyboardType="numeric"
                />
              ))}

            {splitType === "ratio" &&
              selectedMembers.map((id) => (
                <FloatingInput
                  key={id}
                  label={splitInputLabel(id, "(ratio)")}
                  value={splitValues[id]?.toString() || ""}
                  onChangeText={(val) =>
                    setSplitValues((prev) => ({
                      ...prev,
                      [id]: val.replace(/[^0-9]/g, ""),
                    }))
                  }
                  keyboardType="numeric"
                />
              ))}

            {isAI && (
              <View style={{ marginTop: 8 }}>
                <FloatingInput
                  label="Describe the split in plain English"
                  value={aiDescription}
                  onChangeText={(t) => {
                    setAiDescription(t);
                    setAiSplits(null);
                    if (errors.ai) setErrors((p) => ({ ...p, ai: null }));
                  }}
                  multiline
                  error={errors.ai}
                />
                <View style={styles.aiHint}>
                  <Ionicons
                    name="sparkles-outline"
                    size={14}
                    color={colors.accent}
                  />
                  <Text style={styles.aiHintText}>
                    e.g. "Today all of us had lunch together. Shivansh had fried
                    rice for 120, while Aditya and I had chole bhature for 80
                    each."
                  </Text>
                </View>
              </View>
            )}

            {previewSplits && previewSplits.length > 0 && (
              <View style={styles.breakdownCard}>
                <View style={styles.breakdownHeader}>
                  <Text style={styles.breakdownTitle}>Split Breakdown</Text>
                  {isAI && (
                    <View style={styles.aiBadge}>
                      <Ionicons
                        name="sparkles"
                        size={10}
                        color={colors.accent}
                      />
                      <Text style={styles.aiBadgeText}>AI</Text>
                    </View>
                  )}
                </View>
                {previewSplits.map((s) => (
                  <View key={s.id} style={styles.breakdownRow}>
                    <View style={styles.breakdownNameRow}>
                      <Text style={styles.breakdownName} numberOfLines={1}>
                        {s.name}
                      </Text>
                      {s.id === paidBy && (
                        <View style={styles.paidBadge}>
                          <Text style={styles.paidBadgeText}>paid</Text>
                        </View>
                      )}
                    </View>
                    {s.pct !== undefined && (
                      <Text style={styles.breakdownMeta}>{s.pct}%</Text>
                    )}
                    {s.ratio !== undefined && (
                      <Text style={styles.breakdownMeta}>{s.ratio}x</Text>
                    )}
                    <Text style={styles.breakdownAmount}>
                      {"₹"}
                      {s.share.toFixed(2)}
                    </Text>
                  </View>
                ))}
                <View style={styles.breakdownTotalRow}>
                  <Text style={styles.breakdownTotalLabel}>Total</Text>
                  <Text
                    style={[
                      styles.breakdownTotalAmount,
                      !isAI &&
                        Math.abs(previewTotal - numAmount) > 0.01 && {
                          color: colors.error,
                        },
                    ]}
                  >
                    {"₹"}
                    {previewTotal.toFixed(2)}
                    {!isAI &&
                      Math.abs(previewTotal - numAmount) > 0.01 &&
                      ` / ₹${numAmount.toFixed(2)}`}
                  </Text>
                </View>
              </View>
            )}

            {isAI && !aiSplits && (
              <View style={{ marginTop: spacing.sm }}>
                <PrimaryButton
                  title="Compute Expense"
                  onPress={handleCompute}
                  loading={loading}
                  disabled={!groupId}
                />
              </View>
            )}

            {isAI && aiSplits && (
              <View style={{ marginTop: spacing.sm }}>
                <PrimaryButton
                  title="Add Expense"
                  onPress={handleAdd}
                  loading={loading}
                  disabled={!groupId}
                />
              </View>
            )}

            {!isAI && (
              <View style={{ marginTop: spacing.sm }}>
                <PrimaryButton
                  title="Add Expense"
                  onPress={handleAdd}
                  loading={loading}
                  disabled={!groupId}
                />
              </View>
            )}
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
  fieldLabel: {
    ...typography.small,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  chipText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  splitTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: spacing.sm,
  },
  payerList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: spacing.sm,
  },
  payerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  payerChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  payerText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  membersList: {
    gap: 8,
    marginBottom: spacing.md,
  },
  memberToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberToggleActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentBg,
  },
  toggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleDotActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  toggleName: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    flex: 1,
  },
  aiHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: 4,
  },
  aiHintText: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
    fontStyle: "italic",
    lineHeight: 18,
  },
  breakdownCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  breakdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  breakdownTitle: {
    ...typography.small,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accentBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  aiBadgeText: {
    ...typography.small,
    color: colors.accent,
    fontSize: 10,
    fontWeight: "700",
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  breakdownNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 6,
    marginRight: spacing.sm,
  },
  paidBadge: {
    backgroundColor: colors.accentBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  paidBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  breakdownName: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  breakdownMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginRight: spacing.md,
  },
  breakdownAmount: {
    ...typography.bodyMedium,
    color: colors.accent,
    fontWeight: "700",
  },
  breakdownTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
    marginTop: 4,
  },
  breakdownTotalLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  breakdownTotalAmount: {
    ...typography.bodyMedium,
    color: colors.accent,
    fontWeight: "700",
  },
});
