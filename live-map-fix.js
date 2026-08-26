(function () {
  function tileConfig() {
    var key = (window.MAPTILER_KEY || "").trim();
    if (key) {
      return {
        url: "https://api.maptiler.com/maps/outdoor-v2/{z}/{x}/{y}.png?key=" + encodeURIComponent(key),
        attr: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 20
      };
    }
    return {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attr: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
      maxZoom: 17
    };
  }

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

        var cfg = tileConfig();
        var live = L.map(el, { scrollWheelZoom: false, zoomControl: true }).setView([lat, lng], 12);
        L.tileLayer(cfg.url, { attribution: cfg.attr, maxZoom: cfg.maxZoom }).addTo(live);
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
