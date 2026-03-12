import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { MotiView } from "moti";

interface LoadingOverlayProps {
  visible: boolean;
  title?: string;
}

export function LoadingOverlay({
  visible,
  title = "Preparando partida...",
}: LoadingOverlayProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.dotsRow}>
            {[0, 1, 2].map((index) => (
              <MotiView
                key={index}
                from={{ opacity: 0.35, translateY: 0, scale: 0.9 }}
                animate={{ opacity: 1, translateY: -6, scale: 1.05 }}
                transition={{
                  type: "timing",
                  duration: 500,
                  loop: true,
                  repeatReverse: true,
                  delay: index * 120,
                }}
                style={styles.dot}
              />
            ))}
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 20,
    minWidth: 220,
    alignItems: "center",
    gap: 14,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2563eb",
  },
  title: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
  },
});
