(function () {
  function clockTime(tz) {
    try {
      return new Date().toLocaleTimeString("en-US", {
        timeZone: tz, hour: "numeric", minute: "2-digit"
      });
    } catch (e) { return ""; }
  }
  function tickClocks() {
    var la = document.getElementById("clock-la");
    var gr = document.getElementById("clock-gr");
    if (la) la.textContent = clockTime("America/Los_Angeles");
    if (gr) gr.textContent = clockTime("Europe/Athens");
  }
  tickClocks();
  setInterval(tickClocks, 15000);

  var pulse = document.querySelector(".pulse-dot");
  if (pulse && pulse.nextElementSibling) pulse.nextElementSibling.textContent = "In Simi Valley";
  var pills = document.querySelectorAll("#where .rounded-full");
  if (pills && pills[0]) pills[0].textContent = "Simi Valley, California";

  fetch("/status.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (status) {
      status = status || {};
      var word = status.word || {};
      var wordCard = document.getElementById("word-card");
      if (wordCard && (word.el || word.en)) {
        wordCard.classList.remove("hidden");
        var wel = document.getElementById("word-el");
        var wen = document.getElementById("word-en");
        var wsay = document.getElementById("word-say");
        var hear = document.getElementById("word-hear");
        if (wel) wel.textContent = word.el || "";
        if (wen) {
          var bits = [];
          if (word.en) bits.push(word.en);
          if (word.meaning) bits.push(word.meaning);
          wen.textContent = bits.join(" \u2014 ");
        }
        if (wsay) wsay.textContent = word.say ? ("Say it: " + word.say) : "";
        if (hear) {
          if (!word.el) {
            hear.style.display = "none";
          } else {
            hear.style.display = "";
            hear.onclick = function (e) {
              if (e) e.preventDefault();
              // Reliable on iPhone: real Greek voice in Google Translate
              var url = "https://translate.google.com/?sl=el&tl=en&text=" +
                encodeURIComponent(word.el) + "&op=translate";
              window.open(url, "_blank", "noopener,noreferrer");
            };
          }
        }
      }
    })
    .catch(function () {});

  fetch("/eats.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (items) {
      var list = document.getElementById("eats-list");
      var empty = document.getElementById("eats-empty");
      if (!list) return;
      if (!items || !items.length) return;
      if (empty) empty.classList.add("hidden");
      items.forEach(function (e) {
        var li = document.createElement("li");
        li.className = "rounded-xl bg-surface p-5 card-shadow";
        li.innerHTML =
          "<p class=\"text-xs font-semibold uppercase tracking-widest text-primary\">" + (e.place || "Somewhere along the way") + "</p>" +
          "<h3 class=\"mt-1 font-serif text-xl font-semibold text-fg\">" + (e.dish || "") + "</h3>" +
          (e.note ? "<p class=\"mt-1.5 text-base leading-relaxed text-fg/90\">" + e.note + "</p>" : "");
        list.appendChild(li);
      });
    })
    .catch(function () {});

  function placeLiveMap() {
    var el = document.getElementById("live-map");
    if (!el || typeof L === "undefined") return;
    if (el._leaflet_id) {
      try { el._leaflet_id = undefined; } catch (e) {}
      el.innerHTML = "";
      delete el._leaflet_id;
    }
    var here = [34.2694, -118.7815];
    var tiles = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    var live = L.map(el, { scrollWheelZoom: false, zoomControl: true }).setView(here, 12);
    L.tileLayer(tiles, { attribution: "&copy; OpenStreetMap &copy; CARTO", maxZoom: 19 }).addTo(live);
    L.circle(here, { radius: 8000, color: "#1b6f66", weight: 1, fillColor: "#1b6f66", fillOpacity: 0.12, interactive: false }).addTo(live);
    L.marker(here, {
      icon: L.divIcon({
        className: "trip-pin",
        html: '<div class="trip-pin-inner"><span class="live-pin-pulse"></span><div class="trip-pin-head"><span></span></div><div class="trip-pin-tail"></div></div>',
        iconSize: [28, 40],
        iconAnchor: [14, 40]
      })
    }).addTo(live).bindPopup('<p class="map-popup-title">Simi Valley</p><p class="map-popup-meta">California</p>');
  }
  setTimeout(placeLiveMap, 700);

  function hideEmptyActuals() {
    document.querySelectorAll(".itinerary-sub").forEach(function (el) {
      var h = el.querySelector("h4");
      if (h && /actually did/i.test(h.textContent || "")) el.remove();
    });
  }
  setTimeout(hideEmptyActuals, 400);
  setTimeout(hideEmptyActuals, 1200);
})();
