(function () {
  var TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  var ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  function apply() {
    if (typeof L === "undefined") return;
    var el = document.getElementById("live-map");
    if (!el) return;
    if (!el._leaflet_id) {
      setTimeout(apply, 300);
      return;
    }

    fetch("/status.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (st) {
        if (!st || st.lat == null || st.lng == null) return;
        var lat = st.lat, lng = st.lng;
        var label = st.location || "Here";

        el.innerHTML = "";
        if (el._leaflet_id) delete el._leaflet_id;

        var live = L.map(el, { scrollWheelZoom: false, zoomControl: true }).setView([lat, lng], 12);
        L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19 }).addTo(live);
        L.circle([lat, lng], {
          radius: 5000,
          color: "#1b6f66",
          weight: 1,
          fillColor: "#1b6f66",
          fillOpacity: 0.12,
          interactive: false
        }).addTo(live);
        L.marker([lat, lng], {
          icon: L.divIcon({
            className: "trip-pin",
            html: '<div class="trip-pin-inner"><span class="live-pin-pulse"></span><div class="trip-pin-head"><span></span></div><div class="trip-pin-tail"></div></div>',
            iconSize: [28, 40],
            iconAnchor: [14, 40]
          })
        }).addTo(live).bindPopup('<p class="map-popup-title">' + label + "</p>");
        setTimeout(function () { live.invalidateSize(); }, 200);
      })
      .catch(function () {});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(apply, 600); });
  } else {
    setTimeout(apply, 600);
  }
})();
