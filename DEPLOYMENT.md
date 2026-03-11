# Deployment

Esta app se distribuye como aplicacion movil con Expo/EAS.

## Build de produccion

```bash
cd mobile
npm install
npx eas build:configure
npx eas build --platform android
npx eas build --platform ios
```

## Publicacion

- Android: Google Play Console
- iOS: App Store Connect

## Versionado

Actualiza en `mobile/app.json`:

- `version`
- `android.versionCode`
- `ios.buildNumber`

## Checklist

- `npx tsc --noEmit` sin errores
- Navegacion completa del flujo de juego
- Prueba de partida completa en dispositivo real
