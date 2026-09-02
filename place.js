(function () {
  var PLACES = {
    crete: { title: "Crete", lead: "Hills, coast, and the days on the island." },
    santorini: { title: "Santorini", lead: "Three nights on the island." },
    athens: { title: "Athens", lead: "The last days in the city." },
    travel: { title: "There & back", lead: "The road and the flights — going to Greece, and coming home." }
  };
  var NEW_MS = 48 * 60 * 60 * 1000;
  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var cfg = window.PLACE_PAGE || {};
  var albumUrl = cfg.albumUrl || "/photos/album.json";
  var logUrl = cfg.logUrl || "/log.json";
  var showAll = !!cfg.showAll;
  if (cfg.places) {
    Object.keys(cfg.places).forEach(function (k) { PLACES[k] = cfg.places[k]; });
  }
  var id, meta;
  if (cfg.places) {
    id = (new URLSearchParams(location.search).get("place") || Object.keys(cfg.places)[0] || "florida").toLowerCase();
    if (!PLACES[id]) id = Object.keys(cfg.places)[0];
    meta = PLACES[id];
  } else if (cfg.albumUrl) {
    id = (cfg.place || "*").toLowerCase();
    meta = { title: cfg.title || "Photos", lead: cfg.lead || "Shots from this trip." };
  } else {
    id = (new URLSearchParams(location.search).get("place") || "crete").toLowerCase();
    if (!PLACES[id]) id = "crete";
    meta = PLACES[id];
  }
  var title = document.getElementById("place-title");
  var lead = document.getElementById("place-lead");
  if (cfg.places) {
    document.title = (cfg.documentTitle || (meta.title + " \u2014 Caribbean 2026"));
    if (cfg.documentTitle && cfg.documentTitle.indexOf("{title}") >= 0) {
      document.title = cfg.documentTitle.replace("{title}", meta.title);
    } else if (!cfg.documentTitle) {
      document.title = meta.title + " \u2014 Caribbean 2026";
    }
  } else if (!cfg.albumUrl) {
    document.title = meta.title + " \u2014 Greece Adventure 2026";
  } else if (cfg.documentTitle) {
    document.title = cfg.documentTitle;
  }
  if (title) title.textContent = meta.title;
  if (lead) lead.textContent = meta.lead;

  var album = document.getElementById("place-album");
  var empty = document.getElementById("place-empty");
  var chipBar = document.getElementById("place-chip-bar");
  var chipRow = document.getElementById("place-chips");
  var dayBanner = document.getElementById("place-day-banner");
  var shown = 0;
  var shotsForLb = [];
  var allShots = [];
  var logByDate = {};
  var selected = "all";

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
  function photoDate(item) {
    var d = (item && item.date) || "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    var added = (item && item.added) || "";
    if (added.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(added)) return added.slice(0, 10);
    return "";
  }
  function chipLabel(iso) {
    var p = iso.split("-");
    var day = parseInt(p[2], 10);
    var mon = MONTHS_SHORT[parseInt(p[1], 10) - 1] || "";
    return day + " " + mon;
  }
  function longDate(iso) {
    var p = iso.split("-");
    var day = parseInt(p[2], 10);
    var mon = MONTHS[parseInt(p[1], 10) - 1] || "";
    return day + " " + mon;
  }
  function dayTitle(iso) {
    var log = logByDate[iso];
    if (log && log.title) return longDate(iso) + " \u00b7 " + log.title;
    return longDate(iso);
  }

  function addPhoto(item, idx, grid) {
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
    grid.appendChild(li);
  }

  function groupOrder(shots) {
    var groups = {};
    var undated = [];
    shots.forEach(function (item) {
      var d = photoDate(item);
      if (!d) { undated.push(item); return; }
      if (!groups[d]) groups[d] = [];
      groups[d].push(item);
    });
    var dates = Object.keys(groups).sort().reverse();
    var out = dates.map(function (d) {
      var items = groups[d].slice().sort(function (a, b) { return parseAdded(b) - parseAdded(a); });
      return { date: d, items: items };
    });
    if (undated.length) {
      undated.sort(function (a, b) { return parseAdded(b) - parseAdded(a); });
      out.push({ date: "", items: undated, undated: true });
    }
    return out;
  }

  function setChips(dates) {
    if (!chipRow || !chipBar) return;
    chipRow.innerHTML = "";
    if (!dates.length) {
      chipBar.hidden = true;
      return;
    }
    chipBar.hidden = false;
    function addChip(value, label) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "place-chip";
      b.setAttribute("aria-pressed", value === selected ? "true" : "false");
      b.textContent = label;
      b.addEventListener("click", function () {
        selected = value;
        render();
      });
      chipRow.appendChild(b);
    }
    addChip("all", "All");
    dates.forEach(function (d) { addChip(d, chipLabel(d)); });
  }

  function render() {
    if (!album) return;
    album.innerHTML = "";
    shown = 0;
    var groups = groupOrder(allShots);
    var datedKeys = groups.filter(function (g) { return !g.undated; }).map(function (g) { return g.date; });
    setChips(datedKeys);

    var visible = groups;
    if (selected !== "all") {
      visible = groups.filter(function (g) { return g.date === selected; });
    }

    if (dayBanner) {
      if (selected !== "all" && visible.length && !visible[0].undated) {
        dayBanner.hidden = false;
        dayBanner.textContent = dayTitle(selected);
      } else {
        dayBanner.hidden = true;
        dayBanner.textContent = "";
      }
    }

    var lb = [];
    visible.forEach(function (g) {
      if (selected === "all") {
        var h = document.createElement("h2");
        h.className = "place-day-head";
        h.textContent = g.undated ? "Undated" : dayTitle(g.date);
        album.appendChild(h);
      }
      var grid = document.createElement("ul");
      grid.className = "place-day-grid";
      var base = lb.length;
      g.items.forEach(function (item, i) {
        if (!item.src) return;
        lb.push({ src: item.src, caption: item.caption || "" });
        addPhoto(item, base + i, grid);
      });
      album.appendChild(grid);
    });
    shotsForLb = lb;

    if (!allShots.length) {
      if (empty) empty.classList.remove("hidden");
      if (chipBar) chipBar.hidden = true;
    }
  }

  Promise.all([
    fetch(albumUrl, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : []; }),
    fetch(logUrl, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : []; })
  ]).then(function (pair) {
    var items = pair[0] || [];
    var logs = pair[1] || [];
    (logs || []).forEach(function (entry) {
      if (entry && entry.date && !logByDate[entry.date]) logByDate[entry.date] = entry;
    });
    allShots = items.filter(function (item) {
      if (!item || !item.src) return false;
      if (showAll || id === "*") return true;
      return (item.place || "").toLowerCase() === id;
    });
    allShots.sort(function (a, b) { return parseAdded(b) - parseAdded(a); });
    if (!allShots.length) {
      if (empty) empty.classList.remove("hidden");
      if (chipBar) chipBar.hidden = true;
      return;
    }
    render();
    setTimeout(function () {
      if (!shown && empty) empty.classList.remove("hidden");
    }, 800);
  }).catch(function () {
    if (empty) empty.classList.remove("hidden");
  });
})();
