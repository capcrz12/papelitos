# GitHub Setup

## Crear repositorio

### Opcion CLI

```bash
gh auth login
gh repo create wordwave --public --source=. --remote=origin --push
```

### Opcion web

1. Crea un repo vacio en GitHub.
2. Conecta el remoto local:

```bash
git remote add origin https://github.com/TU_USUARIO/wordwave.git
git branch -M main
git push -u origin main
```

## Verificacion

```bash
git remote -v
git status
git log --oneline -n 10
```
