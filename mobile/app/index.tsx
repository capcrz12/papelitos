import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../src/components/Button";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>WordWave</Text>
        <Text style={styles.subtitle}>Modo local en un solo dispositivo</Text>
      </View>

      <View style={styles.form}>
        <Button
          title="Crear partida"
          onPress={() => router.push("/config")}
          variant="primary"
          size="large"
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Sin salas, sin websocket, sin esperas
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginTop: 60,
  },
  title: {
    fontSize: 44,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  form: {
    flex: 1,
    justifyContent: "center",
    marginTop: -100,
  },
  footer: {
    alignItems: "center",
    marginBottom: 20,
  },
  footerText: {
    color: "#7f8c8d",
    fontSize: 14,
    textAlign: "center",
  },
});
