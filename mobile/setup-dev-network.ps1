# Configura red de desarrollo para app movil + backend Django
# - Detecta IP local
# - Actualiza mobile/.env con API/WS URL
# - Abre puerto 8000 en firewall (opcional)
# Uso:
#   powershell -ExecutionPolicy Bypass -File .\setup-dev-network.ps1
#   powershell -ExecutionPolicy Bypass -File .\setup-dev-network.ps1 -SkipFirewall

param(
    [switch]$SkipFirewall
)

$ErrorActionPreference = "Stop"

function Get-LocalIPv4 {
    $ips = @(
        Get-NetIPAddress -AddressFamily IPv4 |
            Where-Object {
                $_.IPAddress -match '^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)' -and
                $_.PrefixOrigin -ne 'WellKnown'
            } |
            Select-Object -ExpandProperty IPAddress
    )

    if (-not $ips -or $ips.Count -eq 0) {
        throw "No se pudo detectar una IP local privada (LAN). Conectate a WiFi/LAN e intenta de nuevo."
    }

    return $ips[0]
}

function Update-EnvFile {
    param(
        [string]$EnvPath,
        [string]$IpAddress
    )

    $api = "EXPO_PUBLIC_API_URL=http://$IpAddress`:8000/api"
    $ws = "EXPO_PUBLIC_WS_URL=http://$IpAddress`:8000"

    if (-not (Test-Path $EnvPath)) {
        @(
            "# API Configuration"
            $api
            $ws
        ) | Set-Content -Path $EnvPath -Encoding UTF8
        return
    }

    $content = Get-Content -Path $EnvPath -Raw

    if ($content -match 'EXPO_PUBLIC_API_URL=') {
        $content = [regex]::Replace($content, 'EXPO_PUBLIC_API_URL=.*', $api)
    } else {
        $content += "`r`n$api"
    }

    if ($content -match 'EXPO_PUBLIC_WS_URL=') {
        $content = [regex]::Replace($content, 'EXPO_PUBLIC_WS_URL=.*', $ws)
    } else {
        $content += "`r`n$ws"
    }

    Set-Content -Path $EnvPath -Value $content -Encoding UTF8
}

function Ensure-FirewallRule {
    $ruleName = "Django Dev 8000"
    $existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    if (-not $existing) {
        New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow | Out-Null
    }
}

$scriptDir = Split-Path -Parent $PSCommandPath
$envPath = Join-Path $scriptDir ".env"
$ip = Get-LocalIPv4

Update-EnvFile -EnvPath $envPath -IpAddress $ip

if (-not $SkipFirewall) {
    try {
        Ensure-FirewallRule
        Write-Host "Firewall OK: puerto 8000 permitido" -ForegroundColor Green
    } catch {
        Write-Host "No se pudo crear regla de firewall (ejecuta como administrador)." -ForegroundColor Yellow
    }
}

Write-Host "IP detectada: $ip" -ForegroundColor Cyan
Write-Host "Actualizado: $envPath" -ForegroundColor Green
Write-Host "" 
Write-Host "Siguientes pasos:" -ForegroundColor White
Write-Host "1) Backend: python manage.py runserver 0.0.0.0:8000" -ForegroundColor White
Write-Host "2) Mobile: npm start -c" -ForegroundColor White
