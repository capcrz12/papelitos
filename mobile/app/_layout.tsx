import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ title: "QueRule" }} />
          <Stack.Screen name="teams" options={{ title: "Jugadores" }} />
          <Stack.Screen name="config" options={{ title: "Configurar" }} />
          <Stack.Screen
            name="word-submission"
            options={{ title: "Palabras", headerBackVisible: false }}
          />
          <Stack.Screen
            name="game"
            options={{ title: "Jugando", headerShown: false }}
          />
          <Stack.Screen
            name="final-results"
            options={{ title: "Resultado", headerShown: false }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
