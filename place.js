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
  var lb = document.getElementById("lb");
  var lbImg = document.getElementById("lb-img");
  var shown = 0;

  function isNew(item) {
    if (!item || !item.added) return false;
    var t = Date.parse(item.added + (item.added.length <= 10 ? "T12:00:00" : ""));
    if (isNaN(t)) return false;
    return Date.now() - t < NEW_MS;
  }

  function addPhoto(src, caption, isNewShot) {
    var li = document.createElement("li");
    var img = document.createElement("img");
    img.className = "aspect-photo w-full object-cover";
    img.alt = caption || "";
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
    if (isNewShot) {
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
      lbImg.src = src;
      lb.classList.remove("hidden");
      lb.classList.add("flex");
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
        var ta = Date.parse((a.added || "2000-01-01") + "T12:00:00") || 0;
        var tb = Date.parse((b.added || "2000-01-01") + "T12:00:00") || 0;
        return tb - ta;
      });
      if (!shots.length) {
        if (empty) empty.classList.remove("hidden");
        return;
      }
      shots.forEach(function (item) {
        if (item.src) addPhoto(item.src, item.caption || "", isNew(item));
      });
      setTimeout(function () {
        if (!shown && empty) empty.classList.remove("hidden");
      }, 800);
    })
    .catch(function () {
      if (empty) empty.classList.remove("hidden");
    });

  function closeLb() {
    lb.classList.add("hidden");
    lb.classList.remove("flex");
    lbImg.src = "";
  }
  var closeBtn = document.getElementById("lb-close");
  if (closeBtn) closeBtn.addEventListener("click", closeLb);
  if (lb) lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLb(); });
})();
