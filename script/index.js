resizeBody();
window.onresize = function () { resizeBody(); }

function resizeBody() {
    let windowHeight = $(window).height();
    $('#map').css('height', windowHeight);
}

var map = L.map('map', {
    center: [39, 35],
    zoom: 7
});

var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
});

var satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

var darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
});

osmLayer.addTo(map); // Varsayılan katman

var baseMaps = {
    "Normal (OSM)": osmLayer,
    "Topoğrafya": topoLayer,
    "Uydu Görünümü": satelliteLayer,
    "Koyu Tema": darkLayer
};

let isMobileView = window.innerWidth <= 768 || window.outerWidth <= 768;
L.control.layers(baseMaps, null, {
    position: isMobileView ? 'bottomleft' : 'topright', 
    collapsed: isMobileView
}).addTo(map);

var sidebar = L.control.sidebar('sidebar', {
    position: 'left',
    closeButton: false
});
map.addControl(sidebar);

var markers = new L.MarkerClusterGroup({
    maxClusterRadius: 40, // Normalde 80'dir. Yarı yarıya düşürdük, daha zor gruplaşır.
    disableClusteringAtZoom: 14 // 14 seviyesine (mahalle boyutu) yaklaşıldığında gruplamayı tamamen kapatır.
});
window.globalNodes = [];
let currentPolylines = [];

function clearPolylines() {
    currentPolylines.forEach(p => map.removeLayer(p));
    currentPolylines = [];
}

map.on('click', function() {
    sidebar.hide();
    clearPolylines();
});

sidebar.on('hidden', function() {
    clearPolylines();
});

function createGaugeSVG(value, min, max, title, unit, color) {
    if (value === null || isNaN(value)) return '';
    let percentage = (value - min) / (max - min);
    if (percentage > 1) percentage = 1;
    if (percentage < 0) percentage = 0;
    
    let radius = 35;
    let circumference = 2 * Math.PI * radius * 0.75;
    let strokeDashoffset = circumference - (percentage * circumference);

    return `
    <div class="gauge-card">
        <svg width="100" height="90" viewBox="0 0 100 90">
            <!-- Background arc -->
            <path d="M 25 70 A 35 35 0 1 1 75 70" fill="none" stroke="#eee" stroke-width="8" stroke-linecap="round"/>
            <!-- Value arc -->
            <path d="M 25 70 A 35 35 0 1 1 75 70" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"
                  stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}" />
            <text x="50" y="45" text-anchor="middle" font-size="22" font-weight="700" fill="#333">${value.toFixed(1)}</text>
            <text x="50" y="60" text-anchor="middle" font-size="10" font-weight="600" fill="#888">${title}</text>
            <text x="50" y="72" text-anchor="middle" font-size="10" font-weight="700" fill="${color}">${unit}</text>
            <text x="25" y="85" text-anchor="middle" font-size="8" fill="#ccc">${min}</text>
            <text x="75" y="85" text-anchor="middle" font-size="8" fill="#ccc">${max}</text>
        </svg>
    </div>`;
}

