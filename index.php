<?php
session_start();
if (!isset($_SESSION['username'])) {
    header("Location: login.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Map</title>
	<meta name="referrer" content="strict-origin-when-cross-origin">
    <link rel="stylesheet" href="./css/index.css?v=<?= time() ?>" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet-sidebar@0.2.4/src/L.Control.Sidebar.min.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
</head>

<body>
    <div id="map"></div>

    <!-- SEARCH BAR -->
    <div class="search-container">
        <i class="fa fa-search search-icon"></i>
        <input type="text" id="searchInput" placeholder="Node ara (Kısa ad, uzun ad veya ID)..." autocomplete="off" />
        <div class="search-dropdown" id="searchDropdown"></div>
    </div>

    <!-- SIDEBAR -->
    <div id="sidebar" style="padding: 0;">
        <div id="sb-content"></div>
    </div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/leaflet-sidebar@0.2.4/src/L.Control.Sidebar.min.js"></script>
    <script src="./script/config.js?v=<?= time() ?>"></script>
    <script src="./script/index.js?v=<?= time() ?>"></script>
</body>

</html>