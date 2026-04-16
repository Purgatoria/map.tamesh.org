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
  <title>Giriş</title>
</head>
<body>

<script>
function loginPrompt() {
  const username = prompt("Kullanıcı adınızı girin:");
  if (username !== null && username.trim() !== "") {
    const password = prompt("Şifrenizi girin:");
    if (password !== null && password.trim() !== "") {
      fetch("login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username, password: password })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Başarılı → index.php’ye yönlendir
          window.location.href = data.redirect;
        } else {
          // Hatalı giriş → tekrar sor
          alert("Hatalı kullanıcı adı veya şifre. Lütfen tekrar deneyin.");
          loginPrompt(); // Recursive çağrı
        }
      })
      .catch(error => {
        alert("Hata oluştu: " + error);
      });
    } else {
      alert("Şifre boş bırakıldı.");
      loginPrompt(); // tekrar sor
    }
  } else {
    alert("Kullanıcı adı boş bırakıldı.");
    loginPrompt(); // tekrar sor
  }
}

// Sayfa yüklendiğinde çalıştır
loginPrompt();
</script>

</body>
</html>
