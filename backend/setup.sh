#!/bin/bash

# WordWave Backend Setup Script

echo "🌊 WordWave Backend Setup"
echo "=========================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi

echo "✅ Python found: $(python3 --version)"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔐 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration"
fi

# Run migrations
echo "🗄️  Running database migrations..."
python manage.py makemigrations
python manage.py migrate

# Load initial data
echo "📊 Loading initial word categories and data..."
python manage.py load_initial_data

# Create superuser prompt
echo ""
read -p "Do you want to create a superuser for Django admin? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    python manage.py createsuperuser
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the development server:"
echo "  source venv/bin/activate"
echo "  python manage.py runserver"
echo ""
echo "Or use Docker:"
echo "  docker-compose up"
