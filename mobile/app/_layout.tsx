import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ title: "WordWave" }} />
        <Stack.Screen name="config" options={{ title: "Configurar" }} />
        <Stack.Screen
          name="word-submission"
          options={{ title: "Palabras", headerBackVisible: false }}
        />
        <Stack.Screen
          name="game"
          options={{ title: "Jugando", headerShown: false }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
