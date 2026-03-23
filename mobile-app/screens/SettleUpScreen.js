import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  Alert,
  StyleSheet,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { colors, spacing, radius, typography } from "../constants/theme";
import FloatingInput from "../components/FloatingInput";
import PrimaryButton from "../components/PrimaryButton";
import api from "../api";

function PersonCard({ member, selected, onPress }) {
  const bal = member.balance || 0;
  const active = selected === member._id;
  return (
    <Pressable
      onPress={() => onPress(member._id)}
      style={[styles.personCard, active && styles.personCardActive]}
    >
      <View style={styles.personAvatar}>
        <Text style={styles.personInitial}>
          {(member.name || "?")[0].toUpperCase()}
        </Text>
      </View>
      <Text style={styles.personName} numberOfLines={1}>
        {member.name || "Unknown"}
      </Text>
      <Text
        style={[
          styles.personBal,
          {
            color:
              bal > 0
                ? colors.accent
                : bal < 0
                  ? colors.error
                  : colors.textMuted,
          },
        ]}
      >
        {bal === 0
          ? "Settled"
          : `${bal > 0 ? "gets" : "owes"} ₹${Math.abs(bal).toLocaleString("en-IN")}`}
      </Text>
      {active && (
        <View style={styles.checkBadge}>
          <Ionicons name="checkmark" size={14} color={colors.bg} />
        </View>
      )}
    </Pressable>
  );
}

export default function SettleUpScreen({ route, navigation }) {
  const routeGroupId = route?.params?.groupId;
  const routeMembers = route?.params?.members;

  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState(routeGroupId || "");
  const [members, setMembers] = useState(routeMembers || []);
  const [userId, setUserId] = useState(null);
  const [receiverId, setReceiverId] = useState("");
  const [amount, setAmount] = useState("");
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
          const profileRes = await api.get("/api/user/profile");
          if (profileRes.data.success) setUserId(profileRes.data.data._id);
          if (!routeGroupId) {
            const { data } = await api.get("/api/group");
            if (data.success) setGroups(data.data);
          }
        } catch (_) {}
      })();
    }, []),
  );

  useEffect(() => {
    if (!groupId || routeMembers) return;
    (async () => {
      try {
        const { data } = await api.get(`/api/group/${groupId}/members`);
        if (data.success) {
          const groupRes = await api.get(`/api/group/${groupId}`);
          const gMembers = groupRes.data?.data?.members || [];
          setMembers(
            data.data.map((m) => {
              const gm = gMembers.find(
                (g) => g.userId === m._id || g.userId?._id === m._id,
              );
              return { ...m, balance: gm?.balance || 0 };
            }),
          );
        }
      } catch (_) {}
    })();
  }, [groupId]);

  const otherMembers = members.filter((m) => m._id !== userId);

  const handlePay = async () => {
    const e = {};
    if (!groupId) e.group = "Select a group";
    if (!receiverId) e.receiver = "Select who you're paying";
    if (!amount || Number(amount) <= 0) e.amount = "Enter a valid amount";
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setLoading(true);
    try {
      const supported = await openUPI();
      if (!supported) return;

      const { data } = await api.post("/api/expense/pay", {
        groupId,
        receiverId,
        amount: Number(amount),
      });
      if (data.success) {
        Alert.alert("Settled!", "Payment recorded successfully", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const openUPI = async () => {
    const upiUrl = process.env.SAMPLE_UPI_URL;
    const supported = await Linking.canOpenURL(upiUrl);

    if (supported) {
      await Linking.openURL(upiUrl);
    } else {
      Alert.alert("Error", "No UPI app found");
    }

    return supported;
  };

  return (
    <SafeAreaView style={styles.safe}>
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
          <Text style={styles.topTitle}>Settle Up</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!routeGroupId && (
            <>
              <Text style={styles.fieldLabel}>Group</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.hScroll}
              >
                {groups.map((g) => (
                  <Pressable
                    key={g._id}
                    onPress={() => {
                      setGroupId(g._id);
                      setReceiverId("");
                    }}
                    style={[
                      styles.gChip,
                      groupId === g._id && styles.gChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.gChipText,
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

          {otherMembers.length > 0 && (
            <>
              <Text style={styles.fieldLabel}>Pay to</Text>
              <View style={styles.personGrid}>
                {otherMembers.map((m) => (
                  <PersonCard
                    key={m._id}
                    member={m}
                    selected={receiverId}
                    onPress={setReceiverId}
                  />
                ))}
              </View>
              {errors.receiver && (
                <Text style={styles.errorText}>{errors.receiver}</Text>
              )}
            </>
          )}

          {receiverId && (
            <>
              <Text style={styles.fieldLabel}>Amount</Text>
              <FloatingInput
                label="₹ Amount"
                value={amount}
                onChangeText={(t) => {
                  setAmount(t.replace(/[^0-9.]/g, ""));
                  if (errors.amount) setErrors((p) => ({ ...p, amount: null }));
                }}
                keyboardType="numeric"
                error={errors.amount}
              />
            </>
          )}

          {receiverId && (
            <PrimaryButton
              title="Pay Now"
              onPress={handlePay}
              loading={loading}
            />
          )}
        </ScrollView>
      </Animated.View>
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
  hScroll: { marginBottom: spacing.md },
  gChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  gChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  gChipText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  personGrid: {
    gap: 10,
    marginBottom: spacing.md,
  },
  personCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 12,
  },
  personCardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentBg,
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  personInitial: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  personName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  personBal: {
    ...typography.caption,
    fontWeight: "600",
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
});
