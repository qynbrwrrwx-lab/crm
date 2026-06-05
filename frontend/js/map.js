// ================= MAP =================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({

  iconRetinaUrl:
    "https://unpkg.com/leaflet/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet/dist/images/marker-shadow.png"
});

function initMap() {

  if (map) return;

  map = L.map("map")
    .setView([48.8566, 2.3522], 5);

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  ).addTo(map);
}

