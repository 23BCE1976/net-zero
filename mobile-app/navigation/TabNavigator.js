import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { colors } from "../constants/theme";

import HomeScreen from "../screens/HomeScreen";
import GroupsScreen from "../screens/GroupsScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  HomeTab: { focused: "wallet", unfocused: "wallet-outline" },
  GroupsTab: { focused: "people", unfocused: "people-outline" },
  ProfileTab: { focused: "person-circle", unfocused: "person-circle-outline" },
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          return (
            <View style={styles.iconWrap}>
              {focused && <View style={styles.activeIndicator} />}
              <Ionicons
                name={focused ? icons.focused : icons.unfocused}
                size={22}
                color={color}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: "Home" }}
      />
      <Tab.Screen
        name="GroupsTab"
        component={GroupsScreen}
        options={{ tabBarLabel: "Groups" }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 72,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    top: -8,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
});
