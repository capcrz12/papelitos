# Instrucciones para crear el repositorio en GitHub

## Opción 1: Usando GitHub CLI (gh)

Si tienes GitHub CLI instalado:

```bash
# Autenticar con GitHub (si no lo has hecho)
gh auth login

# Crear el repositorio
gh repo create wordwave --public --source=. --remote=origin --push

# Ver el repositorio
gh repo view --web
```

## Opción 2: Usando la interfaz web de GitHub

1. Ve a https://github.com/new
2. Nombre del repositorio: `wordwave` o `papelitos`
3. Descripción: "🌊 WordWave - Juego colaborativo multijugador móvil basado en el clásico juego de Papelitos"
4. Selecciona: **Public** (o Private si prefieres)
5. **NO inicialices** con README, .gitignore o licencia (ya los tenemos)
6. Click en "Create repository"

7. Luego, conecta tu repositorio local:

```bash
# Añade el remote (reemplaza TU_USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/wordwave.git

# Renombra la rama principal a main (si es necesario)
git branch -M main

# Haz push de tu código
git push -u origin main
```

## Opción 3: Usando Git directamente

```bash
# Crea el repo en GitHub primero (vía web), luego:
git remote add origin https://github.com/TU_USUARIO/wordwave.git
git branch -M main
git push -u origin main
```

## Verificar la configuración

```bash
# Ver los remotes configurados
git remote -v

# Ver el status
git status

# Ver el log
git log --oneline
```

Una vez creado el repositorio, podrás:
- Crear issues desde la interfaz de GitHub
- Crear pull requests
- Ver el progreso del proyecto
- Colaborar con otros desarrolladores
