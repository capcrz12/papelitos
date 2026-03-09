import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../src/components/Button";
import { Input } from "../src/components/Input";

export default function ConfigScreen() {
  const router = useRouter();
  const [config, setConfig] = useState({
    timePerTurn: 60,
    wordsPerPlayer: 3,
    maxPlayers: 8,
    useCategories: false,
    allowPlayerWords: true,
    rounds: [true, true, true, true], // 4 rounds: Description, One Word, Mime, Sounds
  });

  const timeOptions = [30, 45, 60, 90, 120];
  const wordsOptions = [2, 3, 4, 5, 6];
  const playerOptions = [4, 6, 8, 10, 12];

  const toggleRound = (index: number) => {
    const newRounds = [...config.rounds];
    newRounds[index] = !newRounds[index];
    setConfig({ ...config, rounds: newRounds });
  };

  const handleCreateRoom = async () => {
    // TODO: Call API to create room with config
    console.log("Creating room with config:", config);
    router.push("/lobby");
  };

  const roundNames = [
    "Ronda 1: Descripción",
    "Ronda 2: Una Palabra",
    "Ronda 3: Mímica",
    "Ronda 4: Sonidos",
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Configuración de Partida</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Time per turn */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏱️ Tiempo por turno</Text>
          <View style={styles.optionsContainer}>
            {timeOptions.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.optionButton,
                  config.timePerTurn === time && styles.optionButtonActive,
                ]}
                onPress={() => setConfig({ ...config, timePerTurn: time })}
              >
                <Text
                  style={[
                    styles.optionText,
                    config.timePerTurn === time && styles.optionTextActive,
                  ]}
                >
                  {time}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Words per player */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Palabras por jugador</Text>
          <View style={styles.optionsContainer}>
            {wordsOptions.map((words) => (
              <TouchableOpacity
                key={words}
                style={[
                  styles.optionButton,
                  config.wordsPerPlayer === words && styles.optionButtonActive,
                ]}
                onPress={() =>
                  setConfig({ ...config, wordsPerPlayer: words })
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    config.wordsPerPlayer === words && styles.optionTextActive,
                  ]}
                >
                  {words}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Max players */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Número máximo de jugadores</Text>
          <View style={styles.optionsContainer}>
            {playerOptions.map((players) => (
              <TouchableOpacity
                key={players}
                style={[
                  styles.optionButton,
                  config.maxPlayers === players && styles.optionButtonActive,
                ]}
                onPress={() => setConfig({ ...config, maxPlayers: players })}
              >
                <Text
                  style={[
                    styles.optionText,
                    config.maxPlayers === players && styles.optionTextActive,
                  ]}
                >
                  {players}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rounds selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎮 Rondas activas</Text>
          {roundNames.map((name, index) => (
            <View key={index} style={styles.switchRow}>
              <Text style={styles.switchLabel}>{name}</Text>
              <Switch
                value={config.rounds[index]}
                onValueChange={() => toggleRound(index)}
                trackColor={{ false: "#d1d5db", true: "#4ade80" }}
                thumbColor={config.rounds[index] ? "#22c55e" : "#f3f4f6"}
              />
            </View>
          ))}
        </View>

        {/* Word source */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Origen de las palabras</Text>
          
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Categorías predefinidas</Text>
              <Text style={styles.switchDescription}>
                Animales, películas, países, etc.
              </Text>
            </View>
            <Switch
              value={config.useCategories}
              onValueChange={(value) =>
                setConfig({ ...config, useCategories: value })
              }
              trackColor={{ false: "#d1d5db", true: "#4ade80" }}
              thumbColor={config.useCategories ? "#22c55e" : "#f3f4f6"}
            />
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Los jugadores crean palabras</Text>
              <Text style={styles.switchDescription}>
                Cada jugador añade sus propias palabras
              </Text>
            </View>
            <Switch
              value={config.allowPlayerWords}
              onValueChange={(value) =>
                setConfig({ ...config, allowPlayerWords: value })
              }
              trackColor={{ false: "#d1d5db", true: "#4ade80" }}
              thumbColor={config.allowPlayerWords ? "#22c55e" : "#f3f4f6"}
            />
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>📋 Resumen</Text>
          <Text style={styles.summaryText}>
            • Turnos de {config.timePerTurn} segundos{"\n"}
            • {config.wordsPerPlayer} palabras por jugador{"\n"}
            • Hasta {config.maxPlayers} jugadores{"\n"}
            • {config.rounds.filter((r) => r).length} rondas activas
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Crear Partida"
          onPress={handleCreateRoom}
          variant="primary"
          size="large"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "white",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: "#3b82f6",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "white",
  },
  optionButtonActive: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  optionText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
  optionTextActive: {
    color: "#3b82f6",
    fontWeight: "700",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  switchLabel: {
    fontSize: 16,
    color: "#1f2937",
  },
  switchDescription: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  summarySection: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#166534",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: "#166534",
    lineHeight: 22,
  },
  footer: {
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
});
