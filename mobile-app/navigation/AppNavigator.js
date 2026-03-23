import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import CheckInboxScreen from "../screens/CheckInboxScreen";
import VerifyEmailScreen from "../screens/VerifyEmailScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import TabNavigator from "./TabNavigator";
import CreateGroupScreen from "../screens/CreateGroupScreen";
import JoinGroupScreen from "../screens/JoinGroupScreen";
import GroupDetailScreen from "../screens/GroupDetailScreen";
import AddExpenseScreen from "../screens/AddExpenseScreen";
import SettleUpScreen from "../screens/SettleUpScreen";
import EditProfileScreen from "../screens/EditProfileScreen";

const Stack = createNativeStackNavigator();
const prefix = Linking.createURL("/");

const linking = {
  prefixes: [prefix, process.env.EXPO_PUBLIC_FRONTEND_URL].filter(Boolean),
  config: {
    screens: {
      VerifyEmail: {
        path: "verify-email",
        parse: {
          code: (code) => code,
        },
      },
      Login: "login",
      Register: "register",
    },
  },
};

const screenOptions = {
  headerShown: false,
  animation: "slide_from_right",
  contentStyle: { backgroundColor: "#0A0A0B" },
};

export default function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen
          name="CheckInbox"
          component={CheckInboxScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen
          name="Home"
          component={TabNavigator}
          options={{ animation: "fade", gestureEnabled: false }}
        />
        <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
        <Stack.Screen name="JoinGroup" component={JoinGroupScreen} />
        <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
        <Stack.Screen name="SettleUp" component={SettleUpScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
