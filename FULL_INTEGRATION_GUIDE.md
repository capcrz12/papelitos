# Guía de Configuración y Ejecución - Papelitos

## 🚀 Implementación Completa del Flujo Backend

Se ha implementado la integración completa del backend con el frontend, incluyendo:

### ✅ Backend (Django + Channels)

#### 1. **API REST - Creación de Salas**

- **Endpoint**: `POST /api/game/rooms/create_room/`
- **Parámetros aceptados**:
  - `player_name`: Nombre del jugador (requerido)
  - `seconds_per_turn`: Segundos por turno (opcional, default: 60)
  - `words_per_player`: Palabras por jugador (opcional, default: 3)
  - `use_categories`: Usar categorías predefinidas (opcional, default: false)
- **Respuesta**: Objeto `room` con el código de sala y objeto `player` con el ID del jugador

#### 2. **API REST - Unirse a Sala**

- **Endpoint**: `POST /api/game/rooms/{code}/join_room/`
- **Parámetros**: `player_name`
- **Validaciones**:
  - Verifica que la sala exista (404 si no)
  - Verifica que el juego no haya empezado (400 si ya empezó)
  - Asigna jugador automáticamente al equipo con menos jugadores
- **Respuesta**: Objeto `room` y objeto `player`

#### 3. **WebSocket - Tiempo Real**

- **Conexión**: `ws://localhost:8000/ws/game/{room_code}/`
- **Eventos emitidos por el servidor**:
  - `game_state`: Estado inicial del juego al conectar
  - `player_update`: Actualización de lista de jugadores
  - `team_changed`: Notificación de cambio de equipo
  - `player_joined`: Nuevo jugador se unió
  - `player_left`: Jugador salió
  - `game_started`: El juego inició

- **Eventos que escucha del cliente**:
  - `change_team`: Cambiar equipo de un jugador
  - `start_game`: Iniciar el juego
  - `word_guessed`: Palabra adivinada
  - `skip_word`: Saltar palabra
  - `end_turn`: Terminar turno

### ✅ Frontend (React Native + Expo)

#### 1. **Pantalla de Inicio** (`app/index.tsx`)

- Formulario para ingresar nombre de jugador
- **Crear Partida**: Navega a pantalla de configuración
- **Unirse a Partida**:
  - Input con validación de código (4 caracteres, mayúsculas)
  - Llamada real a `gameApi.joinRoom()`
  - Manejo de errores (sala no existe, error de conexión)
  - Estado de carga con spinner

#### 2. **Pantalla de Configuración** (`app/config.tsx`)

- Configuración completa de la partida:
  - Tiempo por turno: 30/45/60/90/120 segundos
  - Palabras por jugador: 2/3/4/5/6
  - Jugadores máximos: 4/6/8/10/12
  - Rondas activas (4 rondas disponibles)
  - Categorías predefinidas
  - Permitir palabras de jugadores

- **Integración con Backend**:
  - Llamada a `gameApi.createRoom()` con configuración
  - Validación de al menos una ronda activa
  - Manejo de errores de conexión
  - Estado de carga visual
  - Navegación a lobby con datos reales del backend

#### 3. **Pantalla de Lobby** (`app/lobby.tsx`)

- Muestra código de sala (4 letras)
- **Indicador de conexión WebSocket**:
  - Punto verde: Conectado
  - Punto rojo: Conectando/Desconectado

- **Gestión de Jugadores**:
  - Lista en tiempo real (actualizada por WebSocket)
  - Edición de nombre propio
  - Cambio de equipo (emite evento al servidor)
  - Asignación automática de equipos
  - Botón temporal de simulación para testing

- **Configuración visible**:
  - Resumen de settings de la partida
  - Botón "Editar" para anfitrión

- **Iniciar Juego**:
  - Validación de mínimo 4 jugadores
  - Validación de al menos 1 jugador por equipo
  - Llamada a `gameApi.startGame()`
  - Navegación a pantalla de juego

#### 4. **Servicios**

**`src/services/api.ts`**:

- Cliente axios configurado
- Interface `RoomConfig` para tipado
- Funciones:
  - `createRoom(playerName, config)`
  - `joinRoom(roomCode, playerName)`
  - `getRoom(roomCode)`
  - `startGame(roomCode)`

**`src/hooks/useSocket.ts`**:

- Hook personalizado para WebSocket
- Conexión automática con reconnection
- Maneja todos los eventos del juego
- Funciones helper: `wordGuessed()`, `skipWord()`, `endTurn()`, `startGame()`

### 📁 Archivos de Configuración

#### `.env`

```bash
EXPO_PUBLIC_API_URL=http://localhost:8000/api
EXPO_PUBLIC_WS_URL=http://localhost:8000
```

Para desarrollo con dispositivo físico, reemplaza `localhost` con tu IP local:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api
EXPO_PUBLIC_WS_URL=http://192.168.1.100:8000
```

#### `.gitignore`

- Configurado para excluir `.env` y archivos sensibles
- Excluye `node_modules/`, `.expo/`, builds, etc.

---

## 🏃‍♂️ Cómo Ejecutar el Proyecto Completo

### 1. **Backend (Django)**

```powershell
# Navegar al directorio del backend
cd c:\Users\Carlos\Documents\dev\papelitos\backend

