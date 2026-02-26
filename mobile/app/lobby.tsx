import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';

// Mock data for now
const mockPlayers = [
  { id: '1', name: 'Carlos', team: 1 },
  { id: '2', name: 'Ana', team: 1 },
  { id: '3', name: 'Luis', team: 2 },
  { id: '4', name: 'María', team: 2 },
];

export default function LobbyScreen() {
  const [roomCode, setRoomCode] = useState('ABCD');
  const [players, setPlayers] = useState(mockPlayers);
  const [isHost, setIsHost] = useState(true);
  const router = useRouter();

  const startGame = () => {
    if (players.length < 4) {
      Alert.alert('Error', 'Se necesitan al menos 4 jugadores para comenzar');
      return;
    }
    router.push('/game');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.roomCode}>Código de sala</Text>
        <Text style={styles.code}>{roomCode}</Text>
        <Text style={styles.instruction}>Comparte este código con tus amigos</Text>
      </View>

      <ScrollView style={styles.playersContainer}>
        <Text style={styles.sectionTitle}>Jugadores ({players.length})</Text>
        
        <View style={styles.teamContainer}>
          <Text style={styles.teamTitle}>🔵 Equipo 1</Text>
          {players
            .filter((p) => p.team === 1)
            .map((player) => (
              <View key={player.id} style={styles.playerCard}>
                <Text style={styles.playerName}>{player.name}</Text>
              </View>
            ))}
        </View>

        <View style={styles.teamContainer}>
          <Text style={styles.teamTitle}>🔴 Equipo 2</Text>
          {players
            .filter((p) => p.team === 2)
            .map((player) => (
              <View key={player.id} style={styles.playerCard}>
                <Text style={styles.playerName}>{player.name}</Text>
              </View>
            ))}
        </View>
      </ScrollView>

      <View style={styles.settingsContainer}>
        <Text style={styles.sectionTitle}>Configuración</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Tiempo por turno:</Text>
          <Text style={styles.settingValue}>60s</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Palabras por jugador:</Text>
          <Text style={styles.settingValue}>3</Text>
        </View>
      </View>

      {isHost && (
        <TouchableOpacity style={styles.startButton} onPress={startGame}>
          <Text style={styles.startButtonText}>Comenzar Juego</Text>
        </TouchableOpacity>
      )}

      {!isHost && (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>Esperando al anfitrión...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
  },
  roomCode: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  code: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2c3e50',
    letterSpacing: 4,
  },
  instruction: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 5,
  },
  playersContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  teamContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  teamTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  playerCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  playerName: {
    fontSize: 16,
    color: '#2c3e50',
  },
  settingsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  settingValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  startButton: {
    backgroundColor: '#27ae60',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  waitingContainer: {
    backgroundColor: '#ecf0f1',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  waitingText: {
    color: '#7f8c8d',
    fontSize: 16,
  },
});
