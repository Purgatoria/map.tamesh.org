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

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    foo: 'bar',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

/*var sidebar = L.control.sidebar('sidebar', {
    position: 'left',
    closeButton: true
});
map.addControl(sidebar);*/

var markers = new L.MarkerClusterGroup();
$.getJSON('https://map.tamesh.org/api/nodes', function (data) {
    data.nodes.forEach(function (item) {
      	if (item.latitude == null && item.longitude == null) return;
        let lat = item.latitude / 1e7;
        let lng = item.longitude / 1e7;

        if (!isNaN(lat) && !isNaN(lng)) {
            let battery_level = parseFloat(item.battery_level);
            let voltage = parseFloat(item.voltage);
            let temperature = parseFloat(item.temperature);
            let relative_humidity = parseFloat(item.relative_humidity);
            let barometric_pressure = parseFloat(item.barometric_pressure);
            let d = new Date(item.updated_at);
            let formatted = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;

            var popupContent =
                `<h2>${item.long_name} (${item.short_name})</h2>` +
                `<hr>` +
                `<p><strong>FW Versiyon</strong>: ${item.firmware_version}</p>` +
                `<p><strong>Modem Ayarı</strong>: ${item.modem_preset_name}</p>` +
                `<p><strong>Bölge</strong>: ${item.region_name}</p>` +
                `<p><strong>Cihaz</strong>: ${item.hardware_model_name}</p>` +
                `<p><strong>Rol</strong>: ${item.role_name}</p>`;
            if (battery_level <= 100) popupContent = popupContent + `<p><strong>Pil</strong>: ${voltage.toFixed(2)}V (%${battery_level})</p>`;
            popupContent = popupContent + `<p><strong>QTH</strong>: ${toMaidenhead(lat, lng)}</p>`;
            if (item.altitude != null && !isNaN(item.altitude)) popupContent = popupContent + `<p><strong>Yükseklik</strong>: ${item.altitude}m</p>`;
            if (temperature != null && !isNaN(temperature)) popupContent = popupContent + `<p><strong>Sıcaklık</strong>: ${temperature.toFixed(2)}°C</p>`;
            if (relative_humidity != null && !isNaN(relative_humidity)) popupContent = popupContent + `<p><strong>Nem</strong>: %${relative_humidity.toFixed(2)}</p>`;
            if (barometric_pressure != null && !isNaN(barometric_pressure)) popupContent = popupContent + `<p><strong>Basınç</strong>: ${barometric_pressure.toFixed(2)}hPa</p>`;
            popupContent = popupContent + `<p><strong>Son Güncelleme</strong>: ${formatted}</p><hr>`;

            let marker = L.marker([lat, lng]).bindPopup(popupContent);
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
