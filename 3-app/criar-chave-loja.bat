@echo off
chcp 65001 >nul
rem Cria a chave de assinatura da Google Play (chave de upload) do Tralha de Guerra. Rode UMA vez só.
rem A chave fica em 3-app\chave\ e a senha em android\chave-loja.properties: os dois ficam fora do git.
rem GUARDE uma cópia da pasta 3-app\chave e da senha num lugar seguro (pendrive, Google Drive): sem elas não dá para atualizar o jogo na loja.
cd /d "%~dp0"
if exist chave\tralha-loja.jks (
  echo A chave ja existe em 3-app\chave\tralha-loja.jks. Nada foi feito.
  pause & exit /b
)
set JDK=
for /d %%d in ("%~dp0jdk\jdk-21*" "%~dp0..\..\guardioes-da-fogueira-site\3-app\jdk\jdk-21*") do if not defined JDK set "JDK=%%~fd"
if not defined JDK ( echo JDK 21 nao encontrado. & pause & exit /b 1 )
echo.
echo Escolha uma senha forte (pelo menos 8 caracteres, sem espacos nem aspas). Ela aparece enquanto voce digita: confira antes do Enter.
set /p SENHA=Senha da chave:
if "%SENHA%"=="" ( echo Senha vazia. & pause & exit /b 1 )
mkdir chave 2>nul
"%JDK%\bin\keytool.exe" -genkeypair -v -keystore chave\tralha-loja.jks -alias tralha -keyalg RSA -keysize 2048 -validity 10000 -storepass "%SENHA%" -keypass "%SENHA%" -dname "CN=Pena e Pincel, O=Pena e Pincel, C=BR"
if errorlevel 1 ( echo Falhou ao criar a chave. & pause & exit /b 1 )
(
  echo arquivo=../../chave/tralha-loja.jks
  echo apelido=tralha
  echo senha=%SENHA%
) > android\chave-loja.properties
echo.
echo Pronto. Chave em 3-app\chave\tralha-loja.jks e senha em 3-app\android\chave-loja.properties.
echo Agora faca uma COPIA DE SEGURANCA da pasta 3-app\chave e anote a senha num lugar seguro.
pause
