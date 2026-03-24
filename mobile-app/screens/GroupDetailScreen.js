import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  Animated,
  Share,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { colors, spacing, radius, typography } from "../constants/theme";
import { getGroupMeta } from "../constants/groupMeta";
import api from "../api";

function MemberRow({ member, isAdmin }) {
  const bal = member.balance || 0;
  return (
    <View style={styles.memberRow}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberInitial}>
          {(member.name || "?")[0].toUpperCase()}
        </Text>
      </View>
      <View style={styles.memberInfo}>
        <View style={styles.memberNameRow}>
          <Text style={styles.memberName} numberOfLines={1}>
            {member.name || "Unknown"}
          </Text>
          {isAdmin && (
            <View style={styles.adminTag}>
              <Text style={styles.adminTagText}>Admin</Text>
            </View>
          )}
        </View>
        <Text style={styles.memberEmail} numberOfLines={1}>
          {member.email || ""}
        </Text>
      </View>
      <Text
        style={[
          styles.memberBal,
          {
            color:
              bal === 0
                ? colors.textMuted
                : bal > 0
                  ? colors.accent
                  : colors.error,
          },
        ]}
      >
        {bal === 0
          ? "Settled"
          : `${bal > 0 ? "+" : "-"}₹${Math.abs(bal).toLocaleString("en-IN")}`}
      </Text>
    </View>
  );
}

function ExpenseRow({ expense, members }) {
  const payer = members.find((m) => m.id === expense.paidBy);
  return (
    <View style={styles.expenseRow}>
      <View style={styles.expenseIcon}>
        <Ionicons name="receipt-outline" size={18} color={colors.warning} />
      </View>
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseTitle} numberOfLines={1}>
          {expense.title || "Untitled"}
        </Text>
        <Text style={styles.expensePayer}>
          Paid by {payer?.name || "someone"}
        </Text>
      </View>
      <Text style={styles.expenseAmount}>
        ₹{expense.amount?.toLocaleString("en-IN")}
      </Text>
    </View>
  );
}

export default function GroupDetailScreen({ route, navigation }) {
  const { groupId, userId } = route.params;
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("members");

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchData = async () => {
    try {
      const [groupRes, expensesRes] = await Promise.all([
        api.get(`/api/group/${groupId}`),
        api.get("/api/expense", { params: { groupId } }),
      ]);
      if (groupRes.data.success) setGroup(groupRes.data.data);
      if (expensesRes.data.success) setExpenses(expensesRes.data.data);
    } catch (_) {}
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [groupId]),
  );

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleShare = async () => {
    if (!group?.joinCode) return;
    try {
      await Share.share({
        message: `Join my group "${group.name}" on Net Zero!\n\nInvite code: ${group.joinCode}`,
      });
    } catch (_) {}
  };

  const handleLeave = () => {
    Alert.alert(
      "Leave group",
      `Are you sure you want to leave "${group?.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await api.post("/api/group/leave", { groupId });
              navigation.goBack();
            } catch (err) {
              Alert.alert(
                "Error",
                err.response?.data?.message || "Couldn't leave",
              );
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const meta = getGroupMeta(group?.type);
  const isAdmin = group?.admin === userId;
  const groupMembers = group?.members || [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
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
          <View style={styles.topActions}>
            <Pressable
              onPress={handleShare}
              style={styles.topAction}
              hitSlop={8}
            >
              <Ionicons
                name="share-outline"
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
            {!isAdmin && (
              <Pressable
                onPress={handleLeave}
                style={styles.topAction}
                hitSlop={8}
              >
                <Ionicons name="exit-outline" size={20} color={colors.error} />
              </Pressable>
            )}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        >
          <View style={styles.heroCard}>
            <View
              style={[styles.heroIcon, { backgroundColor: meta.color + "18" }]}
            >
              <Ionicons name={meta.icon} size={26} color={meta.color} />
            </View>
            <Text style={styles.heroName}>{group?.name}</Text>
            <View style={styles.heroMeta}>
              <View
                style={[
                  styles.typeChip,
                  { backgroundColor: meta.color + "18" },
                ]}
              >
                <Text style={[styles.typeLabel, { color: meta.color }]}>
                  {group?.type || "other"}
                </Text>
              </View>
              <Text style={styles.heroMemCount}>
                {group?.members?.length || 0} members
              </Text>
            </View>
          </View>

          <View style={styles.quickRow}>
            <Pressable
              onPress={() =>
                navigation.navigate("AddExpense", {
                  groupId,
                  groupName: group?.name,
                  userId,
                })
              }
              style={styles.quickBtn}
            >
              <Ionicons name="add-circle-outline" size={20} color="#5B8DEF" />
              <Text style={[styles.quickLabel, { color: "#5B8DEF" }]}>
                Add Expense
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                navigation.navigate("SettleUp", {
                  groupId,
                  members: groupMembers,
                  userId,
                })
              }
              style={styles.quickBtn}
            >
              <Ionicons
                name="swap-horizontal-outline"
                size={20}
                color={colors.accent}
              />
              <Text style={[styles.quickLabel, { color: colors.accent }]}>
                Settle Up
              </Text>
            </Pressable>
          </View>

          <View style={styles.tabBar}>
            {["members", "expenses"].map((t) => (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={[styles.tabItem, tab === t && styles.tabActive]}
              >
                <Text
                  style={[styles.tabText, tab === t && styles.tabTextActive]}
                >
                  {t === "members" ? "Members" : "Expenses"}
                </Text>
              </Pressable>
            ))}
          </View>

          {tab === "members" &&
            groupMembers.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                isAdmin={group?.admin === m.id}
              />
            ))}

          {tab === "expenses" && expenses.length === 0 && (
            <View style={styles.emptyWrap}>
              <Ionicons
                name="receipt-outline"
                size={40}
                color={colors.border}
              />
              <Text style={styles.emptyText}>No expenses yet</Text>
            </View>
          )}

          {tab === "expenses" &&
            [...expenses]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((e) => (
                <ExpenseRow key={e._id} expense={e} members={groupMembers} />
              ))}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { ...typography.body, color: colors.textMuted },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  topActions: { flexDirection: "row", gap: 8 },
  topAction: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  heroName: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  heroMeta: { flexDirection: "row", alignItems: "center", gap: 12 },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  typeLabel: {
    ...typography.small,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  heroMemCount: { ...typography.caption, color: colors.textMuted },

  quickRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: spacing.lg,
  },
  quickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickLabel: {
    ...typography.small,
    fontWeight: "700",
  },

  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.surfaceElevated,
  },
  tabText: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: "600",
  },
  tabTextActive: {
    color: colors.textPrimary,
  },

  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  memberInitial: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  memberInfo: { flex: 1 },
  memberNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  memberName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  memberEmail: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  adminTag: {
    backgroundColor: colors.accentBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  adminTagText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  memberBal: {
    ...typography.bodyMedium,
    fontWeight: "700",
    marginLeft: spacing.sm,
  },

  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.warningBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  expenseInfo: { flex: 1 },
  expenseTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  expensePayer: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  expenseAmount: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: "700",
    marginLeft: spacing.sm,
  },

  emptyWrap: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
