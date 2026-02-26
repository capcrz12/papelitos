import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const router = useRouter();

  const createRoom = () => {
    if (playerName.trim()) {
      // TODO: Call API to create room
      router.push("/lobby");
    }
  };

  const joinRoom = () => {
    if (playerName.trim() && roomCode.trim()) {
      // TODO: Call API to join room
      router.push("/lobby");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🌊 WordWave</Text>
        <Text style={styles.subtitle}>Juego de palabras multijugador</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Tu nombre"
          value={playerName}
          onChangeText={setPlayerName}
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.primaryButton} onPress={createRoom}>
          <Text style={styles.primaryButtonText}>Crear Partida</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Código de sala"
          value={roomCode}
          onChangeText={setRoomCode}
          autoCapitalize="characters"
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.secondaryButton} onPress={joinRoom}>
          <Text style={styles.secondaryButtonText}>Unirse a Partida</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Reúne a tus amigos y empieza a jugar
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
    fontSize: 48,
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
  input: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  primaryButton: {
    backgroundColor: "#3498db",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginBottom: 20,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3498db",
  },
  secondaryButtonText: {
    color: "#3498db",
    fontSize: 18,
    fontWeight: "bold",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#999",
    fontSize: 16,
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
