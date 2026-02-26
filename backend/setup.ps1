# WordWave Backend Setup (Windows)

Write-Host "🌊 WordWave Backend Setup" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan

# Check if Python is installed
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python is not installed. Please install Python 3.9 or higher." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Python found: $(python --version)" -ForegroundColor Green

# Create virtual environment
Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
python -m venv venv

# Activate virtual environment
Write-Host "🔐 Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "📚 Installing dependencies..." -ForegroundColor Yellow
python -m pip install --upgrade pip
pip install -r requirements.txt

# Copy environment file
if (!(Test-Path .env)) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "⚠️  Please update .env with your configuration" -ForegroundColor Yellow
}

# Run migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Yellow
python manage.py makemigrations
python manage.py migrate

# Load initial data
Write-Host "📊 Loading initial word categories and data..." -ForegroundColor Yellow
python manage.py load_initial_data

# Create superuser prompt
Write-Host ""
$response = Read-Host "Do you want to create a superuser for Django admin? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    python manage.py createsuperuser
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the development server:" -ForegroundColor Cyan
Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "  python manage.py runserver" -ForegroundColor White
Write-Host ""
Write-Host "Or use Docker:" -ForegroundColor Cyan
Write-Host "  docker-compose up" -ForegroundColor White
