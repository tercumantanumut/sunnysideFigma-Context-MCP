@echo off
echo 🍰 Setting up Sweetdeli Website...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Create .env.local from template if it doesn't exist
if not exist .env.local (
    echo 🔧 Creating .env.local from template...
    copy .env.example .env.local
    echo ✅ Created .env.local - please update with your values if needed
)

REM Build the project to check for errors
echo 🔨 Building project to check for errors...
npm run build

if %errorlevel% equ 0 (
    echo ✅ Build successful!
    echo.
    echo 🚀 Setup complete! You can now run:
    echo    npm run dev     - Start development server
    echo    npm run build   - Build for production
    echo    npm run start   - Start production server
    echo.
    echo 📱 The website will be available at:
    echo    http://localhost:3000      - Main page
    echo    http://localhost:3000/demo - Demo page
) else (
    echo ❌ Build failed. Please check the errors above.
    pause
    exit /b 1
)

pause
