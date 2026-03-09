import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Input } from "../src/components/Input";
import { Button } from "../src/components/Button";

export default function HomeScreen() {
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const createRoom = () => {
    if (!playerName.trim()) {
      setError("Por favor ingresa tu nombre");
      return;
    }
    setError("");
    // Pass player name to config screen
    router.push({
      pathname: "/config",
      params: { playerName: playerName.trim() },
    });
  };

  const joinRoom = () => {
    if (!playerName.trim()) {
      setError("Por favor ingresa tu nombre");
      return;
    }
    if (!roomCode.trim()) {
      setError("Por favor ingresa el código de sala");
      return;
    }
    setError("");
    // TODO: Call API to join room, then navigate to lobby
    router.push({
      pathname: "/lobby",
      params: {
        playerName: playerName.trim(),
        roomCode: roomCode.trim().toUpperCase(),
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🌊 WordWave</Text>
        <Text style={styles.subtitle}>Juego de palabras multijugador</Text>
      </View>

      <View style={styles.form}>
        <Input
          placeholder="Tu nombre"
          value={playerName}
          onChangeText={(text) => {
            setPlayerName(text);
            setError("");
          }}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button
          title="Crear Partida"
          onPress={createRoom}
          variant="primary"
          size="large"
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>

        <Input
          placeholder="Código de sala"
          value={roomCode}
          onChangeText={setRoomCode}
          autoCapitalize="characters"
        />

        <Button
          title="Unirse a Partida"
          onPress={joinRoom}
          variant="secondary"
          size="large"
        />
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
  errorText: {
    color: "#e74c3c",
    fontSize: 14,
    marginBottom: 12,
    marginTop: -8,
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
