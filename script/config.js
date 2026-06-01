// Harita Ayarları
const MapConfig = {
    // Noktaların varsayılan boyutu (Yarıçap)
    markerRadius: 8,
    
    // Roller ve renklere göre eşleşmeleri
    // İstediğiniz rengi HEX veya isim olarak verebilirsiniz.
    roles: {
        "CLIENT": "#3498db",         // Mavi
        "CLIENT_MUTE": "#95a5a6",    // Gri
        "CLIENT_HIDDEN": "#2c3e50",  // Koyu Lacivert
        "CLIENT_BASE": "#2980b9",    // Koyu Mavi
        "TRACKER": "#e67e22",        // Turuncu
        "LOST_AND_FOUND": "#e74c3c", // Kırmızı
        "SENSOR": "#1abc9c",         // Turkuaz
        "TAK": "#9b59b6",            // Mor
        "TAK_TRACKER": "#8e44ad",    // Koyu Mor
        "REPEATER": "#f1c40f",       // Sarı
        "ROUTER": "#2ecc71",         // Yeşil
        "ROUTER_LATE": "#27ae60",    // Koyu Yeşil
        
        // Tanımsız olan veya listeye eklenmemiş roller için varsayılan renk
        "DEFAULT": "#3498db"         
    },

    // Marker nokta stili (çerçeve vs.)
    markerStyle: {
        color: "#000",        // Nokta dış çerçeve rengi
        weight: 1,            // Dış çerçeve kalınlığı
        opacity: 1,           // Dış çerçeve görünürlüğü (0 - 1)
        fillOpacity: 0.9      // İç dolgu görünürlüğü (0 - 1)
    }
};
