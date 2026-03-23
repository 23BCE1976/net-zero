import { useRef } from "react";
import {
  Pressable,
  Text,
  Animated,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { colors, radius, typography } from "../constants/theme";

export default function PrimaryButton({ title, onPress, loading, disabled }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.965,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const isDisabled = loading || disabled;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[styles.btn, isDisabled && styles.btnDisabled]}
      >
        {loading ? (
          <ActivityIndicator color={colors.bg} size="small" />
        ) : (
          <Text style={styles.text}>{title}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.accent,
    height: 56,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.button,
    color: colors.bg,
  },
});
