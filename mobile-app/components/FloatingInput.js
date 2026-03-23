import { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  Animated,
  Pressable,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, typography } from "../constants/theme";

export default function FloatingInput({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "none",
  error,
}) {
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);

  const isActive = focused || value?.length > 0;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(labelAnim, {
        toValue: isActive ? 1 : 0,
        duration: 180,
        useNativeDriver: false,
      }),
      Animated.timing(borderAnim, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [focused, value]);

  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 8],
  });

  const labelSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 11],
  });

  const borderColor = error
    ? colors.error
    : borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.border, colors.accent],
      });

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.container, { borderColor }]}>
        <Pressable
          style={styles.pressable}
          onPress={() => inputRef.current?.focus()}
        >
          <Animated.Text
            style={[
              styles.label,
              {
                top: labelTop,
                fontSize: labelSize,
                color: error
                  ? colors.error
                  : focused
                    ? colors.accent
                    : colors.textMuted,
              },
            ]}
          >
            {label}
          </Animated.Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            secureTextEntry={secureTextEntry && !passwordVisible}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            selectionColor={colors.accent}
            cursorColor={colors.accent}
          />
        </Pressable>
        {secureTextEntry && (
          <Pressable
            onPress={() => setPasswordVisible((v) => !v)}
            style={styles.eyeBtn}
            hitSlop={12}
          >
            <Ionicons
              name={passwordVisible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </Animated.View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 58,
  },
  pressable: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
    minHeight: 58,
  },
  label: {
    position: "absolute",
    left: 16,
    fontWeight: "500",
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    paddingTop: 22,
    paddingBottom: 8,
    margin: 0,
    padding: 0,
    paddingHorizontal: 0,
  },
  eyeBtn: {
    paddingRight: 16,
    paddingLeft: 8,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginTop: 6,
    marginLeft: 4,
  },
});
