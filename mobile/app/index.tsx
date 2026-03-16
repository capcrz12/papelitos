import React, { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "../src/components/Button";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  const insets = useSafeAreaInsets();

  const anim0 = useRef(new Animated.Value(0)).current;
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(anim0, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(anim1, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(anim2, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={["#fff4d9", "#ffe4d6", "#f7f7ff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View pointerEvents="none" style={styles.backgroundLayer}>
        <View style={[styles.glowOrb, styles.glowOrbTop]} />
        <View style={[styles.glowOrb, styles.glowOrbMiddle]} />
        <View style={[styles.glowOrb, styles.glowOrbBottom]} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <View
          style={[
            styles.content,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 132 },
          ]}
        >
          <Animated.View
            style={[
              styles.heroCard,
              {
                opacity: anim0,
                transform: [
                  {
                    translateY: anim0.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Papelitos digitales</Text>
            </View>

            <Text style={styles.title}>QueRule</Text>
            <Text style={styles.subtitle}>
              Rondas rápidas, equipos cara a cara y palabras que convierten el
              salón en caos organizado.
            </Text>

            <View
              style={[
                styles.previewBoard,
                isCompact && styles.previewBoardCompact,
              ]}
            >
              <LinearGradient
                colors={["#0f172a", "#1e293b"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.previewCard,
                  isCompact && styles.previewCardCompact,
                ]}
              >
                <Text style={styles.previewLabel}>4 rondas</Text>
                <Text style={styles.previewWord}>DESCRIPCIONES</Text>
                <Text style={styles.previewWord}>PALABRA</Text>
                <Text style={styles.previewWord}>MÍMICA</Text>
                <Text style={styles.previewWord}>SONIDOS</Text>
              </LinearGradient>

              <View
                style={[
                  styles.previewSideColumn,
                  isCompact && styles.previewSideColumnCompact,
                ]}
              >
                <View
                  style={[
                    styles.previewMiniCard,
                    styles.previewMiniBlue,
                    isCompact && styles.previewMiniCardCompact,
                  ]}
                >
                  <Text style={styles.previewMiniLabel}>Equipo 1</Text>
                  <Text style={styles.previewMiniValue}>AZUL</Text>
                </View>
                <View
                  style={[
                    styles.previewMiniCard,
                    styles.previewMiniRed,
                    isCompact && styles.previewMiniCardCompact,
                  ]}
                >
                  <Text style={styles.previewMiniLabel}>Equipo 2</Text>
                  <Text style={styles.previewMiniValue}>ROJO</Text>
                </View>
              </View>
            </View>

            <Text style={styles.helperText}>
              Configura equipos, reparte el teléfono y empieza en menos de un
              minuto.
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.bottomPanel,
              {
                opacity: anim1,
                transform: [
                  {
                    translateY: anim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [24, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>Cómo fluye</Text>
            <View
              style={[
                styles.featureList,
                isCompact && styles.featureListCompact,
              ]}
            >
              <View
                style={[
                  styles.featureCard,
                  isCompact && styles.featureCardCompact,
                ]}
              >
                <Text style={styles.featureStep}>01</Text>
                <Text style={styles.featureTitle}>Crea equipos</Text>
                <Text style={styles.featureText}>
                  Reparte los jugadores en dos equipos para enfrentarse.
                </Text>
              </View>
              <View
                style={[
                  styles.featureCard,
                  isCompact && styles.featureCardCompact,
                ]}
              >
                <Text style={styles.featureStep}>02</Text>
                <Text style={styles.featureTitle}>Configura la partida</Text>
                <Text style={styles.featureText}>
                  Cambia el juego, los tiempos, y el número de palabras.
                </Text>
              </View>
              <View
                style={[
                  styles.featureCard,
                  isCompact && styles.featureCardCompact,
                ]}
              >
                <Text style={styles.featureStep}>03</Text>
                <Text style={styles.featureTitle}>Entrega el móvil</Text>
                <Text style={styles.featureText}>
                  Ve pasando el móvil a los jugadores para que escriban palabras
                  de cualquier categoría.
                </Text>
              </View>
              <View
                style={[
                  styles.featureCard,
                  isCompact && styles.featureCardCompact,
                ]}
              >
                <Text style={styles.featureStep}>04</Text>
                <Text style={styles.featureTitle}>Jugamos</Text>
                <Text style={styles.featureText}>
                  Un jugador describe y el resto del equipo resuelve tantas
                  palabras como puedan en su turno. Para pasar de ronda se
                  tienen que acabar todas las palabras. El equipo con más
                  palabras acertadas gana la ronda.
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.bottomPanel,
              {
                opacity: anim2,
                transform: [
                  {
                    translateY: anim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [28, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>Las rondas</Text>
            <View
              style={[
                styles.featureList,
                isCompact && styles.featureListCompact,
              ]}
            >
              <View
                style={[
                  styles.roundCard,
                  isCompact && styles.featureCardCompact,
                ]}
              >
                <Text style={styles.roundStep}>Ronda 1</Text>
                <Text style={styles.roundTitle}>Descripción</Text>
                <Text style={styles.roundText}>
                  Describe la palabra sin mencionar la propia palabra ni partes
                  de ella.
                </Text>
              </View>
              <View
                style={[
                  styles.roundCard,
                  isCompact && styles.featureCardCompact,
                ]}
              >
                <Text style={styles.roundStep}>Ronda 2</Text>
                <Text style={styles.roundTitle}>Una palabra</Text>
                <Text style={styles.roundText}>
                  Solo puedes decir una única palabra para describirla, sin
                  mencionar la propia palabra.
                </Text>
              </View>
              <View
                style={[
                  styles.roundCard,
                  isCompact && styles.featureCardCompact,
                ]}
              >
                <Text style={styles.roundStep}>Ronda 3</Text>
                <Text style={styles.roundTitle}>Mímica</Text>
                <Text style={styles.roundText}>
                  Todo vale menos hablar: está prohibido hacer cualquier tipo de
                  ruido.
                </Text>
              </View>
              <View
                style={[
                  styles.roundCard,
                  isCompact && styles.featureCardCompact,
                ]}
              >
                <Text style={styles.roundStep}>Ronda 4</Text>
                <Text style={styles.roundTitle}>Sonidos</Text>
                <Text style={styles.roundText}>
                  Haz sonidos de espaldas o con los ojos cerrados. No vale
                  ningún gesto, apáñatelas como puedas.
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      <View style={[styles.floatingCtaWrap, { bottom: insets.bottom + 16 }]}>
        <Button
          title="Crear partida"
          onPress={() => router.push("/teams")}
          variant="primary"
          size="large"
          style={styles.ctaButton}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  glowOrb: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.5,
  },
  glowOrbTop: {
    width: 220,
    height: 220,
    backgroundColor: "#ffd166",
    top: -60,
    right: -40,
  },
  glowOrbMiddle: {
    width: 180,
    height: 180,
    backgroundColor: "#fb7185",
    top: "34%",
    left: -70,
  },
  glowOrbBottom: {
    width: 260,
    height: 260,
    backgroundColor: "#93c5fd",
    bottom: -120,
    right: -80,
  },
  content: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 132,
    gap: 20,
  },
  heroCard: {
    backgroundColor: "rgba(255,255,255,0.76)",
    borderRadius: 30,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.7)",
    shadowColor: "#7c2d12",
    shadowOpacity: 0.12,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#fff7ed",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#fdba74",
    marginBottom: 16,
  },
  badgeText: {
    color: "#9a3412",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 48,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: -1.6,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 17,
    lineHeight: 25,
    color: "#374151",
    maxWidth: 320,
  },
  previewBoard: {
    flexDirection: "row",
    gap: 12,
    marginTop: 26,
    marginBottom: 24,
  },
  previewBoardCompact: {
    flexDirection: "column",
  },
  previewCard: {
    flex: 1,
    minHeight: 170,
    borderRadius: 24,
    padding: 18,
    justifyContent: "space-between",
  },
  previewCardCompact: {
    minHeight: 150,
  },
  previewLabel: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  previewWord: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
  },
  previewMetaRow: {
    flexDirection: "row",
    gap: 8,
  },
  previewPill: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  previewPillWarm: {
    backgroundColor: "rgba(251,146,60,0.22)",
  },
  previewPillText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
  previewSideColumn: {
    width: 104,
    gap: 12,
  },
  previewSideColumnCompact: {
    width: "100%",
    flexDirection: "row",
  },
  previewMiniCard: {
    flex: 1,
    borderRadius: 22,
    padding: 14,
    justifyContent: "space-between",
  },
  previewMiniCardCompact: {
    minHeight: 92,
  },
  previewMiniBlue: {
    backgroundColor: "#dbeafe",
  },
  previewMiniRed: {
    backgroundColor: "#fee2e2",
  },
  previewMiniLabel: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  previewMiniValue: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "900",
  },
  ctaButton: {
    backgroundColor: "#0f172a",
    borderRadius: 20,
    shadowColor: "#0f172a",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  floatingCtaWrap: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 20,
    padding: 10,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.9)",
    shadowColor: "#0f172a",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  helperText: {
    marginTop: 12,
    color: "#475569",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  bottomPanel: {
    backgroundColor: "rgba(255,255,255,0.74)",
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.66)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  featureList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  featureListCompact: {
    flexDirection: "column",
    flexWrap: "nowrap",
  },
  featureCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    minHeight: 128,
    width: "48.4%",
  },
  featureCardCompact: {
    width: "100%",
  },
  featureStep: {
    fontSize: 12,
    fontWeight: "900",
    color: "#f97316",
    marginBottom: 10,
    letterSpacing: 0.8,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  featureText: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
  },
  roundCard: {
    backgroundColor: "#fffaf5",
    borderRadius: 22,
    padding: 16,
    minHeight: 156,
    width: "48.4%",
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  roundStep: {
    fontSize: 12,
    fontWeight: "900",
    color: "#ea580c",
    marginBottom: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  roundTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  roundText: {
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 21,
  },
});
