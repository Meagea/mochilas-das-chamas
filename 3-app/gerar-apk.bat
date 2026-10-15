@echo off
rem Gera o APK do Tralha de Guerra (debug) e copia para esta pasta como Tralha-de-Guerra.apk
rem Antes, rode "node codigo\build.js" na pasta do projeto para levar o jogo novo para o aplicativo.
cd /d "%~dp0"
rem JDK 21: o deste projeto (jdk) ou, se não houver, o do Guardiões
for /d %%J in ("%~dp0..\..\guardioes-da-fogueira-site\3-app\jdk\jdk-21*") do set "JAVA_HOME=%%~fJ"
for /d %%J in ("%~dp0jdk\jdk-21*") do set "JAVA_HOME=%%~fJ"
cd android
call gradlew.bat assembleDebug
if errorlevel 1 ( echo. & echo Falhou. Veja a mensagem acima. & pause & exit /b 1 )
copy /y "app\build\outputs\apk\debug\app-debug.apk" "..\Tralha-de-Guerra.apk" >nul
echo.
echo Pronto: Tralha-de-Guerra.apk
pause
