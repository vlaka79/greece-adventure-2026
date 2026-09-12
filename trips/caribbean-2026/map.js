(function () {
  if (typeof L === "undefined") return;
  var TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  var ATTR = 'Tiles &copy; <a href="https://www.esri.com/">Esri</a> — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community';
  var photoItems = [];
  var photoLayer = null;
  var tripMap = null;
  var PATH_URL = "/trips/caribbean-2026/path.json";
  var AIS_URL = "/trips/caribbean-2026/ais.json";
  var ALBUM_URL = "/trips/caribbean-2026/album.json";
  var DRIVES_URL = "/trips/caribbean-2026/drives.json";
  var MILES_URL = "/trips/caribbean-2026/miles.json";

  if (!document.getElementById("photo-pin-click-style")) {
    var st = document.createElement("style");
    st.id = "photo-pin-click-style";
    st.textContent =
      ".photo-pin-icon{cursor:pointer;background:transparent;border:0;}" +
      ".photo-pin-icon .photo-pin{pointer-events:auto;position:relative;width:48px;height:56px;}" +
      ".photo-pin-stack{position:absolute;left:0;top:0;width:48px;height:48px;border-radius:8px;background:#fff8ee;box-shadow:0 2px 6px rgba(42,28,12,.18);}" +
      ".photo-pin-stack.s1{transform:translate(4px,-4px) rotate(6deg);z-index:1;}" +
      ".photo-pin-stack.s2{transform:translate(-3px,-3px) rotate(-5deg);z-index:2;}" +
      ".photo-pin-card{position:relative;z-index:3;width:48px;height:48px;border-radius:8px;overflow:hidden;box-shadow:0 3px 10px rgba(42,28,12,.32),0 0 0 1.5px rgba(255,248,238,.9);background:#f4eee4;}" +
      ".photo-pin-card img{width:100%;height:100%;object-fit:cover;display:block;}" +
      ".photo-pin-count{position:absolute;right:3px;bottom:3px;z-index:4;min-width:1.1rem;border-radius:999px;background:linear-gradient(135deg,#ff6a3d,#f0a020);color:#fffaf3;font-size:10px;font-weight:700;line-height:1.2rem;text-align:center;padding:0 4px;box-shadow:0 1px 3px rgba(0,0,0,.25);}" +
      ".photo-pin-tail{width:0;height:0;margin:-1px auto 0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:8px solid #fffcf6;filter:drop-shadow(0 1px 1px rgba(0,0,0,.2));}" +
      ".trip-path-chip{display:inline-flex;align-items:center;gap:3px;max-width:110px;padding:3px 8px 3px 6px;border-radius:999px;background:rgba(255,252,246,.94);color:#2a241c;font:700 11px/1.2 'Source Sans 3',system-ui,sans-serif;white-space:nowrap;box-shadow:0 2px 8px rgba(20,16,12,.35),0 0 0 1px rgba(255,255,255,.55);backdrop-filter:blur(2px);}" +
      ".trip-path-chip .chip-emoji{font-size:12px;line-height:1;}" +
      ".trip-path-chip .chip-name{overflow:hidden;text-overflow:ellipsis;}" +
      ".drive-car-icon{background:transparent;border:0;}" +
      ".drive-car{width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;}" +
      ".drive-car svg{width:11px;height:11px;display:block;}";
    document.head.appendChild(st);
  }

  var CAR_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#111" d="M5.2 13.1 6.6 8.8A1.8 1.8 0 0 1 8.3 7.5h7.4a1.8 1.8 0 0 1 1.7 1.3l1.4 4.3H5.2z"/><path fill="#111" d="M4.5 13.2h15v3.1h-15z"/><circle cx="7.4" cy="16.6" r="1.45" fill="#111"/><circle cx="16.6" cy="16.6" r="1.45" fill="#111"/></svg>';

  function pinSrc(src) {
    if (!src) return src;
    var s = String(src);
    if (s.indexOf("/photos/") === 0) return s;
    var m = s.match(/\/photos\/album\/[^/?#]+/);
    return m ? m[0] : s;
  }

  function addedTime(item) {
    if (!item || !item.added) return 0;
    var a = String(item.added);
    var t = Date.parse(a.length <= 10 ? a + "T12:00:00" : a);
    return isNaN(t) ? 0 : t;
  }

  function inPhotoBounds(lat, lng) {
    return lat >= 9 && lat <= 42 && lng >= -125 && lng <= -68;
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
        onPhotoClusterClick(tripMap, g);
      });
      photoLayer.addLayer(marker);
    });
  }

  function driveCoords(tr) {
    return (tr.points || []).map(function (p) {
      return [p.lat, p.lng];
    }).filter(function (c) {
      return c[0] != null && c[1] != null;
    });
  }

  function carStopsAlong(coords, everyKm) {
    var out = [];
    if (coords.length < 2) return out;
    var acc = 0;
    var next = everyKm;
    for (var i = 1; i < coords.length; i++) {
      acc += distM(
        { lat: coords[i - 1][0], lng: coords[i - 1][1] },
        { lat: coords[i][0], lng: coords[i][1] }
      ) / 1000;
      if (acc >= next) {
        out.push(coords[i]);
        next += everyKm;
      }
    }
    return out;
  }

  var SHORE_KEEP = {
    keys: 1,
    "miami-to-riviera": 1,
    aruba: 1,
    "palm-beach-to-pbi": 1,
    cartagena: 1,
    nassau: 1,
    "cayman-snorkel": 1,
    "ocho-rios": 1,
    "miami-big-bus": 1
  };

  function drawDrives(drives) {
    (drives.tracks || []).forEach(function (tr) {
      if (!tr || !SHORE_KEEP[tr.id]) return;
      var coords = driveCoords(tr);
      if (coords.length < 2) return;
      var walk = tr.mode === "walk";
      var dashed = tr.style === "dashed" || tr.mode === "bus" || tr.mode === "train" || walk;
      var boat = tr.mode === "boat" || tr.style === "thin";
      var car = tr.mode === "car";
      var weight = walk ? 1.5 : boat ? 2 : dashed ? 2 : (car ? 2.6 : 2);
      var color = walk ? "#9ec9b8" : boat ? "#7ec8ff" : car ? "#e6b84d" : "#c9a227";
      var opacity = walk ? 0.65 : dashed ? 0.8 : 0.92;
      var dashArray = walk ? "3,7" : dashed ? "7,9" : null;
      if (car && !dashed) {
        L.polyline(coords, {
          color: "#3a2a10",
          weight: weight + 2.5,
          opacity: 0.35,
          lineJoin: "round",
          lineCap: "round",
          interactive: false
        }).addTo(tripMap);
      }
      var line = L.polyline(coords, {
        color: color,
        weight: weight,
        opacity: opacity,
        dashArray: dashArray,
        lineJoin: "round",
        lineCap: "round"
      }).addTo(tripMap);
      if (tr.label) line.bindPopup(tr.label);
      if (tr.id === "aruba") {
        carStopsAlong(coords, 10).forEach(function (ll) {
          L.marker(ll, {
            icon: L.divIcon({
              className: "drive-car-icon",
              html: '<div class="drive-car">' + CAR_SVG + "</div>",
              iconSize: [18, 18],
              iconAnchor: [9, 9]
            }),
            interactive: false,
            keyboard: false,
            zIndexOffset: 250
          }).addTo(tripMap);
        });
      }
    });
  }

  function addBaseTiles(map) {
    var osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    });
    var esri = L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19 });
    var failed = 0;
    esri.on("tileerror", function () {
      failed += 1;
      if (failed === 3 && map.hasLayer(esri)) {
        map.removeLayer(esri);
        osm.addTo(map);
      }
    });
    esri.addTo(map);
  }

  function placeChip(name) {
    var n = String(name || "");
    var lower = n.toLowerCase();
    if (lower.indexOf("brickell") >= 0) return { emoji: "🌴", short: "Brickell" };
    if (lower.indexOf("portmiami") >= 0 || lower === "port miami") return { emoji: "🚢", short: "PortMiami" };
    if (lower.indexOf("aruba") >= 0 || lower.indexOf("oranjestad") >= 0) return { emoji: "🇦🇼", short: "Aruba" };
    if (lower.indexOf("cartagena") >= 0) return { emoji: "🏛️", short: "Cartagena" };
    if (lower.indexOf("ocho") >= 0) return { emoji: "🇯🇲", short: "Ocho Rios" };
    if (lower.indexOf("cayman") >= 0 || lower.indexOf("george town") >= 0) return { emoji: "🤿", short: "Cayman" };
    if (lower.indexOf("riviera") >= 0) return { emoji: "🏖️", short: "Riviera" };
    if (lower.indexOf("palm beach") >= 0) return { emoji: "🚢", short: "Palm Beach" };
    if (lower.indexOf("nassau") >= 0) return { emoji: "🇧🇸", short: "Nassau" };
    var short = n.split(",")[0].trim() || n;
    if (short.length > 12) short = short.slice(0, 11) + "…";
    return { emoji: "📍", short: short };
  }

  var FRAME = [[9.5, -82.5], [27.5, -69.5]];
  var TEAL = "#1b6f66";
  var OCEAN_GAP_MS = 12 * 60 * 60 * 1000;

  function frameCaribbean() {
    if (!tripMap) return;
    tripMap.fitBounds(FRAME, { padding: [24, 24], animate: false });
  }

  function llOf(p) {
    if (!p || p.lat == null || p.lng == null) return null;
    var lat = Number(p.lat);
    var lng = Number(p.lng);
    if (isNaN(lat) || isNaN(lng)) return null;
    return [lat, lng];
  }

  function splitAisRuns(pts, gapMs) {
    var runs = [];
    var cur = [];
    var prevT = null;
    (pts || []).forEach(function (p) {
      var ll = llOf(p);
      if (!ll) return;
      var t = Date.parse(p.t || "") || 0;
      if (cur.length && prevT && t - prevT > gapMs) {
        runs.push(cur);
        cur = [];
      }
      cur.push(ll);
      prevT = t;
    });
    if (cur.length) runs.push(cur);
    return runs;
  }

  function drawStyledLine(coords, style, popup) {
    if (!coords || coords.length < 2) return;
    var line = L.polyline(coords, style).addTo(tripMap);
    if (popup) line.bindPopup(popup);
  }

  function likelyForShip(track, likelyList) {
    var id = track && track.id ? String(track.id) : "";
    return (likelyList || []).filter(function (tr) {
      if (!tr) return false;
      if (tr.id && id && String(tr.id).indexOf(id) === 0) return true;
      return false;
    });
  }

  function funShipPopup(tr, gap) {
    var id = tr && tr.id ? String(tr.id) : "";
    if (id.indexOf("brilliant") === 0) {
      return gap ? "Brilliant Lady · likely ocean gap" : "Brilliant Lady · Caribbean loop";
    }
    if (id.indexOf("paradise") === 0) {
      return gap ? "Paradise · likely hop" : "Paradise · Nassau hop";
    }
    if (gap) return (tr.label || "Voyage") + " · likely";
    return tr.label || "Voyage";
  }

  function drawShipVoyages(ais) {
    (ais.tracks || []).forEach(function (tr) {
      var color = tr.color || TEAL;
      var popup = funShipPopup(tr, false);
      var casing = {
        color: "#0a1628",
        weight: 7.5,
        opacity: 0.5,
        lineJoin: "round",
        lineCap: "round",
        interactive: false
      };
      var solid = {
        color: color,
        weight: 5,
        opacity: 0.98,
        lineJoin: "round",
        lineCap: "round"
      };
      var dashCasing = {
        color: "#0a1628",
        weight: 7,
        opacity: 0.42,
        dashArray: "10,8",
        lineJoin: "round",
        lineCap: "round",
        interactive: false
      };
      var dashed = {
        color: color,
        weight: 5,
        opacity: 0.82,
        dashArray: "10,8",
        lineJoin: "round",
        lineCap: "round"
      };
      var runs = splitAisRuns(tr.points || [], OCEAN_GAP_MS);
      runs.forEach(function (coords) {
        drawStyledLine(coords, casing, null);
        drawStyledLine(coords, solid, popup);
      });
      likelyForShip(tr, ais.likely || []).forEach(function (gap) {
        var coords = (gap.points || []).map(llOf).filter(Boolean);
        if (coords.length < 2) return;
        drawStyledLine(coords, dashCasing, null);
        drawStyledLine(coords, dashed, funShipPopup(tr, true));
      });
    });
  }

  function fillTravelMiles(miles) {
    var el = document.getElementById("travel-miles");
    if (!el || !miles) return;
    function n(v) { return (v == null || v === "") ? "—" : String(v); }
    var parts = [];
    parts.push("Flown " + n(miles.flown) + " mi");
    parts.push("Driven " + n(miles.driven) + " mi");
    if (miles.walked != null && miles.walked !== "") {
      parts.push("Walked " + n(miles.walked) + " mi");
    }
    if (miles.sailed != null && miles.sailed !== "") {
      parts.push("Sailed " + n(miles.sailed) + " mi");
    }
    el.textContent = parts.join(" · ");
  }

  function rebuild() {
    var el = document.getElementById("trip-map");
    if (!el) return;
    if (typeof L === "undefined") return;
    el.innerHTML = "";
    if (el._leaflet_id) delete el._leaflet_id;
    tripMap = L.map(el, { scrollWheelZoom: true, zoomControl: true, preferCanvas: true });
    addBaseTiles(tripMap);
    photoLayer = L.layerGroup().addTo(tripMap);
    frameCaribbean();

    Promise.all([
      fetch(PATH_URL, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }),
      fetch(ALBUM_URL, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
      fetch(AIS_URL, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }),
      fetch(DRIVES_URL, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }),
      fetch(MILES_URL, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
    ]).then(function (quad) {
      var path = quad[0] || {};
      photoItems = quad[1] || [];
      var ais = quad[2] || {};
      var drives = quad[3] || {};
      var miles = quad[4] || {};
      try { fillTravelMiles(miles); } catch (err) { console.warn(err); }
      try { drawShipVoyages(ais); } catch (err) { console.warn(err); }
      try { drawDrives(drives); } catch (err) { console.warn(err); }
      var line = path.line || [];
      var seen = {};
      line.forEach(function (p) {
        if (p.lat == null || p.lng == null) return;
        var key = p.name + "|" + p.lat + "|" + p.lng;
        if (seen[key]) return;
        seen[key] = true;
        var chip = placeChip(p.name || "");
        L.marker([p.lat, p.lng], {
          icon: L.divIcon({
            className: "route-pin-icon",
            html: '<div class="trip-path-chip"><span class="chip-emoji">' + chip.emoji + '</span><span class="chip-name">' + chip.short + "</span></div>",
            iconSize: [100, 24],
            iconAnchor: [50, 12]
          }),
          zIndexOffset: 120
        }).addTo(tripMap).bindPopup(p.name || "");
      });
      renderPhotoPins();
      tripMap.on("zoomend", renderPhotoPins);
      frameCaribbean();
      setTimeout(function () { if (tripMap) { tripMap.invalidateSize(); frameCaribbean(); } }, 200);
      setTimeout(function () { if (tripMap) { tripMap.invalidateSize(); frameCaribbean(); } }, 800);
    }).catch(function (err) {
      console.warn(err);
      if (tripMap) frameCaribbean();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(rebuild, 200); });
  } else {
    setTimeout(rebuild, 200);
  }
})();
