# Script de inicio de Expo usando TUNNEL
# Ejecutar este archivo para iniciar Expo Go sin depender de la red LAN

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🚀 Iniciando Expo - Papelitos  " -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

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
Write-Host "2. Escanea el QR que aparecerá abajo" -ForegroundColor White
Write-Host "3. Si falla, cierra Expo Go y vuelve a escanear" -ForegroundColor White
Write-Host ""
Write-Host "Se iniciará en modo TUNNEL (más estable en redes con firewall)." -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Iniciar Expo
npx expo start --tunnel
