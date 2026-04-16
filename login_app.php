<?php
require_once 'config.php';

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    header("Content-Type: application/json");

    $data = json_decode(file_get_contents("php://input"), true);
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';

    try {
        $dsn = sprintf("mysql:host=%s;dbname=%s;charset=%s", env('DB_HOST'), env('DB_NAME'), env('DB_CHARSET'));
        $pdo = new PDO($dsn, env('DB_USER'), env('DB_PASS'));
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Kullanıcıyı sorgula
        $stmt = $pdo->prepare("SELECT * FROM mqtt_user WHERE username = ? AND password_hash = ?");
        $stmt->execute([$username, $password]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false]);
        }

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Veritabanı hatası."]);
    }
    exit;
}
?>