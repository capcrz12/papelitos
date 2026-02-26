# Script de inicio de Expo con configuración correcta para LAN
# Ejecutar este archivo para iniciar Expo correctamente

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🚀 Iniciando Expo - Papelitos  " -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Obtener IP de LAN
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"
} | Select-Object -First 1).IPAddress

if (-not $ip) {
    Write-Host "❌ No se pudo detectar la IP de red" -ForegroundColor Red
    Write-Host "Verifica que estés conectado a WiFi" -ForegroundColor Yellow
    pause
    exit
}

Write-Host "📍 Tu IP de red: $ip" -ForegroundColor Cyan
Write-Host ""

# Configurar variable de entorno
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip

# Navegar al directorio mobile
$mobileDir = Split-Path -Parent $PSCommandPath
Set-Location $mobileDir

Write-Host "📦 Iniciando Metro Bundler..." -ForegroundColor Yellow
Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Green
Write-Host "  📱 CÓMO CONECTAR TU TELÉFONO" -ForegroundColor White
Write-Host "═══════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "1. Abre Expo Go en tu teléfono" -ForegroundColor White
Write-Host "2. Toca 'Enter URL manually'" -ForegroundColor White
Write-Host "3. Ingresa: exp://${ip}:8081" -ForegroundColor Cyan
Write-Host ""
Write-Host "O escanea el QR cuando aparezca abajo" -ForegroundColor White
Write-Host "═══════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Iniciar Expo
npx expo start --lan
