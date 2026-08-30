(function () {
  if (typeof L === "undefined") return;
  var TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  var ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  var photoItems = [];
  var photoLayer = null;
  var greeceMap = null;

  if (!document.getElementById("photo-pin-click-style")) {
    var st = document.createElement("style");
    st.id = "photo-pin-click-style";
    st.textContent =
      ".photo-pin-icon{cursor:pointer;background:transparent;border:0;}" +
      ".photo-pin-icon .photo-pin{pointer-events:auto;position:relative;width:48px;height:56px;}" +
      ".photo-pin-stack{position:absolute;left:0;top:0;width:48px;height:48px;border-radius:8px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.22);}" +
      ".photo-pin-stack.s1{transform:translate(4px,-4px) rotate(6deg);z-index:1;}" +
      ".photo-pin-stack.s2{transform:translate(-3px,-3px) rotate(-5deg);z-index:2;}" +
      ".photo-pin-card{position:relative;z-index:3;width:48px;height:48px;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.28);background:#f4eee4;}" +
      ".photo-pin-card img{width:100%;height:100%;object-fit:cover;display:block;}" +
      ".photo-pin-count{position:absolute;right:3px;bottom:3px;z-index:4;min-width:1.1rem;border-radius:999px;background:#1b6f66;color:#f4eee4;font-size:10px;font-weight:700;line-height:1.2rem;text-align:center;padding:0 4px;}";
    document.head.appendChild(st);
  }

  function clearMap(el) {
    if (!el) return;
    el.innerHTML = "";
    if (el._leaflet_id) delete el._leaflet_id;
  }

  function pinSrc(src) {
    if (!src) return src;
    var m = String(src).match(/\/photos\/album\/[^/?#]+/);
    return m ? m[0] : src;
  }

  function addedTime(item) {
    if (!item || !item.added) return 0;
    var a = String(item.added);
    var t = Date.parse(a.length <= 10 ? a + "T12:00:00" : a);
    return isNaN(t) ? 0 : t;
  }

  function distM(a, b) {
    var dLat = (a.lat - b.lat) * 111320;
    var dLng = (a.lng - b.lng) * 111320 * Math.cos((a.lat * Math.PI) / 180);
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }

  function clusterRadiusM(zoom) {
    if (zoom >= 16) return 45;
    if (zoom >= 15) return 90;
    if (zoom >= 14) return 160;
    if (zoom >= 13) return 280;
    if (zoom >= 12) return 550;
    if (zoom >= 11) return 1200;
    return 2500;
  }

  function groupPhotos(items, zoom) {
    var radius = clusterRadiusM(zoom);
    var pts = [];
    (items || []).forEach(function (item) {
      if (item.lat == null || item.lng == null || !item.src) return;
      var lat = Number(item.lat);
      var lng = Number(item.lng);
      if (lat < 34.5 || lat > 38.9 || lng < 22 || lng > 27) return;
      pts.push({
        src: pinSrc(item.src),
        caption: item.caption || "",
        lat: lat,
        lng: lng,
        added: addedTime(item)
      });
    });
    pts.sort(function (a, b) { return b.added - a.added; });

    var clusters = [];
    pts.forEach(function (p) {
      var best = null;
      var bestD = radius;
      clusters.forEach(function (c) {
        var d = distM(p, c);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      });
      if (best) {
        best.items.push(p);
        var n = best.items.length;
        best.lat = (best.lat * (n - 1) + p.lat) / n;
        best.lng = (best.lng * (n - 1) + p.lng) / n;
      } else {
        clusters.push({ lat: p.lat, lng: p.lng, items: [p] });
      }
    });
    clusters.forEach(function (c) {
      c.items.sort(function (a, b) { return b.added - a.added; });
    });
    return clusters;
  }

  function openGroup(g) {
    var shots = (g.items || []).map(function (it) {
      return { src: it.src, caption: it.caption || "" };
    });
    if (!shots.length) return;
    if (typeof window.__openLb === "function") {
      window.__openLb(shots, 0);
      return;
    }
    var lb = document.getElementById("lb");
    var lbImg = document.getElementById("lb-img");
    if (!lb || !lbImg) return;
    lbImg.src = shots[0].src;
    lbImg.alt = shots[0].caption || "";
    lb.classList.remove("hidden");
    lb.classList.add("flex");
  }

  function renderPhotoPins() {
    if (!greeceMap || !photoLayer) return;
    photoLayer.clearLayers();
    var groups = groupPhotos(photoItems, greeceMap.getZoom());
    groups.forEach(function (g, i) {
      var first = g.items[0];
      var n = g.items.length;
      var extra = n > 1
        ? '<span class="photo-pin-count">' + n + "</span>"
        : "";
      var stack = "";
      if (n > 2) stack += '<span class="photo-pin-stack s1"></span>';
      if (n > 1) stack += '<span class="photo-pin-stack s2"></span>';
      var html =
        '<div class="photo-pin">' + stack +
        '<div class="photo-pin-card">' +
        '<img src="' + first.src + '" alt="" />' + extra +
        '</div><div class="photo-pin-tail"></div></div>';
      var marker = L.marker([g.lat, g.lng], {
        icon: L.divIcon({
          className: "photo-pin-icon",
          html: html,
          iconSize: [56, 66],
          iconAnchor: [28, 66]
        }),
        zIndexOffset: 900 + i,
        riseOnHover: true,
        keyboard: true,
        title: n > 1 ? n + " photos" : (first.caption || "Photo")
      });
      marker.on("click", function (ev) {
        if (ev && ev.originalEvent) L.DomEvent.stopPropagation(ev.originalEvent);
        openGroup(g);
      });
      photoLayer.addLayer(marker);
    });
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
        L.circle([lat, lng], {
          radius: 5000,
          color: "#1b6f66",
          weight: 1,
          fillColor: "#1b6f66",
          fillOpacity: 0.12,
          interactive: false
        }).addTo(map);
        L.marker([lat, lng], {
          icon: L.divIcon({
            className: "trip-pin",
            html: '<div class="trip-pin-inner"><span class="live-pin-pulse"></span><div class="trip-pin-head"><span></span></div><div class="trip-pin-tail"></div></div>',
            iconSize: [28, 40],
            iconAnchor: [14, 40]
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
    greeceMap = L.map(el, {
      scrollWheelZoom: true,
      zoomControl: true,
      maxBounds: [[34.5, 22.3], [38.85, 26.95]]
    });
    L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19 }).addTo(greeceMap);
    greeceMap.fitBounds([[35.18, 23.55], [35.58, 24.12]], { padding: [24, 24], animate: false });
    photoLayer = L.layerGroup().addTo(greeceMap);

    Promise.all([
      fetch("/route.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }),
      fetch("/photos/album.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; })
    ]).then(function (pair) {
      var route = pair[0] || {};
      photoItems = pair[1] || [];
      var planned = route.plannedCrete || [];
      var ferry = route.ferry || [[35.3387, 25.1442], [36.4165, 25.4324], [37.9838, 23.7275]];
      var stops = route.stops || [];
      var visited = route.visited || [];
      var actual = route.actual || [];

      if (planned.length) {
        L.polyline(planned, { color: "#1b6f66", weight: 3, opacity: 0.45, dashArray: "8 8" })
          .addTo(greeceMap).bindPopup("Planned \u2014 roads on Crete");
      }
      if (actual.length > 1) {
        L.polyline(actual, { color: "#1b6f66", weight: 4, opacity: 0.95 })
          .addTo(greeceMap).bindPopup("Actual path so far");
      }
      L.polyline(ferry, { color: "#c4a35a", weight: 3, dashArray: "7 7", opacity: 0.95 })
        .addTo(greeceMap).bindPopup("Ferry");

      stops.forEach(function (s, i) {
        var done = visited.indexOf(s.id) >= 0;
        L.marker([s.lat, s.lng], {
          icon: L.divIcon({
            className: "route-pin-icon",
            html: '<div class="route-pin' + (done ? " route-pin-done" : "") + '">' + (i + 1) + "</div>",
            iconSize: [26, 26],
            iconAnchor: [13, 13]
          })
        }).addTo(greeceMap).bindPopup(s.name + (done ? " \u00b7 visited" : ""));
      });

      renderPhotoPins();
      greeceMap.on("zoomend", renderPhotoPins);
      setTimeout(function () { greeceMap.invalidateSize(); }, 200);
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
