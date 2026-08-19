(function () {
      var video = document.getElementById("intro");
      var soundBtn = document.getElementById("sound-btn");
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      video.addEventListener("loadeddata", function () {
        if (video.readyState >= 2) {
          document.querySelector("#intro-wrap .poster").style.display = "none";
          if (!reduce) video.play().catch(function () {});
          soundBtn.hidden = false;
        }
      });
      video.addEventListener("error", function () { soundBtn.hidden = true; });
      soundBtn.addEventListener("click", function () {
        video.muted = !video.muted;
        video.play().catch(function () {});
        soundBtn.textContent = video.muted ? "Tap for sound" : "Sound on";
      });

      var tiles = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
      var attr = "&copy; OpenStreetMap &copy; CARTO";

      var live = L.map("live-map", { scrollWheelZoom: false, zoomControl: true }).setView([32.2226, -110.9747], 11);
      L.tileLayer(tiles, { attribution: attr, maxZoom: 19 }).addTo(live);
      L.circle([32.2226, -110.9747], { radius: 480, color: "#1b6f66", weight: 1, fillColor: "#1b6f66", fillOpacity: 0.14, interactive: false }).addTo(live);
      L.marker([32.2226, -110.9747], {
        icon: L.divIcon({ className: "live-pin", html: '<div class="live-core"></div>', iconSize: [16, 16], iconAnchor: [8, 8] })
      }).addTo(live).bindPopup("Daniel & Julia — preparing to depart").openPopup();

      if (!reduce) {
        var t0 = performance.now(), paused = false;
        live.on("dragstart zoomstart", function () { paused = true; });
        (function orbit(now) {
          if (!paused) {
            var a = ((now - t0) / 52000) * Math.PI * 2;
            live.panTo([32.2226 + Math.sin(a) * 0.045, -110.9747 + Math.cos(a) * 0.06], { animate: false });
          }
          requestAnimationFrame(orbit);
        })(t0);
      }

      var greece = L.map("greece-map", { scrollWheelZoom: false, zoomControl: true, maxBounds: [[34.5, 22.3], [38.85, 26.95]] });
      L.tileLayer(tiles, { attribution: attr, maxZoom: 19 }).addTo(greece);
      greece.fitBounds([[34.82, 22.95], [38.32, 26.25]], { padding: [24, 24], animate: false });

      var land = [[35.5164, 24.0181], [35.231, 23.68], [35.4296, 24.1911], [35.265, 25.723], [35.3387, 25.1442]];
      var ferry = [[35.3387, 25.1442], [36.4165, 25.4324], [37.9838, 23.7275]];
      L.polyline(land, { color: "#1b6f66", weight: 3, opacity: 0.9 }).addTo(greece);
      L.polyline(ferry, { color: "#c4a35a", weight: 3, dashArray: "7 7", opacity: 0.95 }).addTo(greece);

      var stops = [
        [35.5164, 24.0181, "Chania"],
        [35.231, 23.68, "Paleochora"],
        [35.4296, 24.1911, "Douliana"],
        [35.265, 25.723, "Elounda"],
        [35.3387, 25.1442, "Heraklion"],
        [36.4165, 25.4324, "Santorini"],
        [37.9838, 23.7275, "Athens"]
      ];
      stops.forEach(function (s, i) {
        L.marker([s[0], s[1]], {
          icon: L.divIcon({ className: "live-pin", html: '<div class="num-pin">' + (i + 1) + "</div>", iconSize: [22, 22], iconAnchor: [11, 11] })
        }).addTo(greece).bindPopup(s[2]);
      });

      function photoPin(lat, lng, src, label) {
        var html = '<div class="polaroid"><img src="' + src + '" alt="" onerror="this.replaceWith(Object.assign(document.createElement(\'div\'),{className:\'swatch\',style:\'background:#1b6f66\'}))"/></div>';
        L.marker([lat, lng], {
          icon: L.divIcon({ className: "photo-pin", html: html, iconSize: [56, 66], iconAnchor: [28, 66] }),
          zIndexOffset: 900, riseOnHover: true, title: label
        }).addTo(greece).bindPopup(label);
      }
      photoPin(35.3, 24.9, "/photos/crete.jpg", "Crete");
      photoPin(36.4165, 25.4324, "/photos/santorini.jpg", "Santorini");
      photoPin(37.9838, 23.7275, "/photos/athens.jpg", "Athens");

      var lb = document.getElementById("lb");
      var lbImg = document.getElementById("lb-img");
      document.querySelectorAll(".photo").forEach(function (el) {
        el.addEventListener("click", function () {
          var src = el.getAttribute("data-full");
          lbImg.src = src;
          lb.classList.add("open");
        });
      });
      function closeLb() { lb.classList.remove("open"); lbImg.src = ""; }
      document.getElementById("lb-close").addEventListener("click", closeLb);
      lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLb(); });
    })();
