<?php
/**
 * GEÇİŞ DUYURUSU — map.tamesh.org  →  purgatoria.network/haritalar/meshtastic
 *
 * Bu harita Purgatoria Network'e taşındı. Site kapanmadı; harita arkada
 * çalışmaya devam ediyor, bu dosya yalnızca yeni adresi duyuran katmanı basar.
 *
 * KULLANIM — index.php ve login.php içinde <body> etiketinin HEMEN altında:
 *     <?php include __DIR__ . '/gecis.php'; ?>
 *
 * KALDIRMA — o include satırlarını silmek yeterli; başka hiçbir yere dokunmaz.
 * Stiller css/gecis.css içinde, tek yerden yönetiliyor.
 *
 * Neden iki sayfada: index.php oturum yoksa login.php'ye yönlendiriyor, yani
 * gelen ziyaretçinin çoğunun ilk gördüğü sayfa login.php. Duyuru ikisinde de
 * görünmeli, yoksa insanlar giriş ekranında hiçbir şey görmeden eski haritaya
 * girmeye çalışmaya devam eder.
 */
?>
<link rel="stylesheet" href="./css/gecis.css?v=3" />
<div id="pn-gecis" class="pn-gecis" role="dialog" aria-modal="true"
     aria-labelledby="pn-gecis-baslik" aria-describedby="pn-gecis-metin">
    <div class="pn-gecis-kart">
        <p class="pn-gecis-marka">Purgatoria Network</p>
        <h1 id="pn-gecis-baslik">Meshtastic Haritası artık Purgatoria.network üzerindedir</h1>
        <p id="pn-gecis-metin">
            Bu sayfa güncellenmiyor. Düğüm konumları, komşuluklar ve traceroute kayıtları
            bundan sonra yalnızca <strong>purgatoria.network/haritalar/meshtastic</strong>
            adresinde yayınlanıyor. Yeni harita Purgatoria Network üyelerine açıktır;
            hesabınla giriş yapman gerekir.
        </p>
        <div class="pn-gecis-eylem">
            <a class="pn-gecis-birincil" href="https://purgatoria.network/haritalar/meshtastic" data-pn-git>Yeni haritaya git</a>
            <button type="button" class="pn-gecis-ikincil" data-pn-kapat>Eski haritada kal</button>
        </div>
    </div>
</div>
<script>
    (function () {
        var katman = document.getElementById("pn-gecis");
        if (!katman) return;

        // Kapanınca odağı, katman açılmadan önceki elemana geri veriyoruz.
        var oncekiOdak = document.activeElement;

        function kapat() {
            katman.hidden = true;
            if (oncekiOdak && typeof oncekiOdak.focus === "function") oncekiOdak.focus();
        }

        // Kartın dışına (karartılmış alana) tıklamak kapatır; kartın içi kapatmaz.
        katman.addEventListener("click", function (olay) {
            if (olay.target === katman) kapat();
        });

        var kapatDugmesi = katman.querySelector("[data-pn-kapat]");
        if (kapatDugmesi) kapatDugmesi.addEventListener("click", kapat);

        document.addEventListener("keydown", function (olay) {
            if (olay.key === "Escape" && !katman.hidden) kapat();
        });

        var birincil = katman.querySelector("[data-pn-git]");
        if (birincil) birincil.focus();
    })();
</script>
