(function () {
  function apply() {
    if (typeof L === "undefined") return;
    var el = document.getElementById("live-map");
    if (!el || !el._leaflet_id) {
      setTimeout(apply, 300);
      return;
    }
    var map;
    try {
      map = el._leaflet_map || null;
    } catch (e) {}
    // Leaflet stores the map instance on the container in some setups; fall back to finding existing map
    if (!map && L.Map && L.Map._instances) {
      // no-op
    }
    fetch("/status.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (st) {
        if (!st || st.lat == null || st.lng == null) return;
        var lat = st.lat, lng = st.lng;
        var label = st.location || "Here";
        // Rebuild the live map cleanly on this container
        if (el._leaflet_id) {
          try {
            var old = el._leaflet_id;
            // Remove existing map if we can reach it via leaflet id map
            for (var k in L.Map.prototype) {}
          } catch (e) {}
        }
        // Safer approach: clear container and create a fresh map
        el.innerHTML = "";
        if (el._leaflet_id) delete el._leaflet_id;
        var tiles = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
        var attr = "&copy; OpenStreetMap &copy; CARTO";
        var live = L.map(el, { scrollWheelZoom: false, zoomControl: true }).setView([lat, lng], 11);
        L.tileLayer(tiles, { attribution: attr, maxZoom: 19 }).addTo(live);
        L.circle([lat, lng], {
          radius: 8000,
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
