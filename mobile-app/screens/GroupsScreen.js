import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  RefreshControl,
  Animated,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { colors, spacing, radius, typography } from "../constants/theme";
import { getGroupMeta } from "../constants/groupMeta";
import api from "../api";

function GroupCard({ group, userId, onPress }) {
  const meta = getGroupMeta(group.type);
  const me = group.members?.find((m) => m.id === userId);
  const bal = me?.balance || 0;
  const isAdmin = group.admin === userId;

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.typeChip, { backgroundColor: meta.color + "18" }]}>
          <Ionicons name={meta.icon} size={16} color={meta.color} />
          <Text style={[styles.typeLabel, { color: meta.color }]}>
            {group.type || "other"}
          </Text>
        </View>
        {isAdmin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminText}>Admin</Text>
          </View>
        )}
      </View>

      <Text style={styles.cardName} numberOfLines={1}>
        {group.name}
      </Text>

      <View style={styles.cardBottom}>
        <View style={styles.membersRow}>
          <Ionicons name="people-outline" size={14} color={colors.textMuted} />
          <Text style={styles.membersText}>{group.members?.length || 0}</Text>
        </View>

        {bal === 0 ? (
          <View style={styles.settledChip}>
            <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
            <Text style={[styles.chipText, { color: colors.accent }]}>
              Settled
            </Text>
          </View>
        ) : (
          <Text
            style={[
              styles.cardBal,
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

export default function GroupsScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  const [userId, setUserId] = useState(null);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchData = async () => {
    try {
      const [profileRes, groupsRes] = await Promise.all([
        api.get("/api/user/profile"),
        api.get("/api/group"),
      ]);
      if (profileRes.data.success) setUserId(profileRes.data.data._id);
      if (groupsRes.data.success) setGroups(groupsRes.data.data);
    } catch (err) {
      // silent
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Groups</Text>
          <Pressable
            onPress={() => navigation.navigate("JoinGroup")}
            style={styles.joinBtn}
            hitSlop={8}
          >
            <Ionicons name="enter-outline" size={20} color={colors.accent} />
            <Text style={styles.joinText}>Join</Text>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            selectionColor={colors.accent}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          )}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          renderItem={({ item }) => (
            <GroupCard
              group={item}
              userId={userId}
              onPress={() =>
                navigation.navigate("GroupDetail", {
                  groupId: item._id,
                  userId,
                })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons
                name="folder-open-outline"
                size={44}
                color={colors.border}
              />
              <Text style={styles.emptyTitle}>
                {search ? "No matches" : "No groups yet"}
              </Text>
              <Text style={styles.emptyBody}>
                {search
                  ? "Try a different search term"
                  : "Create or join a group to get started"}
              </Text>
            </View>
          }
        />

        <Pressable
          onPress={() => navigation.navigate("CreateGroup")}
          style={styles.fab}
        >
          <Ionicons name="add" size={28} color={colors.bg} />
        </Pressable>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accentBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  joinText: {
    ...typography.small,
    color: colors.accent,
    fontWeight: "700",
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    padding: 0,
  },

  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  typeLabel: {
    ...typography.small,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  adminBadge: {
    backgroundColor: colors.accentBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  adminText: {
    ...typography.small,
    color: colors.accent,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  cardName: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    fontSize: 18,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  membersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  membersText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  settledChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chipText: {
    ...typography.small,
    fontWeight: "600",
  },
  cardBal: {
    ...typography.bodyMedium,
    fontWeight: "700",
  },

  fab: {
    position: "absolute",
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  emptyWrap: {
    alignItems: "center",
    paddingTop: spacing.xxxl,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.textSecondary,
    fontSize: 18,
  },
  emptyBody: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    maxWidth: 240,
  },
});
