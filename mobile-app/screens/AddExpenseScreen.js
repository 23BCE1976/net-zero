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
            style={[styles.payerName, paidBy === m._id && { color: colors.bg }]}
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

  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState(routeGroupId || "");
  const [members, setMembers] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitType, setSplitType] = useState("equal");
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
      (async () => {
        try {
          if (!routeGroupId) {
            const { data } = await api.get("/api/group");
            if (data.success) setGroups(data.data);
          }
        } catch (_) {}
      })();
    }, []),
  );

  useEffect(() => {
    if (!groupId) return;
    (async () => {
      try {
        const { data } = await api.get(`/api/group/${groupId}/members`);
        if (data.success) {
          setMembers(data.data);
          setSelectedMembers(data.data.map((m) => m._id));
          const profileRes = await api.get("/api/user/profile");
          if (profileRes.data.success) setPaidBy(profileRes.data.data._id);
        }
      } catch (_) {
        const { data } = await api.get(`/api/group/${groupId}`);
        if (data.success) {
          const fallback = data.data.members.map((m) => ({
            _id: m.userId,
            name: null,
            balance: m.balance,
          }));
          setMembers(fallback);
          setSelectedMembers(fallback.map((m) => m._id));
        }
      }
    })();
  }, [groupId]);

  const toggleMember = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleAdd = async () => {
    const e = {};
    if (!groupId) e.group = "Select a group";
    if (!title.trim()) e.title = "Title is required";
    if (!amount || Number(amount) <= 0) e.amount = "Enter a valid amount";
    if (!paidBy) e.paidBy = "Select who paid";
    if (selectedMembers.length === 0) e.members = "Select at least one member";
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    const numAmount = Number(amount);
    let splits;
    if (splitType === "equal") {
      const share =
        Math.round((numAmount / selectedMembers.length) * 100) / 100;
      splits = selectedMembers.map((userId) => ({ userId, share }));
      // adjust rounding on last member
      const diff = numAmount - share * selectedMembers.length;
      if (diff !== 0) splits[splits.length - 1].share += diff;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/api/expense", {
        groupId,
        title: title.trim(),
        amount: numAmount,
        paidBy,
        splitType,
        splits,
      });
      if (data.success) {
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to add expense",
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
                  style={styles.groupPicker}
                >
                  {groups.map((g) => (
                    <Pressable
                      key={g._id}
                      onPress={() => setGroupId(g._id)}
                      style={[
                        styles.groupChip,
                        groupId === g._id && styles.groupChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.groupChipText,
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

            <View style={styles.amountCard}>
              <Text style={styles.currencySign}>₹</Text>
              <View style={{ flex: 1 }}>
                <FloatingInput
                  label="Amount"
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
            </View>

            <FloatingInput
              label="What's this for?"
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (errors.title) setErrors((p) => ({ ...p, title: null }));
              }}
              error={errors.title}
            />

            {members.length > 0 && (
              <>
                <Text style={styles.fieldLabel}>Paid by</Text>
                <PayerPicker
                  members={members}
                  paidBy={paidBy}
                  onSelect={setPaidBy}
                />
                {errors.paidBy && (
                  <Text style={styles.errorText}>{errors.paidBy}</Text>
                )}

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

                {selectedMembers.length > 0 && amount && Number(amount) > 0 && (
                  <View style={styles.splitPreview}>
                    <Text style={styles.splitPreviewLabel}>
                      ₹{(Number(amount) / selectedMembers.length).toFixed(2)}{" "}
                      per person
                    </Text>
                    <Text style={styles.splitPreviewSub}>
                      Split equally among {selectedMembers.length}
                    </Text>
                  </View>
                )}
              </>
            )}

            <View style={styles.submitWrap}>
              <PrimaryButton
                title="Add Expense"
                onPress={handleAdd}
                loading={loading}
                disabled={!groupId}
              />
            </View>
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
    marginBottom: spacing.sm,
  },
  groupPicker: { marginBottom: spacing.md },
  groupChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  groupChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  groupChipText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  amountCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  currencySign: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textMuted,
    marginTop: -8,
  },
  payerList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: spacing.md,
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
  payerName: {
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
  splitPreview: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  splitPreviewLabel: {
    ...typography.h2,
    color: colors.accent,
    fontSize: 18,
  },
  splitPreviewSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  submitWrap: {
    marginTop: spacing.sm,
  },
});
