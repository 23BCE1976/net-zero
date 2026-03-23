import { useState, useCallback } from "react";
import { View, Text, Pressable, Image, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, CommonActions } from "@react-navigation/native";
import { colors, spacing, radius, typography } from "../constants/theme";
import api from "../api";

function MenuItem({ icon, label, onPress, danger }) {
  return (
    <Pressable onPress={onPress} style={styles.menuItem}>
      <Ionicons
        name={icon}
        size={20}
        color={danger ? colors.error : colors.textSecondary}
      />
      <Text style={[styles.menuLabel, danger && { color: colors.error }]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const { data } = await api.get("/api/user/profile");
          if (data.success) setUser(data.data);
        } catch (_) {}
      })();
    }, []),
  );

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          try {
            await api.post("/api/user/logout");
          } catch (_) {}
          navigation.dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: "Login" }] }),
          );
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.screenTitle}>Profile</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: user?.avatarUrl }} style={styles.avatar} />
          </View>
          <Text style={styles.name}>{user?.name || "—"}</Text>
          <Text style={styles.email}>{user?.email?.value || "—"}</Text>
        </View>

        <View style={styles.menu}>
          <MenuItem
            icon="person-outline"
            label="Edit Profile"
            onPress={() => navigation.navigate("EditProfile")}
          />
          <MenuItem
            icon="log-out-outline"
            label="Log Out"
            onPress={handleLogout}
            danger
          />
        </View>
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
    paddingHorizontal: spacing.lg,
  },
  screenTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    paddingTop: spacing.md,
    marginBottom: spacing.xl,
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.accent,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  name: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 12,
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  menuLabel: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
  },
});
