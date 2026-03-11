# Guia Completa de Flujo

## Objetivo

Ejecutar partidas completas en un solo dispositivo con flujo guiado y simple.

## Pantallas

1. Inicio (`mobile/app/index.tsx`)
2. Configuracion (`mobile/app/config.tsx`)
3. Carga de palabras (`mobile/app/word-submission.tsx`)
4. Juego (`mobile/app/game.tsx`)

## Reglas de uso

- Un dispositivo para todos los jugadores.
- Equipos definidos al inicio.
- Cada jugador agrega sus palabras cuando recibe el telefono.
- Las rondas se juegan por turnos con temporizador.

## Ejecucion

```bash
cd mobile
npm install
npx expo start
```

## Mantenimiento

- Mantener textos claros y cortos.
- Evitar complejidad innecesaria en el flujo.
- Priorizar velocidad de inicio de partida.
