(function () {
  if (typeof L === "undefined") return;
  var TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  var ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  var photoItems = [];
  var photoLayer = null;
  var tripMap = null;
  var PATH_URL = "/trips/caribbean-2026/path.json";
  var AIS_URL = "/trips/caribbean-2026/ais.json";
  var ALBUM_URL = "/trips/caribbean-2026/album.json";

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
      ".photo-pin-count{position:absolute;right:3px;bottom:3px;z-index:4;min-width:1.1rem;border-radius:999px;background:#1b6f66;color:#f4eee4;font-size:10px;font-weight:700;line-height:1.2rem;text-align:center;padding:0 4px;}" +
      ".trip-path-pin{width:22px;height:22px;border-radius:50%;background:#1b6f66;color:#f4eee4;font:700 11px/22px 'Source Sans 3',sans-serif;text-align:center;box-shadow:0 0 0 2px #fffcf6,0 2px 6px rgba(42,36,28,.3);}";
    document.head.appendChild(st);
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

  function inPhotoBounds(lat, lng) {
    return lat >= 9 && lat <= 28.5 && lng >= -85 && lng <= -68;
  }

  function distM(a, b) {
    var dLat = (a.lat - b.lat) * 111320;
    var dLng = (a.lng - b.lng) * 111320 * Math.cos((a.lat * Math.PI) / 180);
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }

  function clusterSpan(g) {
    var items = g.items || [];
    if (items.length < 2) return 0;
    var minLat = items[0].lat, maxLat = items[0].lat, minLng = items[0].lng, maxLng = items[0].lng;
    items.forEach(function (p) {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    });
    g._bounds = [[minLat, minLng], [maxLat, maxLng]];
    return distM({ lat: minLat, lng: minLng }, { lat: maxLat, lng: maxLng });
  }

  function groupPhotos(items, map) {
    var pts = [];
    (items || []).forEach(function (item) {
      if (item.lat == null || item.lng == null || !item.src) return;
      var lat = Number(item.lat);
      var lng = Number(item.lng);
      if (!inPhotoBounds(lat, lng)) return;
      var ll = L.latLng(lat, lng);
      var pt = map.latLngToLayerPoint(ll);
      pts.push({
        src: pinSrc(item.src),
        caption: item.caption || "",
        lat: lat,
        lng: lng,
        added: addedTime(item),
        _x: pt.x,
        _y: pt.y
      });
    });
    pts.sort(function (a, b) { return b.added - a.added; });

    var radius = 58;
    var clusters = [];
    pts.forEach(function (p) {
      var best = null;
      var bestD = radius;
      clusters.forEach(function (c) {
        var dx = p._x - c._x;
        var dy = p._y - c._y;
        var d = Math.sqrt(dx * dx + dy * dy);
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
        var cpt = map.latLngToLayerPoint([best.lat, best.lng]);
        best._x = cpt.x;
        best._y = cpt.y;
      } else {
        clusters.push({ lat: p.lat, lng: p.lng, _x: p._x, _y: p._y, items: [p] });
      }
    });
    clusters.forEach(function (c) {
      c.items.sort(function (a, b) { return b.added - a.added; });
      c.span = clusterSpan(c);
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

  function onPhotoClusterClick(map, g) {
    if (!g || !g.items || !g.items.length) return;
    if (g.items.length === 1) {
      openGroup(g);
      return;
    }
    if (g.span > 35 && map.getZoom() < 18 && g._bounds) {
      map.fitBounds(g._bounds, { padding: [48, 48], maxZoom: 18, animate: true });
      return;
    }
    openGroup(g);
  }

  function renderPhotoPins() {
    if (!tripMap || !photoLayer) return;
    photoLayer.clearLayers();
    var groups = groupPhotos(photoItems, tripMap);
    groups.forEach(function (g, i) {
      var first = g.items[0];
      var n = g.items.length;
      var extra = n > 1 ? '<span class="photo-pin-count">' + n + "</span>" : "";
      var stack = "";
      if (n > 2) stack += '<span class="photo-pin-stack s1"></span>';
      if (n > 1) stack += '<span class="photo-pin-stack s2"></span>';
      var html =
        '<div class="photo-pin">' + stack +
        '<div class="photo-pin-card">' +
        '<img src="' + first.src + '" alt="" />' + extra +
        '</div></div>';
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
        onPhotoClusterClick(tripMap, g);
      });
      photoLayer.addLayer(marker);
    });
  }

  function rebuild() {
    var el = document.getElementById("trip-map");
    if (!el) return;
    el.innerHTML = "";
    if (el._leaflet_id) delete el._leaflet_id;
    tripMap = L.map(el, { scrollWheelZoom: true, zoomControl: true });
    L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19 }).addTo(tripMap);
    photoLayer = L.layerGroup().addTo(tripMap);

    Promise.all([
      fetch(PATH_URL, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }),
      fetch(ALBUM_URL, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
      fetch(AIS_URL, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
    ]).then(function (triple) {
      var path = triple[0] || {};
      photoItems = triple[1] || [];
      var ais = triple[2] || {};
      var bounds = [];
      var GAP_MS = 4 * 60 * 60 * 1000;
      (ais.tracks || []).forEach(function (tr) {
        var pts = tr.points || [];
        var segs = [];
        var cur = [];
        var prevT = null;
        pts.forEach(function (p) {
          if (p.lat == null || p.lng == null) return;
          var t = Date.parse(p.t || "") || 0;
          if (cur.length && prevT && t - prevT > GAP_MS) {
            segs.push(cur);
            cur = [];
          }
          cur.push([p.lat, p.lng]);
          bounds.push([p.lat, p.lng]);
          prevT = t;
        });
        if (cur.length) segs.push(cur);
        segs.forEach(function (coords) {
          if (coords.length < 2) {
            if (coords.length === 1) {
              L.circleMarker(coords[0], {
                radius: 4,
                color: tr.color || "#1b6f66",
                weight: 2,
                fillOpacity: 0.85
              }).addTo(tripMap).bindPopup(tr.label || "AIS");
            }
            return;
          }
          L.polyline(coords, {
            color: tr.color || "#1b6f66",
            weight: 4,
            opacity: 0.9
          }).addTo(tripMap).bindPopup(tr.label || "AIS");
        });
      });
      (ais.likely || []).forEach(function (tr) {
        var coords = (tr.points || []).map(function (p) { return [p.lat, p.lng]; }).filter(function (c) { return c[0] != null && c[1] != null; });
        coords.forEach(function (c) { bounds.push(c); });
        if (coords.length < 2) return;
        L.polyline(coords, {
          color: tr.color || "#1b6f66",
          weight: 3,
          opacity: 0.7,
          dashArray: "10,8"
        }).addTo(tripMap).bindPopup(tr.label || "Likely route");
      });
      var line = path.line || [];
      var seen = {};
      var n = 0;
      line.forEach(function (p) {
        if (p.lat == null || p.lng == null) return;
        bounds.push([p.lat, p.lng]);
        var key = p.name + "|" + p.lat + "|" + p.lng;
        if (seen[key]) return;
        seen[key] = true;
        n += 1;
        L.marker([p.lat, p.lng], {
          icon: L.divIcon({
            className: "route-pin-icon",
            html: '<div class="trip-path-pin">' + n + "</div>",
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          })
        }).addTo(tripMap).bindPopup(p.name || "");
      });
      renderPhotoPins();
      tripMap.on("zoomend", renderPhotoPins);
      if (bounds.length) {
        tripMap.fitBounds(bounds, { padding: [28, 28], animate: false, maxZoom: 7 });
      } else {
        tripMap.setView([23.5, -78.5], 5);
      }
      setTimeout(function () { tripMap.invalidateSize(); }, 200);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(rebuild, 200); });
  } else {
    setTimeout(rebuild, 200);
  }
})();
