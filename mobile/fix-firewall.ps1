# Script para abrir el firewall de Windows para Expo
# EJECUTAR COMO ADMINISTRADOR

Write-Host "`n🔥 Configurando Firewall para Expo..." -ForegroundColor Green

# Permitir Node.js en el firewall
try {
    New-NetFirewallRule -DisplayName "Node.js - Expo Metro" `
        -Direction Inbound `
        -Program "$env:ProgramFiles\nodejs\node.exe" `
        -Action Allow `
        -Profile Any `
        -ErrorAction Stop
    
    Write-Host "✓ Regla de firewall creada para Node.js" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Regla ya existe o hubo un error: $_" -ForegroundColor Yellow
}

# Permitir puerto 8081 específicamente
try {
    New-NetFirewallRule -DisplayName "Expo Metro Bundler Port" `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 8081 `
        -Action Allow `
        -Profile Any `
        -ErrorAction Stop
    
    Write-Host "✓ Puerto 8081 abierto en firewall" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Regla de puerto ya existe o hubo un error: $_" -ForegroundColor Yellow
}

Write-Host "`n✅ Configuración completada!" -ForegroundColor Green
Write-Host "Ahora intenta conectar desde tu teléfono:`n" -ForegroundColor White
Write-Host "   exp://192.168.1.194:8081`n" -ForegroundColor Cyan

pause
