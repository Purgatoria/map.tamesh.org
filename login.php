<?php
session_start();
require_once 'config.php';

/**
 * GİRİŞ — SALT DÜZELTMESİ (2026-11-04)
 *
 * ── SORUN ────────────────────────────────────────────────────────────────────
 * Bu dosya şifreyi şöyle doğruluyordu:
 *
 *     $salt = env('AUTH_SALT');                       // .env'deki TEK global tuz
 *     $hashedPassword = hash('sha256', $password . $salt);
 *     SELECT ... WHERE username = ? AND password_hash = ?
 *
 * Ama `mqtt_user` tablosunda SATIR BAŞINA `salt` kolonu var ve EMQX
 * doğrulamayı oradan yapıyor:
 *
 *     password_hash_algorithm {name = sha256, salt_position = suffix}
 *     query = "SELECT password_hash, salt FROM mqtt_user where username = ${username}"
 *     → hash = sha256(parola + satirdaki_salt)
 *
 * ÖLÇÜM (386 kayıt):
 *     salt == global AUTH_SALT : 383   (eski hesaplar)
 *     salt != global (rastgele) :   3   (site üzerinden açılan yeni hesaplar)
 *
 * Yani siteden alınan şifreler MQTT'de ÇALIŞIYOR, sitede ÇALIŞMIYORDU.
 * Sebep: site global tuzla hash hesaplıyor, yeni kayıtların tuzu rastgele.
 *
 * ── ÇÖZÜM ────────────────────────────────────────────────────────────────────
 * Kullanıcıyı önce ADA göre çek, sonra hash'i O SATIRIN tuzuyla hesapla.
 * Böylece hem eski (global tuzlu) hem yeni (rastgele tuzlu) hesaplar çalışır.
 * Ek olarak, satır tuzu boşsa global tuza düşülüyor (savunma katmanı).
 *
 * NEDEN VERİTABANINI DEĞİŞTİRMİYORUZ: 383 eski kaydın tuzunu rastgele yapmak
 * EMQX'i de etkiler ve düz metin parolalar bilinmediği için hash yeniden
 * üretilemez — hesaplar kilitlenir. Okuma tarafını düzeltmek doğru çözüm.
 *
 * NEDEN `hash_equals`: `===` ilk farklı baytta döner (zamanlama sızıntısı).
 * Sabit zamanlı karşılaştırma.
 */

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    header("Content-Type: application/json");

    $data = json_decode(file_get_contents("php://input"), true);
    $username = isset($data['username']) ? trim((string) $data['username']) : '';
    $password = isset($data['password']) ? (string) $data['password'] : '';

    if ($username === '' || $password === '') {
        echo json_encode(["success" => false, "message" => "Kullanıcı adı ve şifre gerekli."]);
        exit;
    }

    try {
        $dsn = sprintf("mysql:host=%s;dbname=%s;charset=%s", env('DB_HOST'), env('DB_NAME'), env('DB_CHARSET'));
        $pdo = new PDO($dsn, env('DB_USER'), env('DB_PASS'));
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        // Kullanıcıyı getir — hash karşılaştırması PHP tarafında, satırın tuzuyla.
        $stmt = $pdo->prepare("SELECT username, password_hash, salt FROM mqtt_user WHERE username = ? LIMIT 1");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        $ok = false;
        if ($user) {
            // Satırın kendi tuzu; boşsa global tuza düş.
            $satirSalt = isset($user['salt']) && $user['salt'] !== '' ? $user['salt'] : env('AUTH_SALT');
            $hesap = hash('sha256', $password . $satirSalt);

            if (hash_equals((string) $user['password_hash'], $hesap)) {
                $ok = true;
            } else {
                /*
                  GERİYE DÖNÜK UYUM: satır tuzu boş/yanlış olan tek tük kayıt
                  için global tuzla da dene. Sadece ilk deneme başarısızsa
                  çalışır — ek maliyet yok.
                */
                $globalSalt = env('AUTH_SALT');
                if ($globalSalt && $globalSalt !== $satirSalt) {
                    $ok = hash_equals((string) $user['password_hash'], hash('sha256', $password . $globalSalt));
                }
            }
        }

        if ($ok) {
            // Oturum sabitleme (session fixation) koruması: girişte yeni kimlik.
            session_regenerate_id(true);
            $_SESSION['username'] = $user['username'];
            echo json_encode(["success" => true, "redirect" => "https://map.tamesh.org"]);
        } else {
            /*
              Kullanıcı var/yok ayrımı SIZDIRILMIYOR: ikisi de aynı yanıtı alır.
              Aksi hâlde "hangi kullanıcı adları var" bilgisi toplanabilir.
            */
            echo json_encode(["success" => false, "message" => "Hatalı kullanıcı adı veya şifre."]);
        }

    } catch (PDOException $e) {
        // Şifre/host SIZDIRILMIYOR; ayrıntı yalnız sunucu günlüğüne.
        error_log("[map login] DB hatası: " . $e->getMessage());
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

<?php include __DIR__ . '/gecis.php'; ?>

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
