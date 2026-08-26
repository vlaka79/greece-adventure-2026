(function () {
  var OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  var OSM_ATTR = "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>";

  function swapTiles(map) {
    if (!map || !map.eachLayer) return;
    var toRemove = [];
    map.eachLayer(function (layer) {
      if (layer instanceof L.TileLayer) toRemove.push(layer);
    });
    toRemove.forEach(function (layer) { map.removeLayer(layer); });
    L.tileLayer(OSM_URL, { attribution: OSM_ATTR, maxZoom: 19 }).addTo(map);
  }

  function findMap(el) {
    if (!el) return null;
    // Leaflet 1.x stores map id on container
    if (el._leaflet_id != null && L.Util && L.Util.stamp) {
      // Walk leaflet internal map registry if available
    }
    // Prefer leaflet's private map reference when present
    for (var key in el) {
      if (key.indexOf("leaflet") >= 0 && el[key] && el[key].eachLayer) return el[key];
    }
    return null;
  }

  function apply() {
    if (typeof L === "undefined") return;
    var greeceEl = document.getElementById("greece-map");
    var liveEl = document.getElementById("live-map");

    // Greece map: swap tiles on the existing instance
    if (greeceEl && greeceEl._leaflet_id) {
      // Access via Leaflet Map instances stored on the element in some builds
      try {
        var maps = [];
        // Leaflet keeps maps in a global-ish way — iterate all panes
        document.querySelectorAll(".leaflet-container").forEach(function (c) {
          // no reliable public API; force rebuild for greece if needed
        });
      } catch (e) {}
    }

    // Reliable approach: if greece-map already has leaflet, rebuild tiles by
    // reading existing center/zoom and re-adding OSM layer only
    if (greeceEl && greeceEl._leaflet_id) {
      // Use leaflet's internal id map (Leaflet 1.9)
      var id = greeceEl._leaflet_id;
      var map;
      try {
        // L.Map has no public registry; patch via layer removal on first tile layer parent
        greeceEl.querySelectorAll(".leaflet-tile-pane img, .leaflet-layer").forEach(function () {});
      } catch (e) {}

      // Nuclear but reliable: destroy and note that app.js already built routes —
      // instead intercept by replacing tile URL in network... can't do that.
      // Best: get map from leaflet id lookup used by leaflet internally
      if (window.L && L.Map) {
        // Search all objects on the container
        Object.keys(greeceEl).forEach(function (k) {
          var v = greeceEl[k];
          if (v && v.addLayer && v.eachLayer && v.getCenter) map = v;
        });
      }
      if (map) {
        swapTiles(map);
        return;
      }
    }

    // Fallback: wait a bit longer for app.js to finish
    setTimeout(tryAgain, 400);
  }

  var tries = 0;
  function tryAgain() {
    tries += 1;
    var greeceEl = document.getElementById("greece-map");
    if (!greeceEl || typeof L === "undefined") {
      if (tries < 10) setTimeout(tryAgain, 400);
      return;
    }
    var map = null;
    Object.keys(greeceEl).forEach(function (k) {
      var v = greeceEl[k];
      if (v && v.addLayer && v.eachLayer && v.getCenter) map = v;
    });
    if (map) {
      swapTiles(map);
    } else if (tries < 12) {
      setTimeout(tryAgain, 400);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(apply, 800); });
  } else {
    setTimeout(apply, 800);
  }
})();
