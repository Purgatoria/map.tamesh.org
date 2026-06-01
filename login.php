<?php
session_start();
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

        // Şifreyi senin yöntemine göre hashle
        $salt = env('AUTH_SALT');
        $hashedPassword = hash('sha256', $password . $salt);

        // Kullanıcıyı sorgula
        $stmt = $pdo->prepare("SELECT * FROM mqtt_user WHERE username = ? AND password_hash = ?");
        $stmt->execute([$username, $hashedPassword]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            $_SESSION['username'] = $username;
            echo json_encode(["success" => true, "redirect" => "https://map.tamesh.org"]);
        } else {
            echo json_encode(["success" => false]);
        }

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Veritabanı hatası."]);
    }

    exit;
}
?>

<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Giriş</title>
    <link rel="stylesheet" href="./css/login.css?v=<?= time() ?>" />
</head>
<body>

<div class="login-container">
    <h2>Giriş Yap</h2>
    <form id="loginForm">
        <div class="input-group">
            <label for="username">Kullanıcı Adı</label>
            <input type="text" id="username" name="username" required autocomplete="username">
        </div>
        <div class="input-group">
            <label for="password">Şifre</label>
            <input type="password" id="password" name="password" required autocomplete="current-password">
        </div>
        <div id="errorMessage" class="error-message"></div>
        <button type="submit" class="login-btn">Giriş</button>
    </form>
</div>

<script>
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('errorMessage');
    
    errorDiv.style.display = 'none';
    errorDiv.innerText = '';
    
    if (!usernameInput || !passwordInput) {
        errorDiv.innerText = 'Lütfen kullanıcı adı ve şifrenizi girin.';
        errorDiv.style.display = 'block';
        return;
    }

    fetch("login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = data.redirect;
        } else {
            errorDiv.innerText = data.message || "Hatalı kullanıcı adı veya şifre.";
            errorDiv.style.display = 'block';
        }
    })
    .catch(error => {
        errorDiv.innerText = "Bir hata oluştu. Lütfen tekrar deneyin.";
        errorDiv.style.display = 'block';
    });
});
</script>

</body>
</html>
