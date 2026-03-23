import { View, StyleSheet } from "react-native";

export default function Orbs() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.orb, styles.orbTopRight]} />
      <View style={[styles.orb, styles.orbBottomLeft]} />
      <View style={[styles.orb, styles.orbCenter]} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: "absolute",
    borderRadius: 9999,
  },
  orbTopRight: {
    width: 280,
    height: 280,
    top: -80,
    right: -90,
    backgroundColor: "rgba(0, 214, 143, 0.06)",
  },
  orbBottomLeft: {
    width: 220,
    height: 220,
    bottom: 60,
    left: -100,
    backgroundColor: "rgba(0, 214, 143, 0.04)",
  },
  orbCenter: {
    width: 160,
    height: 160,
    top: "40%",
    right: -40,
    backgroundColor: "rgba(0, 214, 143, 0.03)",
  },
});
