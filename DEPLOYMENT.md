# Deployment Guide - WordWave

Esta guía cubre el despliegue de la aplicación WordWave en producción.

## Opciones de Deployment

### 1. Backend (Django + Channels)

#### Opción A: Railway / Render

1. **Railway** (Recomendado para inicio rápido)
   ```bash
   # Instalar Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Crear nuevo proyecto
   railway init
   
   # Agregar PostgreSQL
   railway add postgresql
   
   # Agregar Redis
   railway add redis
   
   # Deploy
   railway up
   ```

2. **Render**
   - Crear cuenta en render.com
   - Nuevo Web Service desde GitHub
   - Configurar variables de entorno
   - Build Command: `cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
   - Start Command: `cd backend && daphne -b 0.0.0.0 -p $PORT wordwave.asgi:application`

#### Opción B: AWS (EC2 + RDS + ElastiCache)

```bash
# 1. Configurar EC2
ssh ec2-user@your-instance

# 2. Instalar dependencias
sudo yum update -y
sudo yum install python3 python3-pip git nginx -y

# 3. Clonar repositorio
git clone https://github.com/tu-usuario/wordwave.git
cd wordwave/backend

# 4. Setup entorno virtual
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt gunicorn daphne

# 5. Configurar variables de entorno
cp .env.example .env
nano .env  # Editar con valores de producción

# 6. Migraciones
python manage.py migrate
python manage.py collectstatic

# 7. Configurar Nginx
sudo nano /etc/nginx/conf.d/wordwave.conf
```

Configuración de Nginx:
```nginx
upstream django {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name tu-dominio.com;

    location /static/ {
        alias /path/to/wordwave/backend/staticfiles/;
    }

    location /ws/ {
        proxy_pass http://django;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location / {
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Opción C: Docker + DigitalOcean

```bash
# 1. Build la imagen
docker build -t wordwave-backend ./backend

# 2. Push a Docker Hub
docker tag wordwave-backend tu-usuario/wordwave-backend
docker push tu-usuario/wordwave-backend

# 3. En DigitalOcean, usar docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Mobile App (React Native)

#### iOS

1. **Configurar Apple Developer Account**
   - Crear App ID en developer.apple.com
   - Configurar certificados y provisioning profiles

2. **Build con EAS**
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   eas build --platform ios
   ```

3. **Subir a App Store**
   ```bash
   eas submit --platform ios
   ```

#### Android

1. **Configurar Google Play Console**
   - Crear aplicación
   - Configurar signing keys

2. **Build con EAS**
   ```bash
   eas build --platform android
   ```

3. **Subir a Play Store**
   ```bash
   eas submit --platform android
   ```

## Variables de Entorno

### Backend (.env)

```env
SECRET_KEY=tu-secret-key-super-segura-y-larga
DEBUG=False
ALLOWED_HOSTS=tu-dominio.com,www.tu-dominio.com
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://host:6379/0
CORS_ALLOWED_ORIGINS=https://tu-app.com
```

### Mobile (app.json)

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.tu-dominio.com"
    }
  }
}
```

## Configuraciones de Producción

### Django Settings

```python
# En settings.py para producción
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Channels
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [os.getenv('REDIS_URL')],
        },
    },
}
```

## Monitoreo

### Sentry (Errores)

```bash
pip install sentry-sdk
```

```python
import sentry_sdk

sentry_sdk.init(
    dsn="tu-sentry-dsn",
    traces_sample_rate=1.0,
)
```

### New Relic (Performance)

```bash
pip install newrelic
newrelic-admin generate-config license-key newrelic.ini
```

## Backup

### Base de datos

```bash
# Backup automático diario
0 2 * * * pg_dump -U user database > backup_$(date +\%Y\%m\%d).sql
```

### Redis (opcional)

```bash
redis-cli --rdb /path/to/backup.rdb
```

## SSL/TLS

### Certbot (Let's Encrypt)

```bash
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

## Escalabilidad

### Load Balancer

- Usar AWS ELB, DigitalOcean Load Balancer, o Nginx
- Múltiples instancias del backend
- Redis Cluster para canales

### CDN

- CloudFlare para archivos estáticos
- AWS CloudFront

## Checklist de Deployment

- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada
- [ ] Archivos estáticos recolectados
- [ ] SSL/TLS configurado
- [ ] Firewall configurado
- [ ] Backups automáticos habilitados
- [ ] Monitoreo configurado
- [ ] Logs centralizados
- [ ] Rate limiting habilitado
- [ ] CORS configurado correctamente
- [ ] WebSocket funcionando
- [ ] Tests pasando en CI/CD

## Troubleshooting

### WebSocket no conecta

1. Verificar que Nginx/Load Balancer soporte WebSockets
2. Verificar Redis está corriendo
3. Verificar CORS permite conexión WebSocket

### App móvil no conecta al backend

1. Verificar URL en configuración
2. Verificar CORS permite el origen
3. Verificar SSL si es HTTPS

## Recursos

- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
- [Channels Deployment](https://channels.readthedocs.io/en/stable/deploying.html)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
