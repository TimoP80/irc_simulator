# Station V - Test Wrapper PowerShell Script
# Quick launcher for testing the IRC simulator
#
# Usage: .\test-wrapper.ps1 [command]
# Commands: dev, electron, build, package, test, help

param(
    [string]$Command = "help"
)

# Color codes
$colors = @{
    "reset" = "`e[0m"
    "bright" = "`e[1m"
    "green" = "`e[32m"
    "yellow" = "`e[33m"
    "blue" = "`e[34m"
    "red" = "`e[31m"
    "cyan" = "`e[36m"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "reset"
    )
    Write-Host "$($colors[$Color])$Message$($colors['reset'])"
}

function Write-Section {
    param([string]$Title)
    Write-ColorOutput "`n$('=' * 60)" "cyan"
    Write-ColorOutput "  $Title" "bright"
    Write-ColorOutput "$('=' * 60)`n" "cyan"
}

function Show-Help {
    Write-Section "Station V - IRC Simulator Test Wrapper"
    
    $help = @"
Commands:
  dev              Start development servers (WebSocket + Vite)
  electron         Start Electron development mode
  build            Build the application for production
  package          Package as Windows executable
  test             Run executable tests
  help             Show this help message

Examples:
  .\test-wrapper.ps1 dev
  .\test-wrapper.ps1 electron
  .\test-wrapper.ps1 build
  .\test-wrapper.ps1 package

For more information, visit: https://github.com/TimoP80/station_v_executable
"@
    Write-Host $help
}

function Invoke-Command {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-ColorOutput "`n▶ $Description" "yellow"
    Write-ColorOutput "Running: npm run test:wrapper $Command`n" "blue"
    
    & npm run test:wrapper $Command
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✓ Command completed successfully`n" "green"
    } else {
        Write-ColorOutput "✗ Command failed with exit code $LASTEXITCODE`n" "red"
        exit 1
    }
}

# Main switch
switch ($Command.ToLower()) {
    "dev" {
        Write-Section "Starting Development Servers"
        Write-ColorOutput "Starting WebSocket server and Vite dev server..." "blue"
        Write-ColorOutput "WebSocket: http://localhost:8081" "green"
        Write-ColorOutput "Web UI: http://localhost:3000" "green"
        Invoke-Command "dev" "Starting development servers"
    }
    
    "electron" {
        Write-Section "Starting Electron Development"
        Write-ColorOutput "Building and starting Electron app..." "blue"
        Invoke-Command "electron" "Starting Electron development"
    }
    
    "build" {
        Write-Section "Building Application"
        Write-ColorOutput "Building for production..." "blue"
        Invoke-Command "build" "Building application"
    }
    
    "package" {
        Write-Section "Packaging Application"
        Write-ColorOutput "Packaging as Windows executable..." "blue"
        Invoke-Command "package" "Packaging application"
    }
    
    "test" {
        Write-Section "Running Tests"
        Write-ColorOutput "Testing executable..." "blue"
        Invoke-Command "test" "Running tests"
    }
    
    "help" {
        Show-Help
    }
    
    default {
        Write-ColorOutput "Unknown command: $Command" "red"
        Write-ColorOutput "Use 'help' to see available commands" "yellow"
        exit 1
    }
}