function openSidebar(item, lat, lng) {
    clearPolylines();

    let roleName = item.role_name || "CLIENT";
    let markerColor = MapConfig.roles[roleName] || MapConfig.roles["DEFAULT"];

    let d = new Date(item.updated_at);
    let formatted = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;

    let html = `
        <div class="sidebar-header">
            <div>
                <h2 class="sidebar-title" style="color: ${markerColor};">
                    <i class="fa fa-circle" style="font-size: 14px; vertical-align: middle;"></i> 
                    ${item.short_name}
                </h2>
                <div class="sidebar-subtitle">
                    <i class="fa fa-location-dot"></i> ${lat.toFixed(5)}, ${lng.toFixed(5)}
                </div>
                <div class="sidebar-subtitle">
                    <i class="fa fa-clock"></i> Son Görülme: ${formatted}
                </div>
            </div>
            <div class="sidebar-close-btn" onclick="sidebar.hide();"><i class="fa fa-times"></i></div>
        </div>
    `;

    // Cihaz Detayları Grid
    let battery_level = parseFloat(item.battery_level);
    let voltage = parseFloat(item.voltage);
    
    html += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; font-size: 13px; background: #f8f9fa; padding: 15px; border-radius: 12px; border: 1px solid #eee;">`;
    html += `<div><strong>Rol:</strong> ${item.role_name}</div>`;
    html += `<div><strong>Model:</strong> ${item.hardware_model_name}</div>`;
    html += `<div><strong>FW:</strong> ${item.firmware_version}</div>`;
    html += `<div><strong>Bölge:</strong> ${item.region_name}</div>`;
    html += `<div><strong>Modem:</strong> ${item.modem_preset_name}</div>`;
    html += `<div><strong>QTH:</strong> ${toMaidenhead(lat, lng)}</div>`;
    
    if (item.altitude != null && !isNaN(item.altitude)) {
        html += `<div><strong>Rakım:</strong> ${item.altitude}m</div>`;
    }
    if (battery_level <= 100 && !isNaN(battery_level)) {
        html += `<div><strong>Pil:</strong> %${battery_level} (${voltage.toFixed(2)}V)</div>`;
    }
    html += `</div>`;

    // Gauges
    let temp = parseFloat(item.temperature);
    let hum = parseFloat(item.relative_humidity);
    let press = parseFloat(item.barometric_pressure);

    if (!isNaN(temp) || !isNaN(hum) || !isNaN(press)) {
        html += `<div class="dashboard-grid">`;
        if (!isNaN(temp)) html += createGaugeSVG(temp, -20, 60, 'TEMP', '°C', '#e74c3c');
        if (!isNaN(hum)) html += createGaugeSVG(hum, 0, 100, 'HUMIDITY', '%', '#3498db');
        if (!isNaN(press)) html += createGaugeSVG(press, 900, 1100, 'PRESSURE', 'hPa', '#2ecc71');
        html += `</div>`;
    }

    // Neighbours
    html += `<h3 class="section-title"><i class="fa fa-network-wired"></i> Komşular (${item.neighbours ? item.neighbours.length : 0})</h3>`;
    html += `<div class="neighbour-list">`;

    if (item.neighbours && item.neighbours.length > 0) {
        item.neighbours.forEach(n => {
            let nData = window.globalNodes.find(x => x.node_id === n.node_id || x.node_id === n.node_id.toString());
            let nName = nData ? (nData.long_name || nData.short_name) : `Bilinmeyen (ID: ${n.node_id})`;
            
            let clickAction = "";
            if (nData && nData.latitude && nData.longitude) {
                let nLat = nData.latitude / 1e7;
                let nLng = nData.longitude / 1e7;
                
                let p = L.polyline([[lat, lng], [nLat, nLng]], {
                    color: 'rgb(31, 97, 65)',
                    weight: 3,
                    dashArray: '8, 8',
                    opacity: 0.8
                }).addTo(map);
                
                p.bindTooltip(`SNR: ${n.snr} dB`, {
                    permanent: true,
                    className: 'rf-tooltip',
                    direction: 'center'
                }).openTooltip();
                
                currentPolylines.push(p);
                
                clickAction = `onclick="map.flyTo([${nLat}, ${nLng}], 15, {animate: true, duration: 1.5});" title="Haritada konuma git"`;
            }

            html += `
                <div class="neighbour-item" ${clickAction}>
                    <div class="neighbour-name">${nName}</div>
                    <div class="neighbour-snr">SNR: ${n.snr}</div>
                </div>
            `;
        });
    } else {
        html += `<div class="no-data">Komşu verisi bulunamadı.</div>`;
    }
    
    html += `</div>`;

    document.getElementById('sb-content').innerHTML = html;
    sidebar.show();
}

$.getJSON('https://map.tamesh.org/api/nodes', function (data) {
    window.globalNodes = data.nodes;
    data.nodes.forEach(function (item) {
      	if (item.latitude == null && item.longitude == null) return;
        let lat = item.latitude / 1e7;
        let lng = item.longitude / 1e7;

        if (!isNaN(lat) && !isNaN(lng)) {
            let roleName = item.role_name || "CLIENT";
            let markerColor = MapConfig.roles[roleName] || MapConfig.roles["DEFAULT"];
            
            let iconHtml = `<div style="
                background-color: ${markerColor};
                width: ${MapConfig.markerRadius * 2}px;
                height: ${MapConfig.markerRadius * 2}px;
                border-radius: 50%;
                border: ${MapConfig.markerStyle.weight}px solid ${MapConfig.markerStyle.color};
                opacity: ${MapConfig.markerStyle.fillOpacity};
                box-shadow: 0 0 3px rgba(0,0,0,0.5);
                box-sizing: border-box;
            "></div>`;

            let customIcon = L.divIcon({
                html: iconHtml,
                className: 'custom-circle-icon',
                iconSize: [MapConfig.markerRadius * 2, MapConfig.markerRadius * 2],
                iconAnchor: [MapConfig.markerRadius, MapConfig.markerRadius]
            });

            let marker = L.marker([lat, lng], { icon: customIcon })
                .bindTooltip(`${item.long_name} (${item.short_name})`, {
                    permanent: true,
                    direction: 'bottom',
                    className: 'node-label',
                    offset: [0, MapConfig.markerRadius]
                })
                .on('click', function() {
                    openSidebar(item, lat, lng);
                });
            markers.addLayer(marker);
        }
    });
    map.addLayer(markers);
});

