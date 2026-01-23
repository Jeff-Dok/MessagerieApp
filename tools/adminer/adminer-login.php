<?php
/**
 * Configuration de connexion automatique pour Adminer
 *
 * Ce fichier pré-configure les paramètres de connexion à PostgreSQL
 * pour faciliter l'accès à votre base de données
 */

// Charger les variables d'environnement depuis .env
function loadEnv($path) {
    if (!file_exists($path)) {
        return [];
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $env = [];

    foreach ($lines as $line) {
        // Ignorer les commentaires
        if (strpos(trim($line), '#') === 0) {
            continue;
        }

        // Parser les variables
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $env[trim($key)] = trim($value);
        }
    }

    return $env;
}

// Charger la configuration
$env = loadEnv(__DIR__ . '/../../backend/.env');

// Configuration PostgreSQL depuis .env
$db_host = $env['DB_HOST'] ?? 'localhost';
$db_port = $env['DB_PORT'] ?? '5432';
$db_name = $env['DB_NAME'] ?? 'messagerie_db';
$db_user = $env['DB_USER'] ?? 'postgres';

?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connexion Adminer - MessagerieApp</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 500px;
            width: 100%;
        }

        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }

        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }

        .info-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin-bottom: 25px;
            border-radius: 4px;
        }

        .info-box h3 {
            color: #667eea;
            font-size: 16px;
            margin-bottom: 10px;
        }

        .connection-info {
            display: grid;
            gap: 10px;
        }

        .connection-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
        }

        .connection-item:last-child {
            border-bottom: none;
        }

        .connection-label {
            color: #666;
            font-weight: 600;
            font-size: 14px;
        }

        .connection-value {
            color: #333;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }

        .btn-container {
            display: flex;
            gap: 15px;
            margin-top: 30px;
        }

        .btn {
            flex: 1;
            padding: 14px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            text-align: center;
            display: inline-block;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .btn-secondary {
            background: #f8f9fa;
            color: #667eea;
            border: 2px solid #667eea;
        }

        .btn-secondary:hover {
            background: #667eea;
            color: white;
        }

        .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin-top: 20px;
            border-radius: 4px;
            font-size: 13px;
            color: #856404;
        }

        .theme-note {
            background: #e7f3ff;
            border-left: 4px solid #2196F3;
            padding: 12px;
            margin-top: 15px;
            border-radius: 4px;
            font-size: 13px;
            color: #0c5460;
        }

        @media (max-width: 600px) {
            .container {
                padding: 25px;
            }

            .btn-container {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Adminer Database Manager</h1>
        <p class="subtitle">Interface de gestion de base de données pour MessagerieApp</p>

        <div class="info-box">
            <h3>📋 Informations de connexion PostgreSQL</h3>
            <div class="connection-info">
                <div class="connection-item">
                    <span class="connection-label">Système:</span>
                    <span class="connection-value">PostgreSQL</span>
                </div>
                <div class="connection-item">
                    <span class="connection-label">Serveur:</span>
                    <span class="connection-value"><?php echo htmlspecialchars($db_host . ':' . $db_port); ?></span>
                </div>
                <div class="connection-item">
                    <span class="connection-label">Base de données:</span>
                    <span class="connection-value"><?php echo htmlspecialchars($db_name); ?></span>
                </div>
                <div class="connection-item">
                    <span class="connection-label">Utilisateur:</span>
                    <span class="connection-value"><?php echo htmlspecialchars($db_user); ?></span>
                </div>
            </div>
        </div>

        <div class="btn-container">
            <a href="./adminer.php?pgsql=<?php echo urlencode($db_host . ':' . $db_port); ?>&username=<?php echo urlencode($db_user); ?>&db=<?php echo urlencode($db_name); ?>" class="btn btn-primary">
                🚀 Ouvrir Adminer
            </a>
        </div>

        <div class="warning">
            <strong>⚠️ Attention:</strong> Cet outil donne un accès complet à votre base de données.
            À utiliser uniquement en développement local. Ne jamais exposer en production!
        </div>
    </div>
</body>
</html>