# Activar entorno virtual (si usas uno)
# .\venv\Scripts\Activate.ps1

# Instalar dependencias (si es primera vez)
pip install -r requirements.txt

# Aplicar migraciones
python manage.py migrate

# Crear datos iniciales (palabras, categorías)
python manage.py load_initial_data

# Ejecutar el servidor
python manage.py runserver
```

El servidor estará en: `http://localhost:8000`

### 2. **Redis (para Channels)**

Redis es necesario para el WebSocket. Instala y ejecuta:

**Windows** (usando Chocolatey):

```powershell
choco install redis-64
redis-server
```

O descarga desde: https://github.com/microsoftarchive/redis/releases

### 3. **Frontend (React Native + Expo)**

```powershell
# Navegar al directorio mobile
cd c:\Users\Carlos\Documents\dev\papelitos\mobile

# Instalar dependencias (si es primera vez)
npm install

# Configurar variables de entorno
# Edita el archivo .env con tu IP si usas dispositivo físico

# Iniciar Expo
npm start
```

Opciones para ejecutar:

- **Web**: Presiona `w` en la terminal
- **Android**: Presiona `a` (requiere Android Studio)
- **iOS**: Presiona `i` (requiere Mac con Xcode)
- **Dispositivo físico**: Escanea el QR con Expo Go

---

## 🧪 Cómo Probar el Flujo Completo

### Escenario 1: Un usuario en web

1. Inicia el backend y Redis
2. Inicia el frontend con `npm start`
3. Presiona `w` para abrir en navegador
4. Ingresa tu nombre → "Crear Partida"
5. Configura la partida → "Crear Partida"
6. Verás el lobby con el código de sala
7. Abre otra pestaña del navegador
8. En la segunda pestaña, ingresa nombre → "Unirse a Partida"
9. Ingresa el código de 4 letras que ves en la primera pestaña
10. ¡Deberías ver ambos jugadores en tiempo real!

### Escenario 2: Dispositivo móvil + Computadora

1. Edita `.env` en el directorio `mobile/`:
   ```bash
   EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:8000/api
   EXPO_PUBLIC_WS_URL=http://TU_IP_LOCAL:8000
   ```
2. Encuentra tu IP local:

   ```powershell
   ipconfig
   # Busca "IPv4 Address" de tu red Wi-Fi
   ```

3. Asegúrate de que el firewall permita conexiones al puerto 8000:

   ```powershell
   New-NetFirewallRule -DisplayName "Django Dev Server" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
   ```

4. Ejecuta el backend con tu IP:

   ```powershell
   python manage.py runserver 0.0.0.0:8000
   ```

5. En mobile, ejecuta `npm start` y escanea el QR con Expo Go
6. En tu computadora, abre el navegador en `http://localhost:8000`
7. Crea partida desde uno, únete desde el otro

---

## 🐛 Problemas Comunes

### "Cannot connect to server"

- ✅ Verifica que el backend esté corriendo
- ✅ Verifica que Redis esté corriendo
- ✅ En dispositivos físicos, usa tu IP local en `.env`
- ✅ Verifica el firewall de Windows

### "Room not found"

- ✅ Asegúrate de escribir correctamente el código de 4 letras
- ✅ Verifica que la sala no haya expirado

### WebSocket no conecta

- ✅ Verifica que Redis esté corriendo
- ✅ Revisa la consola del backend para errores
- ✅ Verifica que la URL de WebSocket en `.env` sea correcta

### "Players not updating in real-time"

- ✅ Verifica el indicador de conexión en el lobby (debe estar verde)
- ✅ Revisa la consola del navegador/Expo para errores
- ✅ Confirma que el backend muestre conexiones WebSocket

---

## 📊 Estado de Implementación

### ✅ Completado

- [x] Backend API (crear sala, unirse, configuración)
- [x] Backend WebSocket (eventos en tiempo real)
- [x] Frontend creación de sala con configuración completa
- [x] Frontend unirse a sala con validación
- [x] Frontend lobby con actualización en tiempo real
- [x] Integración completa API + WebSocket
- [x] Manejo de errores y estados de carga
- [x] Archivos de configuración (.env, .gitignore)

### 🔄 Pendiente

- [ ] Pantalla de juego funcional
- [ ] Sistema de turnos en tiempo real
- [ ] Gestión de palabras (creación por jugadores)
- [ ] Contador de tiempo durante el turno
- [ ] Sistema de puntuación
- [ ] Cambio de rondas automático
- [ ] Pantalla de resultados finales

---

## 📝 Próximos Pasos Recomendados

1. **Probar el flujo completo** de crear/unirse a sala
2. **Verificar actualizaciones en tiempo real** con múltiples clientes
3. **Implementar pantalla de juego** con turnos y palabras
4. **Agregar sistema de palabras** (creación por jugadores o desde categorías)
5. **Implementar contador de tiempo** durante turnos
6. **Agregar pantalla de resultados** al finalizar partida

---

¿Todo listo? ¡Ejecuta el backend, inicia el frontend, y comienza a jugar! 🎉
