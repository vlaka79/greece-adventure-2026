(function () {
  function clockTime(tz) {
    try {
      return new Date().toLocaleTimeString("en-US", {
        timeZone: tz, hour: "numeric", minute: "2-digit"
      });
    } catch (e) { return ""; }
  }
  function tickClocks() {
    var gr = document.getElementById("clock-gr");
    if (gr) gr.textContent = clockTime("Europe/Athens");
  }
  tickClocks();
  setInterval(tickClocks, 15000);

  var pulse = document.querySelector(".pulse-dot");
  if (pulse && pulse.nextElementSibling) pulse.nextElementSibling.textContent = "At Burbank Airport";
  var pills = document.querySelectorAll("#where .rounded-full");
  if (pills && pills[0]) pills[0].textContent = "Burbank Airport, California";

  var laClock = document.getElementById("clock-la");
  if (laClock) {
    var laCard = laClock.closest(".rounded-xl") || laClock.parentElement;
    if (laCard) laCard.style.display = "none";
  }
  var grClock = document.getElementById("clock-gr");
  if (grClock && grClock.previousElementSibling) {
    grClock.previousElementSibling.textContent = "Daniel & Julia time";
  }
  if (grClock && !document.getElementById("clock-gr-note")) {
    var note = document.createElement("p");
    note.id = "clock-gr-note";
    note.className = "mt-1 text-sm text-muted";
    note.textContent = "Still Greece time under the hood \u2014 just more fun.";
    grClock.insertAdjacentElement("afterend", note);
  }

  var wordCardEl = document.getElementById("word-card");
  if (wordCardEl && !document.getElementById("word-past-btn")) {
    var pastBtn = document.createElement("button");
    pastBtn.type = "button";
    pastBtn.id = "word-past-btn";
    pastBtn.className = "mt-3 text-sm font-semibold text-primary";
    pastBtn.textContent = "Past words";
    var pastList = document.createElement("ul");
    pastList.id = "word-past";
    pastList.className = "mt-3 hidden space-y-2";
    wordCardEl.appendChild(pastBtn);
    wordCardEl.appendChild(pastList);
  }

  var updatesForm = document.getElementById("updates-form");
  var notesListEl = document.getElementById("guestbook-list");
  if (updatesForm && notesListEl && notesListEl.parentNode) {
    notesListEl.parentNode.insertBefore(updatesForm, notesListEl.nextSibling);
    updatesForm.classList.add("mt-8");
  }

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
        if (wel) wel.textContent = word.el || "";
        if (wen) {
          var bits = [];
          if (word.en) bits.push(word.en);
          if (word.meaning) bits.push(word.meaning);
          wen.textContent = bits.join(" \u2014 ");
        }
        if (wsay) wsay.textContent = word.say ? ("Say it: " + word.say) : "";
      }

      var photoDay = status.photoDay || {};
      var photoCard = document.getElementById("photo-day");
      var photoImg = document.getElementById("photo-day-img");
      var photoCap = document.getElementById("photo-day-caption");
      if (photoCard && photoImg && photoDay.src) {
        photoImg.src = photoDay.src;
        photoImg.alt = photoDay.caption || "Picture of the day";
        if (photoCap) photoCap.textContent = photoDay.caption || "";
        photoCard.classList.remove("hidden");
      }
    })
    .catch(function () {});

  fetch("/words.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (words) {
      var btn = document.getElementById("word-past-btn");
      var list = document.getElementById("word-past");
      if (!btn || !list) return;
      words = words || [];
      if (words.length < 2) {
        btn.textContent = "Past words will collect here";
        btn.disabled = true;
        return;
      }
      var todayEl = (document.getElementById("word-el") || {}).textContent || "";
      list.innerHTML = "";
      words.forEach(function (w) {
        if (todayEl && w.el === todayEl) return;
        var li = document.createElement("li");
        li.className = "rounded-lg bg-bg-warm px-3 py-2";
        var when = "";
        if (w.date) {
          try {
            when = new Date(w.date + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
          } catch (e) { when = w.date; }
        }
        li.innerHTML =
          '<p class="font-serif text-lg font-semibold text-fg">' + (w.el || "") + "</p>" +
          '<p class="text-sm text-fg/90">' + [w.en, w.meaning].filter(Boolean).join(" \u2014 ") + "</p>" +
          '<p class="text-xs text-muted">' + (w.say ? ("Say it: " + w.say) : "") + (when ? " \u00b7 " + when : "") + "</p>";
        list.appendChild(li);
      });
      if (!list.children.length) {
        btn.textContent = "Past words will collect here";
        btn.disabled = true;
        return;
      }
      btn.addEventListener("click", function () {
        var open = !list.classList.contains("hidden");
        list.classList.toggle("hidden", open);
        btn.textContent = open ? "Past words" : "Hide past words";
      });
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
    var here = [34.2006, -118.3585];
    var tiles = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    var live = L.map(el, { scrollWheelZoom: false, zoomControl: true }).setView(here, 13);
    L.tileLayer(tiles, { attribution: "&copy; OpenStreetMap &copy; CARTO", maxZoom: 19 }).addTo(live);
    L.circle(here, { radius: 2500, color: "#1b6f66", weight: 1, fillColor: "#1b6f66", fillOpacity: 0.12, interactive: false }).addTo(live);
    L.marker(here, {
      icon: L.divIcon({
        className: "trip-pin",
        html: '<div class="trip-pin-inner"><span class="live-pin-pulse"></span><div class="trip-pin-head"><span></span></div><div class="trip-pin-tail"></div></div>',
        iconSize: [28, 40],
        iconAnchor: [14, 40]
      })
    }).addTo(live).bindPopup('<p class="map-popup-title">Burbank Airport</p><p class="map-popup-meta">Guy Fieri\u2019s Kitchen + Bar Express</p>');
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

  function formatNoteDate(iso) {
    if (!iso) return "";
    try {
      return new Date(iso + "T12:00:00").toLocaleDateString(undefined, {
        year: "numeric", month: "long", day: "numeric"
      });
    } catch (e) { return iso; }
  }

  function noteKey(n) {
    return String(n.name || "").trim().toLowerCase() + "|" + String(n.message || "").trim().toLowerCase();
  }

  function isJunkNote(n) {
    var name = String(n.name || "").trim().toLowerCase();
    var msg = String(n.message || "").trim().toLowerCase();
    return msg === "test" || msg === "testing" || (name === "daniel boone" && msg === "test");
  }

  function readPending() {
    try {
      var raw = localStorage.getItem("guestbook-pending");
      var arr = raw ? JSON.parse(raw) : [];
      arr = (Array.isArray(arr) ? arr : []).filter(function (n) { return !isJunkNote(n); });
      localStorage.setItem("guestbook-pending", JSON.stringify(arr));
      return arr;
    } catch (e) { return []; }
  }

  function writePending(arr) {
    try { localStorage.setItem("guestbook-pending", JSON.stringify(arr || [])); } catch (e) {}
  }

  function mergeNotes(server) {
    var seen = {};
    var out = [];
    function add(n) {
      if (!n || !n.message || isJunkNote(n)) return;
      var k = noteKey(n);
      if (seen[k]) return;
      seen[k] = true;
      out.push(n);
    }
    readPending().forEach(add);
    (server || []).forEach(add);
    return out;
  }

  function noteCard(n) {
    var when = formatNoteDate(n.date);
    var html =
      '<div class="flex flex-wrap items-baseline justify-between gap-2">' +
      '<p class="font-semibold text-fg">' + (n.name || "Friend") + "</p>" +
      (when ? '<time class="text-sm text-muted">' + when + "</time>" : "") +
      "</div>" +
      '<p class="mt-2 text-base leading-relaxed text-fg/90">' + (n.message || "") + "</p>";
    if (n.reply) {
      html +=
        '<div class="guestbook-reply">' +
        '<p class="text-xs font-semibold uppercase tracking-wide text-primary">Daniel & Julia</p>' +
        '<p class="mt-1 text-base leading-relaxed text-fg/90">' + n.reply + "</p>" +
        "</div>";
    }
    return html;
  }

  function drawNotes(items) {
    var list = document.getElementById("guestbook-list");
    if (!list) return;
    list.innerHTML = "";
    mergeNotes(items).forEach(function (n) {
      var li = document.createElement("li");
      li.className = "rounded-xl bg-surface p-5 card-shadow";
      li.innerHTML = noteCard(n);
      list.appendChild(li);
    });
  }

  function loadNotes() {
    fetch("/guestbook.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(drawNotes)
      .catch(function () {});
  }

  setTimeout(loadNotes, 300);

  var gbForm = document.getElementById("guestbook-form");
  if (gbForm) {
    gbForm.addEventListener("submit", function () {
      var nameEl = document.getElementById("guest-name");
      var msgEl = document.getElementById("guest-message");
      var name = nameEl ? nameEl.value.trim() : "";
      var message = msgEl ? msgEl.value.trim() : "";
      if (!message) return;
      var today = new Date();
      var iso = today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0") + "-" +
        String(today.getDate()).padStart(2, "0");
      var note = { name: name || "Friend", date: iso, message: message };
      if (isJunkNote(note)) return;
      var pending = readPending();
      pending.unshift(note);
      writePending(pending);
      drawNotes([]);
    });
  }
})();
