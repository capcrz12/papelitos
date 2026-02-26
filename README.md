# WordWave 🌊

Un juego colaborativo multijugador móvil basado en el clásico juego de "Papelitos" o "Celebrities".

## 📱 Descripción

WordWave es una aplicación móvil para iOS y Android donde grupos de amigos pueden jugar juntos a adivinar palabras en equipos. El juego consta de múltiples rondas con diferentes reglas:

1. **Ronda 1 - Descripción**: Describe la palabra sin decirla
2. **Ronda 2 - Una Palabra**: Describe usando solo UNA palabra
3. **Ronda 3 - Mímica**: Solo gestos, sin palabras
4. **Ronda 4 - Sonidos**: Solo usando sonidos

## 🎮 Características

- ✅ Partidas multijugador en tiempo real
- ✅ Conexión a salas de juego
- ✅ Equipos configurables
- ✅ Categorías predefinidas de palabras
- ✅ Modo personalizado: cada jugador crea sus propias palabras
- ✅ Sistema de turnos automático
- ✅ Temporizador configurable por ronda
- ✅ Sistema de puntuación en tiempo real
- ✅ Gestos para indicar acierto (mover el móvil hacia arriba)

## 🛠️ Stack Tecnológico

### Frontend
- **React Native** con Expo
- **TypeScript**
- **React Navigation** para navegación
- **Socket.io-client** para comunicación en tiempo real
- **React Native Reanimated** para animaciones

### Backend
- **Django 4.x**
- **Django REST Framework** para API REST
- **Django Channels** para WebSockets
- **PostgreSQL** como base de datos
- **Redis** para gestión de canales en tiempo real

## 📁 Estructura del Proyecto

```
papelitos/
├── mobile/           # Aplicación React Native
│   ├── src/
│   ├── assets/
│   └── app.json
├── backend/          # API Django
│   ├── api/
│   ├── game/
│   ├── words/
│   └── manage.py
└── docs/            # Documentación
```

## 🚀 Instalación

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

## 🎯 Roadmap

- [x] Configuración inicial del proyecto
- [ ] Sistema de autenticación
- [ ] Creación y gestión de salas
- [ ] Sistema de equipos
- [ ] Lógica de juego y rondas
- [ ] Interfaz de usuario
- [ ] Sistema de palabras y categorías
- [ ] Testing
- [ ] Deployment

## 👥 Contribución

Este proyecto está en desarrollo activo. Las contribuciones son bienvenidas!

## 📄 Licencia

MIT License
