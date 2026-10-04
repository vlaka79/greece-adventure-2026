(function () {
  var START = "2026-10-06";

  function todayISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1);
    var day = String(d.getDate());
    if (m.length < 2) m = "0" + m;
    if (day.length < 2) day = "0" + day;
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function latestWeek(weeks, today) {
    var current = null;
    (weeks || []).forEach(function (w) {
      if (!w || !w.weekOf || w.weekOf > today) return;
      if (!w.line && !w.photo) return;
      if (!current || w.weekOf > current.weekOf) current = w;
    });
    return current;
  }

  function renderSlot(root, data) {
    var today = todayISO();
    var starts = (data && data.starts) || START;
    var started = today >= starts;
    var week = started ? latestWeek(data && data.weeks, today) : null;
    var line = "";
    var photo = "";
    var alt = "";
    if (!started) {
      line = "Waiting on October 6. The first note isn’t written yet.";
    } else if (week) {
      line = week.line || "";
      photo = week.photo || "";
      alt = week.alt || "";
    } else {
      line = "This week’s note isn’t up yet.";
    }
    var frame = photo
      ? '<img src="' + esc(photo) + '" alt="' + esc(alt) + '" />'
      : '<div class="now-empty">Photo when there’s a note</div>';
    root.innerHTML =
      '<p class="now-kicker">This week</p>' +
      '<div class="now-body">' +
      frame +
      (line ? '<p class="now-line">' + esc(line) + "</p>" : "") +
      "</div>";
    root.hidden = false;
  }

  function renderLog(data) {
    var list = document.getElementById("weekly-list");
    var empty = document.getElementById("weekly-empty");
    if (!list && !empty) return;
    var today = todayISO();
    var starts = (data && data.starts) || START;
    var started = today >= starts;
    var weeks = ((data && data.weeks) || []).filter(function (w) {
      return w && w.weekOf && w.weekOf <= today && (w.line || w.photo);
    }).sort(function (a, b) {
      return a.weekOf < b.weekOf ? 1 : -1;
    });
    if (!weeks.length) {
      if (empty) {
        empty.hidden = false;
        empty.textContent = started
          ? "This week’s note isn’t up yet."
          : "No weekly notes yet. The trip starts October 6.";
      }
      return;
    }
    if (empty) empty.hidden = true;
    if (!list) return;
    list.innerHTML = "";
    weeks.forEach(function (w) {
      var li = document.createElement("li");
      var html = '<article class="rounded-xl bg-surface p-5 card-shadow">';
      html += '<p class="text-sm font-medium text-muted">' + esc(w.weekOf) + "</p>";
      if (w.photo) {
        html += '<img src="' + esc(w.photo) + '" alt="' + esc(w.alt || "") + '" class="mt-3 aspect-video w-full rounded-lg object-cover" />';
      }
      if (w.line) html += '<p class="mt-3 text-base leading-relaxed text-fg/90">' + esc(w.line) + "</p>";
      html += "</article>";
      li.innerHTML = html;
      list.appendChild(li);
    });
  }

  var loaded = null;

  function load() {
    if (!loaded) {
      loaded = fetch("/trips/japan-2026-27/now.json", { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : { starts: START, weeks: [] }; })
        .catch(function () { return { starts: START, weeks: [] }; });
    }
    return loaded;
  }

  function mount() {
    var slots = document.querySelectorAll("[data-kanda-now]");
    var hasLog = document.getElementById("weekly-list") || document.getElementById("weekly-empty");
    if (!slots.length && !hasLog) return;
    load().then(function (data) {
      data = data || { starts: START, weeks: [] };
      document.querySelectorAll("[data-kanda-now]").forEach(function (root) { renderSlot(root, data); });
      renderLog(data);
    });
  }

  window.__mountKandaNow = mount;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
