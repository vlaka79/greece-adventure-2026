(function () {
  if (typeof L === "undefined") return;
  var TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  var ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  function clearMap(el) {
    if (!el) return;
    el.innerHTML = "";
    if (el._leaflet_id) delete el._leaflet_id;
  }

  function rebuildLive() {
    var el = document.getElementById("live-map");
    if (!el) return;
    fetch("/status.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (st) {
        st = st || {};
        var lat = st.lat != null ? st.lat : 35.5162;
        var lng = st.lng != null ? st.lng : 24.0178;
        clearMap(el);
        var map = L.map(el, { scrollWheelZoom: false, zoomControl: true }).setView([lat, lng], 12);
        L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19 }).addTo(map);
        L.circle([lat, lng], { radius: 5000, color: "#1b6f66", weight: 1, fillColor: "#1b6f66", fillOpacity: 0.12, interactive: false }).addTo(map);
        L.marker([lat, lng], {
          icon: L.divIcon({
            className: "trip-pin",
            html: '<div class="trip-pin-inner"><span class="live-pin-pulse"></span><div class="trip-pin-head"><span></span></div><div class="trip-pin-tail"></div></div>',
            iconSize: [28, 40], iconAnchor: [14, 40]
          })
        }).addTo(map).bindPopup('<p class="map-popup-title">' + (st.location || "Western Crete") + "</p>");
        setTimeout(function () { map.invalidateSize(); }, 200);
      })
      .catch(function () {});
  }

  function rebuildGreece() {
    var el = document.getElementById("greece-map");
    if (!el) return;
    clearMap(el);
    var map = L.map(el, { scrollWheelZoom: false, zoomControl: true, maxBounds: [[34.5, 22.3], [38.85, 26.95]] });
    L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19 }).addTo(map);
    map.fitBounds([[35.45, 23.90], [35.58, 24.15]], { padding: [20, 20], animate: false });

    Promise.all([
      fetch("/route.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }),
      fetch("/photos/album.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; })
    ]).then(function (pair) {
      var route = pair[0] || {};
      var items = pair[1] || [];
      var planned = route.plannedCrete || [];
      var ferry = route.ferry || [[35.3387, 25.1442], [36.4165, 25.4324], [37.9838, 23.7275]];
      var stops = route.stops || [];
      var visited = route.visited || [];
      var actual = route.actual || [];

      if (planned.length) {
        L.polyline(planned, { color: "#1b6f66", weight: 3, opacity: 0.45, dashArray: "8 8" }).addTo(map).bindPopup("Planned \u2014 roads on Crete");
      }
      if (actual.length > 1) {
        L.polyline(actual, { color: "#1b6f66", weight: 4, opacity: 0.95 }).addTo(map).bindPopup("Actual path so far");
      }
      L.polyline(ferry, { color: "#c4a35a", weight: 3, dashArray: "7 7", opacity: 0.95 }).addTo(map).bindPopup("Ferry");

      stops.forEach(function (s, i) {
        var done = visited.indexOf(s.id) >= 0;
        L.marker([s.lat, s.lng], {
          icon: L.divIcon({
            className: "route-pin-icon",
            html: '<div class="route-pin' + (done ? " route-pin-done" : "") + '">' + (i + 1) + "</div>",
            iconSize: [26, 26], iconAnchor: [13, 13]
          })
        }).addTo(map).bindPopup(s.name + (done ? " \u00b7 visited" : ""));
      });

      var groups = {};
      items.forEach(function (item) {
        if (!item.lat || !item.lng || !item.src) return;
        if (item.lat < 34.5 || item.lat > 38.9 || item.lng < 22 || item.lng > 27) return;
        var key = Number(item.lat).toFixed(3) + "," + Number(item.lng).toFixed(3);
        if (!groups[key]) groups[key] = { lat: item.lat, lng: item.lng, items: [] };
        groups[key].items.push(item);
      });
      Object.keys(groups).forEach(function (key) {
        var g = groups[key];
        var first = g.items[0];
        var extra = g.items.length > 1 ? '<span class="photo-pin-count">' + g.items.length + "</span>" : "";
        var html = '<div class="photo-pin"><div class="photo-pin-card"><img src="' + first.src + '" alt="" onerror="this.parentNode.parentNode.style.display=\'none\'" />' + extra + '</div><div class="photo-pin-tail"></div></div>';
        L.marker([g.lat, g.lng], {
          icon: L.divIcon({ className: "photo-pin-icon", html: html, iconSize: [56, 66], iconAnchor: [28, 66] }),
          zIndexOffset: 900
        }).addTo(map);
      });
      setTimeout(function () { map.invalidateSize(); }, 200);
    });
  }

  function run() {
    rebuildLive();
    rebuildGreece();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(run, 900); });
  } else {
    setTimeout(run, 900);
  }
})();
