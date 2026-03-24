import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  Animated,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { colors, spacing, radius, typography } from "../constants/theme";
import { getGroupMeta } from "../constants/groupMeta";
import api from "../api";

const { width: SCREEN_W } = Dimensions.get("window");

function BalanceCard({ youOwe, youAreOwed }) {
  const net = youAreOwed - youOwe;
  const positive = net >= 0;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <View style={styles.balanceCard}>
      <View style={styles.balanceGlow}>
        <Animated.View
          style={[
            styles.glowDot,
            {
              backgroundColor: positive ? colors.accent : colors.error,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      </View>

      <Text style={styles.balanceLabel}>Net Balance</Text>
      <Text
        style={[
          styles.balanceAmount,
          { color: positive ? colors.accent : colors.error },
        ]}
      >
        ₹{Math.abs(net).toLocaleString("en-IN")}
      </Text>
      <Text style={styles.balanceHint}>
        {net === 0
          ? "You're all settled up!"
          : positive
            ? "You are owed money"
            : "You owe money"}
      </Text>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
      <Pressable
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(scaleAnim, {
            toValue: 0.92,
            useNativeDriver: true,
            speed: 50,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 30,
            bounciness: 6,
          }).start()
        }
        style={styles.actionBtn}
      >
        <View style={[styles.actionIcon, { backgroundColor: color + "18" }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function GroupRow({ group, userId, onPress }) {
  const meta = getGroupMeta(group.type);
  const me = group.members?.find((m) => m.id === userId);
  const bal = me?.balance || 0;

  return (
    <Pressable onPress={onPress} style={styles.groupRow}>
      <View style={[styles.groupIcon, { backgroundColor: meta.color + "18" }]}>
        <Ionicons name={meta.icon} size={20} color={meta.color} />
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName} numberOfLines={1}>
          {group.name}
        </Text>
        <Text style={styles.groupMembers}>
          {group.members?.length || 0} member
          {group.members?.length !== 1 ? "s" : ""}
        </Text>
      </View>
      <View style={styles.groupBalWrap}>
        {bal === 0 ? (
          <Text style={[styles.groupBal, { color: colors.textMuted }]}>
            Settled
          </Text>
        ) : (
          <Text
            style={[
              styles.groupBal,
              { color: bal > 0 ? colors.accent : colors.error },
            ]}
          >
            {bal > 0 ? "+" : "-"}₹{Math.abs(bal).toLocaleString("en-IN")}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchData = async () => {
    try {
      const [profileRes, groupsRes] = await Promise.all([
        api.get("/api/user/profile"),
        api.get("/api/group"),
      ]);
      if (profileRes.data.success) setUser(profileRes.data.data);
      if (groupsRes.data.success) setGroups(groupsRes.data.data);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const userId = user?._id;

  let youOwe = 0;
  let youAreOwed = 0;
  groups.forEach((g) => {
    const me = g.members?.find((m) => m.id === userId);
    if (!me) return;
    if (me.balance > 0) youAreOwed += me.balance;
    else youOwe += Math.abs(me.balance);
  });

  const recentGroups = [...groups]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
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

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Animated.View
        style={[
          styles.flex,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
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
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{greeting()}</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name || "there"}
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate("ProfileTab")}
              style={styles.avatarWrap}
            >
              <Image source={{ uri: user?.avatarUrl }} style={styles.avatar} />
            </Pressable>
          </View>

          <BalanceCard youOwe={youOwe} youAreOwed={youAreOwed} />

          <View style={styles.actionsRow}>
            <QuickAction
              icon="add-circle-outline"
              label="Expense"
              color="#5B8DEF"
              onPress={() => navigation.navigate("AddExpense", { userId })}
            />
            <QuickAction
              icon="swap-horizontal-outline"
              label="Settle Up"
              color={colors.accent}
              onPress={() => navigation.navigate("SettleUp", { userId })}
            />
            <QuickAction
              icon="people-outline"
              label="New Group"
              color="#AB47BC"
              onPress={() => navigation.navigate("CreateGroup")}
            />
          </View>

          {recentGroups.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Groups</Text>
                <Pressable
                  onPress={() => navigation.navigate("GroupsTab")}
                  hitSlop={8}
                >
                  <Text style={styles.seeAll}>See all</Text>
                </Pressable>
              </View>
              {recentGroups.map((g) => (
                <GroupRow
                  key={g._id}
                  group={g}
                  userId={userId}
                  onPress={() =>
                    navigation.navigate("GroupDetail", {
                      groupId: g._id,
                      userId,
                    })
                  }
                />
              ))}
            </View>
          )}

          {groups.length === 0 && (
            <View style={styles.emptyWrap}>
              <Ionicons name="people-outline" size={48} color={colors.border} />
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptyBody}>
                Create a group to start splitting expenses with your friends
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  userName: {
    ...typography.h1,
    color: colors.textPrimary,
    maxWidth: SCREEN_W - 100,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },

  balanceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  balanceGlow: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  glowDot: {
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.15,
  },
  balanceLabel: {
    ...typography.small,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1.5,
    marginBottom: spacing.xs,
  },
  balanceHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  breakdownItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownLabel: {
    ...typography.small,
    color: colors.textMuted,
    marginBottom: 2,
  },
  breakdownValue: {
    ...typography.bodyMedium,
    fontWeight: "700",
  },
  breakdownDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: spacing.xl,
  },
  actionBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  actionLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },

  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  seeAll: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: "600",
  },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  groupMembers: {
    ...typography.caption,
    color: colors.textMuted,
  },
  groupBalWrap: {
    marginLeft: spacing.sm,
  },
  groupBal: {
    ...typography.bodyMedium,
    fontWeight: "700",
  },

  emptyWrap: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.textSecondary,
  },
  emptyBody: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    maxWidth: 260,
  },
});
