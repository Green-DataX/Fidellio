@echo off
chcp 65001 >nul
title Fidelio Server

cls
echo.
echo  +==========================================+
echo  ^|   FIDELIO SERVER - Windows              ^|
echo  +==========================================+
echo.

:: ── Verification Java installe ──────────────────
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERREUR : Java n'est PAS installe sur votre PC.
    echo.
    echo  Telechargez Java ici :
    echo  https://www.java.com/fr/download/
    echo.
    echo  Apres installation, relancez ce fichier.
    echo.
    start https://www.java.com/fr/download/
    pause
    exit /b 1
)

echo  OK : Java detecte !
echo.

:: ── Verification si deja compile ────────────────
if not exist FidelioServer.class (
    echo  Compilation en cours...
    javac FidelioServer.java

    if %errorlevel% neq 0 (
        echo.
        echo  ERREUR de compilation.
        echo  Verifiez que FidelioServer.java est present.
        echo.
        pause
        exit /b 1
    )
    echo  OK : Compilation reussie !
    echo.
) else (
    echo  OK : Serveur deja compile.
    echo.
)

:: ── Lancement du serveur ─────────────────────────
echo  Demarrage sur http://localhost:8080
echo.

:: Ouvre le navigateur automatiquement apres 2 secondes
start /b cmd /c "timeout /t 2 >nul && start http://localhost:8080"

:: Lance le serveur Java
java FidelioServer 8080 .

echo.
echo  Serveur arrete.
pause
