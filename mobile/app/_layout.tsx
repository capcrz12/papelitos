import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'WordWave' }} />
        <Stack.Screen name="lobby" options={{ title: 'Sala' }} />
        <Stack.Screen name="game" options={{ title: 'Jugando', headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
