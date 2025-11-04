@echo off
REM Station V - Test Wrapper Batch File
REM Quick launcher for testing the IRC simulator
REM
REM Usage: test-wrapper.bat [command]
REM Commands: dev, electron, build, package, test, help

setlocal enabledelayedexpansion

if "%1"=="" (
    echo.
    echo ============================================================
    echo   Station V - IRC Simulator Test Wrapper
    echo ============================================================
    echo.
    echo Usage: test-wrapper.bat [command]
    echo.
    echo Commands:
    echo   dev              Start development servers
    echo   electron         Start Electron development
    echo   build            Build the application
    echo   package          Package as Windows executable
    echo   test             Run tests
    echo   help             Show this help message
    echo.
    echo Examples:
    echo   test-wrapper.bat dev
    echo   test-wrapper.bat electron
    echo   test-wrapper.bat build
    echo.
    goto :end
)

if /i "%1"=="help" (
    echo.
    echo ============================================================
    echo   Station V - IRC Simulator Test Wrapper
    echo ============================================================
    echo.
    echo Usage: test-wrapper.bat [command]
    echo.
    echo Commands:
    echo   dev              Start development servers
    echo                    - WebSocket: http://localhost:8081
    echo                    - Web UI: http://localhost:3000
    echo.
    echo   electron         Start Electron development
    echo                    - Launches desktop app with hot reload
    echo.
    echo   build            Build the application
    echo                    - Creates optimized production build
    echo.
    echo   package          Package as Windows executable
    echo                    - Creates installer and portable exe
    echo.
    echo   test             Run tests
    echo                    - Verifies executable works correctly
    echo.
    echo   help             Show this help message
    echo.
    echo Examples:
    echo   test-wrapper.bat dev
    echo   test-wrapper.bat electron
    echo   test-wrapper.bat build
    echo   test-wrapper.bat package
    echo.
    goto :end
)

if /i "%1"=="dev" (
    echo.
    echo Starting development servers...
    echo WebSocket: http://localhost:8081
    echo Web UI: http://localhost:3000
    echo.
    call npm run test:wrapper dev
    goto :end
)

if /i "%1"=="electron" (
    echo.
    echo Starting Electron development...
    echo.
    call npm run test:wrapper electron
    goto :end
)

if /i "%1"=="build" (
    echo.
    echo Building application...
    echo.
    call npm run test:wrapper build
    goto :end
)

if /i "%1"=="package" (
    echo.
    echo Packaging as Windows executable...
    echo.
    call npm run test:wrapper package
    goto :end
)

if /i "%1"=="test" (
    echo.
    echo Running tests...
    echo.
    call npm run test:wrapper test
    goto :end
)

echo Unknown command: %1
echo Use "test-wrapper.bat help" for available commands
exit /b 1

:end
endlocal

