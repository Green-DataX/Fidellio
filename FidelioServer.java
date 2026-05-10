import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.file.*;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Executors;

/**
 * ╔══════════════════════════════════════════╗
 *  FIDELIO SERVER — Serveur HTTP Java
 *  Port par défaut : 8080
 *  Usage : java FidelioServer [port] [dossier]
 * ╚══════════════════════════════════════════╝
 */
public class FidelioServer {

    // ── Configuration ──────────────────────────
    static final int    DEFAULT_PORT   = 8080;
    static final String DEFAULT_FOLDER = ".";   // dossier racine du site

    // ── Types MIME ─────────────────────────────
    static final Map<String, String> MIME_TYPES = new HashMap<>();
    static {
        MIME_TYPES.put("html", "text/html; charset=UTF-8");
        MIME_TYPES.put("htm",  "text/html; charset=UTF-8");
        MIME_TYPES.put("css",  "text/css; charset=UTF-8");
        MIME_TYPES.put("js",   "application/javascript; charset=UTF-8");
        MIME_TYPES.put("json", "application/json; charset=UTF-8");
        MIME_TYPES.put("png",  "image/png");
        MIME_TYPES.put("jpg",  "image/jpeg");
        MIME_TYPES.put("jpeg", "image/jpeg");
        MIME_TYPES.put("gif",  "image/gif");
        MIME_TYPES.put("svg",  "image/svg+xml");
        MIME_TYPES.put("ico",  "image/x-icon");
        MIME_TYPES.put("woff", "font/woff");
        MIME_TYPES.put("woff2","font/woff2");
        MIME_TYPES.put("ttf",  "font/ttf");
        MIME_TYPES.put("txt",  "text/plain; charset=UTF-8");
        MIME_TYPES.put("pdf",  "application/pdf");
    }

    // ══════════════════════════════════════════
    //  MAIN
    // ══════════════════════════════════════════
    public static void main(String[] args) throws IOException {

        int    port   = DEFAULT_PORT;
        String folder = DEFAULT_FOLDER;

        // Lecture des arguments optionnels
        if (args.length >= 1) {
            try { port = Integer.parseInt(args[0]); }
            catch (NumberFormatException e) {
                System.err.println("⚠️  Port invalide : " + args[0] + " → utilisation du port " + DEFAULT_PORT);
            }
        }
        if (args.length >= 2) {
            folder = args[1];
        }

        // Vérification du dossier
        File root = new File(folder).getCanonicalFile();
        if (!root.exists() || !root.isDirectory()) {
            System.err.println("❌ Dossier introuvable : " + root.getAbsolutePath());
            System.exit(1);
        }

        // Création du serveur
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/", new StaticFileHandler(root));
        server.setExecutor(Executors.newFixedThreadPool(10)); // 10 threads
        server.start();

        // Message de démarrage
        System.out.println();
        System.out.println("  ╔══════════════════════════════════════════╗");
        System.out.println("  ║   🍟  FIDELIO SERVER — Démarré !         ║");
        System.out.println("  ╠══════════════════════════════════════════╣");
        System.out.printf ("  ║   🌐  http://localhost:%-18d  ║%n", port);
        System.out.println("  ║   📁  Dossier : " + padRight(root.getAbsolutePath(), 24) + "  ║");
        System.out.println("  ║   🔴  CTRL+C pour arrêter                ║");
        System.out.println("  ╚══════════════════════════════════════════╝");
        System.out.println();

        // Arrêt propre avec CTRL+C
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("\n  👋 Serveur arrêté proprement.");
            server.stop(0);
        }));
    }

    // ══════════════════════════════════════════
    //  HANDLER — Sert les fichiers statiques
    // ══════════════════════════════════════════
    static class StaticFileHandler implements HttpHandler {

        private final File rootDir;

        StaticFileHandler(File rootDir) {
            this.rootDir = rootDir;
        }

        @Override
        public void handle(HttpExchange exchange) throws IOException {

            String method = exchange.getRequestMethod();
            String uri    = exchange.getRequestURI().getPath();

            // Sécurité : bloquer les chemins avec ".."
            if (uri.contains("..")) {
                sendError(exchange, 403, "403 Forbidden");
                return;
            }

            // Index par défaut
            if (uri.equals("/") || uri.isEmpty()) {
                uri = "/index.html";
            }

            // Résolution du fichier
            File file = new File(rootDir, uri).getCanonicalFile();

            // Sécurité : le fichier doit rester dans le rootDir
            if (!file.getAbsolutePath().startsWith(rootDir.getAbsolutePath())) {
                sendError(exchange, 403, "403 Forbidden");
                return;
            }

            // Si c'est un dossier → chercher index.html dedans
            if (file.isDirectory()) {
                file = new File(file, "index.html");
            }

            // Fichier introuvable
            if (!file.exists() || !file.isFile()) {
                sendNotFound(exchange, uri);
                return;
            }

            // Lecture et envoi du fichier
            String mimeType = getMimeType(file.getName());
            byte[] content  = Files.readAllBytes(file.toPath());

            exchange.getResponseHeaders().set("Content-Type", mimeType);
            exchange.getResponseHeaders().set("Cache-Control", "no-cache");
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.sendResponseHeaders(200, content.length);

            try (OutputStream os = exchange.getResponseBody()) {
                os.write(content);
            }

            // Log de la requête
            System.out.printf("  ✅  %-4s %d  %s%n", method, 200, uri);
        }

        // ── Erreur 404 ──────────────────────────
        private void sendNotFound(HttpExchange exchange, String uri) throws IOException {
            String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'>"
                + "<title>404 — Fidelio</title>"
                + "<style>body{font-family:sans-serif;display:flex;flex-direction:column;"
                + "align-items:center;justify-content:center;height:100vh;margin:0;"
                + "background:#FFF8EF;color:#1A1208;}"
                + "h1{font-size:5rem;margin:0;color:#FF6B2B;} p{color:#9C7A52;}"
                + "a{color:#FF6B2B;text-decoration:none;font-weight:bold;}"
                + "</style></head><body>"
                + "<h1>404</h1>"
                + "<p>Page introuvable : <code>" + uri + "</code></p>"
                + "<a href='/'>← Retour à l'accueil</a>"
                + "</body></html>";

            byte[] content = html.getBytes("UTF-8");
            exchange.getResponseHeaders().set("Content-Type", "text/html; charset=UTF-8");
            exchange.sendResponseHeaders(404, content.length);
            try (OutputStream os = exchange.getResponseBody()) { os.write(content); }

            System.out.printf("  ❌  %-4s %d  %s%n", exchange.getRequestMethod(), 404, uri);
        }

        // ── Erreur générique ────────────────────
        private void sendError(HttpExchange exchange, int code, String message) throws IOException {
            byte[] content = message.getBytes("UTF-8");
            exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=UTF-8");
            exchange.sendResponseHeaders(code, content.length);
            try (OutputStream os = exchange.getResponseBody()) { os.write(content); }
        }

        // ── Type MIME selon extension ───────────
        private String getMimeType(String filename) {
            int dot = filename.lastIndexOf('.');
            if (dot >= 0) {
                String ext = filename.substring(dot + 1).toLowerCase();
                return MIME_TYPES.getOrDefault(ext, "application/octet-stream");
            }
            return "application/octet-stream";
        }
    }

    // ── Utilitaire padding ──────────────────────
    static String padRight(String s, int n) {
        if (s.length() > n) return s.substring(0, n - 3) + "...";
        return String.format("%-" + n + "s", s);
    }
}
