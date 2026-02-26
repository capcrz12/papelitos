# Contributing to WordWave

¡Gracias por tu interés en contribuir a WordWave! 🎉

## Cómo contribuir

### Reportar bugs

Si encuentras un bug, por favor crea un issue con:
- Descripción clara del problema
- Pasos para reproducir
- Comportamiento esperado vs comportamiento actual
- Screenshots si es aplicable
- Información del dispositivo/navegador

### Sugerir features

Para sugerir nuevas características:
1. Verifica que no exista ya un issue similar
2. Crea un nuevo issue describiendo la feature
3. Explica por qué sería útil
4. Si es posible, incluye mockups o ejemplos

### Pull Requests

1. **Fork** el repositorio
2. **Crea una branch** para tu feature:
   ```bash
   git checkout -b feature/mi-nueva-feature
   ```
3. **Haz commit** de tus cambios:
   ```bash
   git commit -m "feat: Añadir nueva funcionalidad"
   ```
4. **Push** a tu fork:
   ```bash
   git push origin feature/mi-nueva-feature
   ```
5. **Abre un Pull Request** describiendo tus cambios

### Convenciones de código

#### Commits
Usamos [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Formateo, sin cambios de código
- `refactor:` Refactorización de código
- `test:` Añadir o actualizar tests
- `chore:` Mantenimiento general

#### Python (Backend)
- Seguir PEP 8
- Usar type hints cuando sea posible
- Documentar funciones y clases con docstrings
- Escribir tests para nuevas funcionalidades

#### TypeScript/React Native (Mobile)
- Usar TypeScript estricto
- Componentes funcionales con hooks
- Nombrar componentes en PascalCase
- Props interfaces con sufijo `Props`
- Estilos usando StyleSheet de React Native

### Setup de desarrollo

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py load_initial_data
python manage.py runserver
```

#### Mobile
```bash
cd mobile
npm install
npx expo start
```

### Tests

#### Backend
```bash
cd backend
python manage.py test
```

#### Mobile
```bash
cd mobile
npm test
```

### Estructura de branches

- `main/master`: Código estable en producción
- `develop`: Rama de desarrollo principal
- `feature/*`: Nuevas funcionalidades
- `fix/*`: Correcciones de bugs
- `hotfix/*`: Correcciones urgentes para producción

## Código de conducta

- Sé respetuoso y constructivo
- Acepta las críticas constructivas
- Enfócate en lo mejor para el proyecto
- Ayuda a otros contribuidores

## ¿Preguntas?

Si tienes preguntas, puedes:
- Abrir un issue con la etiqueta `question`
- Contactar a los maintainers

¡Gracias por contribuir! 🌊
