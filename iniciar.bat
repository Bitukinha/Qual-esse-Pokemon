@echo off
title Jogo da Memoria Pokemon - servidor
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado.
  echo Instale em https://nodejs.org ou use o memoria-pokemon.exe
  pause
  exit /b
)

if not exist node_modules (
  echo Instalando dependencias...
  call npm install
)

node server.js
pause
