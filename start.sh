#!/bin/bash

echo ""
echo "  Compilation du serveur..."
javac FidelioServer.java

if [ $? -ne 0 ]; then
    echo "  ERREUR : La compilation a echoue."
    echo "  Installez Java JDK : sudo apt install default-jdk"
    exit 1
fi

echo "  Lancement sur http://localhost:8080"
echo ""
java FidelioServer 8080 .