function toMaidenhead(lat, lon) {
    lat += 90;
    lon += 180;

    const A = 'A'.charCodeAt(0);

    const fieldLon = String.fromCharCode(Math.floor(lon / 20) + A);
    const fieldLat = String.fromCharCode(Math.floor(lat / 10) + A);

    const squareLon = Math.floor((lon % 20) / 2);
    const squareLat = Math.floor(lat % 10);

    const subLon = String.fromCharCode(Math.floor(((lon % 2) * 12)) + A);
    const subLat = String.fromCharCode(Math.floor(((lat % 1) * 24)) + A);

    return fieldLon + fieldLat + squareLon + squareLat + subLon + subLat;
}

// Renk Gösterge (Legend) Kartı
var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend');
    div.innerHTML += '<h4 style="margin: 0 0 8px 0; font-size: 14px;">Rol Renkleri</h4>';
    
    // İsimleri gizle/göster Toggle
    var toggleLabel = L.DomUtil.create('label', 'toggle-labels', div);
    toggleLabel.innerHTML = '<input type="checkbox" id="toggleNodeLabels" checked> Haritada İsimleri Göster';
    toggleLabel.firstChild.addEventListener('change', function(e) {
        if (e.target.checked) {
            document.body.classList.remove('hide-node-labels');
        } else {
            document.body.classList.add('hide-node-labels');
        }
    });

    // config.js içerisindeki rolleri dön ve listeye ekle
    var gridDiv = document.createElement('div');
    gridDiv.className = 'legend-grid';
    
    for (var role in MapConfig.roles) {
        if (role !== "DEFAULT") {
            gridDiv.innerHTML +=
                '<div class="legend-item">' +
                '<i style="background:' + MapConfig.roles[role] + '; border: ' + MapConfig.markerStyle.weight + 'px solid ' + MapConfig.markerStyle.color + '"></i> ' +
                '<span>' + role + '</span>' +
                '</div>';
        }
    }
    div.appendChild(gridDiv);
    
    // Çekmece olayının map sürüklemesini engellememesi için
    L.DomEvent.disableClickPropagation(div);

    return div;
};

legend.addTo(map);

// SEARCH BAR LOGIC
$(document).ready(function() {
    const searchInput = document.getElementById('searchInput');
    const searchDropdown = document.getElementById('searchDropdown');

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            searchDropdown.classList.remove('show');
        }
    });

    searchInput.addEventListener('input', function(e) {
        let val = e.target.value.toLowerCase().trim();
        searchDropdown.innerHTML = '';
        
        if (val.length < 2) {
            searchDropdown.classList.remove('show');
            return;
        }

        let results = window.globalNodes.filter(node => {
            let sn = (node.short_name || "").toLowerCase();
            let ln = (node.long_name || "").toLowerCase();
            let id = (node.node_id || "").toString();
            return sn.includes(val) || ln.includes(val) || id.includes(val);
        }).slice(0, 15);

        if (results.length > 0) {
            results.forEach(node => {
                let name = node.long_name || node.short_name || "Bilinmeyen Node";
                let div = document.createElement('div');
                div.className = 'search-item';
                div.innerHTML = `
                    <div class="search-item-name"><i class="fa fa-microchip search-item-icon"></i> ${name}</div>
                    <div class="search-item-id">${node.short_name || node.node_id}</div>
                `;
                
                div.addEventListener('click', function() {
                    searchInput.value = '';
                    searchDropdown.classList.remove('show');
                    
                    if (node.latitude != null && node.longitude != null) {
                        let lat = node.latitude / 1e7;
                        let lng = node.longitude / 1e7;
                        
                        map.flyTo([lat, lng], 15, {
                            animate: true,
                            duration: 1.5
                        });

                        setTimeout(() => {
                            openSidebar(node, lat, lng);
                        }, 1500);
                    }
                });
                
                searchDropdown.appendChild(div);
            });
            searchDropdown.classList.add('show');
        } else {
            searchDropdown.classList.remove('show');
        }
    });
});
