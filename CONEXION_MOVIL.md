# 📱 Cómo Conectar tu Dispositivo Móvil

## ✅ Estado Actual

- ✓ Metro Bundler está corriendo en puerto 8081
- ✓ Tu IP local es: **192.168.1.194**

## 🔗 Métodos de Conexión

### Método 1: Usando la Interfaz Web (RECOMENDADO)

1. **Abre en tu navegador de PC:**

   ```
   http://localhost:8081
   ```

2. En la página verás un **QR Code grande**
3. Abre la app **Expo Go** en tu teléfono
4. Escanea el QR que aparece en el navegador

### Método 2: Conexión Manual

**En tu app Expo Go:**

1. Abre Expo Go en tu teléfono
2. Toca "Enter URL manually"
3. Ingresa esta URL:
   ```
   exp://192.168.1.194:8081
   ```

### Método 3: Ver el QR en la Terminal

Si prefieres ver el QR en la terminal:

1. Ve a la terminal donde está corriendo Expo
2. Debería mostrar un código QR en ASCII art
3. Si no se ve, presiona `r` para refrescar

## ⚠️ Requisitos

- Tu teléfono y PC deben estar en la **misma red WiFi**
- Asegúrate de que el firewall no bloquee el puerto 8081
- Descarga **Expo Go** desde:
  - iOS: App Store
  - Android: Google Play Store

## 🔥 Firewall de Windows

Si no funciona, permite Expo en el firewall:

```powershell
New-NetFirewallRule -DisplayName "Expo Metro" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow
```

## 🐛 Si No Funciona

1. **Verifica que estés en la misma red WiFi**
2. **Intenta con la IP directamente** en Expo Go: `exp://192.168.1.194:8081`
3. **Desactiva temporalmente VPN** si tienes alguna activa
4. **Reinicia Expo** presionando `Ctrl+C` en la terminal y luego:
   ```powershell
   cd mobile
   npx expo start
   ```

---

**Servidor Metro Bundler:** http://localhost:8081
**Tu IP Local:** 192.168.1.194
