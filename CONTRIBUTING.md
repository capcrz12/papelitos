# Contributing

Gracias por contribuir a WordWave.

## Flujo recomendado

1. Crea una rama desde `main`.
2. Haz cambios pequenos y claros.
3. Ejecuta chequeos locales.
4. Abre un pull request con descripcion breve.

## Convenciones

- TypeScript estricto.
- Componentes funcionales con hooks.
- Estilos con `StyleSheet`.
- Commits con Conventional Commits (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`).

## Setup local

```bash
cd mobile
npm install
npx expo start
```

## Verificacion minima

```bash
cd mobile
npx tsc --noEmit
```
