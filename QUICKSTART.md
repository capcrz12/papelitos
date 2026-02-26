# 🚀 Inicio Rápido - Papelitos (WordWave)

## ✅ Estado del Proyecto

El proyecto está completamente configurado y listo para usar:

- ✅ Dependencias instaladas (mobile y backend)
- ✅ Base de datos configurada con migraciones aplicadas
- ✅ Datos iniciales cargados (8 categorías, 150+ palabras)
- ✅ Superusuario creado: `admin` / `admin123`
- ✅ Servidores iniciados

## 🎮 Ejecutar la Aplicación

### Backend (Django) - Terminal 1

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver
```

El servidor estará disponible en: http://localhost:8000
Admin panel: http://localhost:8000/admin

### Mobile (Expo) - Terminal 2

**MÉTODO 1: Usando el script (RECOMENDADO)**

```powershell
cd mobile
# Doble clic en EJECUTAR_EXPO.bat
# O ejecuta:
.\iniciar-expo.ps1
```

**MÉTODO 2: Manual**

```powershell
cd mobile
$env:REACT_NATIVE_PACKAGER_HOSTNAME='192.168.1.194'  # Cambia por tu IP
npx expo start --lan
```

Luego:

- Abre **Expo Go** en tu teléfono (misma red WiFi)
- Toca **"Enter URL manually"**
- Ingresa: `exp://192.168.1.194:8081` (usa tu IP)
- O escanea el QR que aparece en la terminal

## 📱 Probar la Aplicación

1. **Crear una sala**: En la pantalla principal, toca "Crear Sala"
2. **Unirse a una sala**: Ingresa el código de 4 letras y toca "Unirse"
3. **Lobby**: Espera a que otros jugadores se unan
4. **Jugar**: El anfitrión inicia el juego y comienza la diversión

## 🗄️ Administración

Accede al panel de administración de Django:

- URL: http://localhost:8000/admin
- Usuario: `admin`
- Contraseña: `admin123`

Aquí puedes:

- Ver y editar salas activas
- Gestionar categorías y palabras
- Ver historial de turnos

## 🐛 Solución de Problemas

### ⚠️ Error al escanear QR - Versiones Incompatibles

Si al escanear el QR obtienes un error y ves este warning:

```
The following packages should be updated for best compatibility...
expo-sensors@13.0.9 - expected version: ~12.9.1
react-native@0.73.4 - expected version: 0.73.6
```

**Solución:**

```powershell
cd mobile
npx expo install --fix
npx expo start --clear
```

Esto corrige automáticamente las versiones y reinicia con caché limpio.

### El backend no inicia

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py migrate
```

### La app móvil muestra errores generales

```powershell
cd mobile
npm install
npx expo start -c  # -c limpia el caché
```

### Puerto 8081 ocupado

Si ves "Port 8081 is being used", escribe `y` para usar otro puerto o:

```powershell
# Matar proceso en puerto 8081
Get-NetTCPConnection -LocalPort 8081 | Select-Object -ExpandProperty OwningProcess -First 1 | ForEach-Object { Stop-Process -Id $_ -Force }
```

## 📝 Credenciales

- **Admin Django**: admin / admin123
- **Backend URL**: http://localhost:8000
- **WebSocket URL**: ws://localhost:8000/ws/game/

## 🌐 URLs Importantes

- API Docs: http://localhost:8000/api/
- Admin Panel: http://localhost:8000/admin
- Categorías: http://localhost:8000/api/categories/
- Crear Sala: POST http://localhost:8000/api/rooms/create/

## ⚡ Próximos Pasos

1. **Conectar Frontend al Backend**: Actualizar `mobile/src/services/api.ts` con la URL real
2. **Probar WebSockets**: Verificar conexión en tiempo real
3. **Implementar Autenticación**: Reemplazar mock auth con JWT real
4. **Deploy**: Seguir instrucciones en `DEPLOYMENT.md`

---

¡Todo está listo! Ambos servidores deberían estar ejecutándose en este momento. 🎉
