(function () {
  var PLACES = {
    crete: { title: "Crete", lead: "Hills, coast, and the days on the island." },
    santorini: { title: "Santorini", lead: "Three nights on the island." },
    athens: { title: "Athens", lead: "The last days in the city." },
    travel: { title: "There & back", lead: "The road and the flights — going to Greece, and coming home." }
  };
  var NEW_MS = 48 * 60 * 60 * 1000;
  var id = (new URLSearchParams(location.search).get("place") || "crete").toLowerCase();
  if (!PLACES[id]) id = "crete";
  var meta = PLACES[id];
  document.title = meta.title + " \u2014 Greece Adventure 2026";
  var title = document.getElementById("place-title");
  var lead = document.getElementById("place-lead");
  if (title) title.textContent = meta.title;
  if (lead) lead.textContent = meta.lead;

  var album = document.getElementById("place-album");
  var empty = document.getElementById("place-empty");
  var shown = 0;
  var shotsForLb = [];

  function parseAdded(item) {
    var raw = (item && item.added) || "";
    if (!raw) return 0;
    var t = Date.parse(raw.length <= 10 ? raw + "T12:00:00" : raw);
    return isNaN(t) ? 0 : t;
  }
  function isNew(item) {
    var t = parseAdded(item);
    if (!t) return false;
    return Date.now() - t < NEW_MS;
  }

  function addPhoto(item, idx) {
    var src = item.src;
    var caption = item.caption || "";
    var li = document.createElement("li");
    var img = document.createElement("img");
    img.className = "aspect-photo w-full object-cover";
    img.alt = caption;
    img.loading = "lazy";
    img.src = src;
    img.onerror = function () {
      li.remove();
      shown = Math.max(0, shown - 1);
      if (!shown && empty) empty.classList.remove("hidden");
    };
    img.onload = function () {
      shown += 1;
      if (empty) empty.classList.add("hidden");
    };
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "photo group relative block w-full overflow-hidden rounded-xl bg-bg-warm text-left card-shadow";
    btn.setAttribute("data-full", src);
    btn.appendChild(img);
    if (isNew(item)) {
      var badge = document.createElement("span");
      badge.className = "photo-new-badge";
      badge.textContent = "New";
      btn.appendChild(badge);
    }
    if (caption) {
      var cap = document.createElement("span");
      cap.className = "absolute inset-x-0 bottom-0 bg-gradient-to-t from-fg/70 to-transparent px-3 pb-3 pt-8 text-sm font-medium text-surface";
      cap.textContent = caption;
      btn.appendChild(cap);
    }
    btn.addEventListener("click", function () {
      if (typeof window.__openLb === "function") window.__openLb(shotsForLb, idx);
    });
    li.appendChild(btn);
    album.appendChild(li);
  }

  fetch("/photos/album.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (items) {
      var shots = (items || []).filter(function (item) {
        return (item.place || "").toLowerCase() === id;
      });
      shots.sort(function (a, b) {
        return parseAdded(b) - parseAdded(a);
      });
      if (!shots.length) {
        if (empty) empty.classList.remove("hidden");
        return;
      }
      shotsForLb = shots.map(function (s) { return { src: s.src, caption: s.caption || "" }; });
      shots.forEach(function (item, idx) {
        if (item.src) addPhoto(item, idx);
      });
      setTimeout(function () {
        if (!shown && empty) empty.classList.remove("hidden");
      }, 800);
    })
    .catch(function () {
      if (empty) empty.classList.remove("hidden");
    });
})();
