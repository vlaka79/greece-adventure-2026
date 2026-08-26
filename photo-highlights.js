(function () {
  var NEW_MS = 48 * 60 * 60 * 1000;
  var placeLabels = {
    crete: "Crete",
    santorini: "Santorini",
    athens: "Athens",
    travel: "There & back"
  };

  function photoIsNew(item) {
    if (!item || !item.added) return false;
    var t = Date.parse(item.added + (item.added.length <= 10 ? "T12:00:00" : ""));
    if (isNaN(t)) return false;
    return Date.now() - t < NEW_MS;
  }

  function photoAddedTime(item) {
    if (!item || !item.added) return 0;
    var t = Date.parse(item.added + (item.added.length <= 10 ? "T12:00:00" : ""));
    return isNaN(t) ? 0 : t;
  }

  fetch("/photos/album.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (items) {
      items = items || [];

      var counts = { crete: 0, santorini: 0, athens: 0, travel: 0 };
      items.forEach(function (it) {
        var p = (it.place || "").toLowerCase();
        if (counts[p] != null && photoIsNew(it)) counts[p] += 1;
      });
      Object.keys(counts).forEach(function (p) {
        var el = document.getElementById("badge-" + p);
        if (!el) return;
        if (counts[p] > 0) {
          el.hidden = false;
          el.textContent = counts[p] === 1 ? "1 new" : counts[p] + " new";
        } else {
          el.hidden = true;
        }
      });

      var recent = items
        .slice()
        .filter(photoIsNew)
        .sort(function (a, b) {
          return photoAddedTime(b) - photoAddedTime(a);
        })
        .slice(0, 4);

      var wrap = document.getElementById("just-added");
      var list = document.getElementById("just-added-list");
      if (wrap && list && recent.length) {
        list.innerHTML = "";
        recent.forEach(function (it) {
          var a = document.createElement("a");
          a.className = "just-added-card";
          a.href = "/place.html?place=" + encodeURIComponent((it.place || "crete").toLowerCase());
          a.innerHTML =
            '<img src="' +
            it.src +
            '" alt="" loading="lazy" />' +
            '<span class="meta">' +
            '<span class="place-tag">' +
            (placeLabels[(it.place || "").toLowerCase()] || it.place || "") +
            "</span>" +
            '<span class="cap">' +
            (it.caption || "New photo") +
            "</span></span>";
          list.appendChild(a);
        });
        wrap.classList.remove("hidden");
      }
    })
    .catch(function () {});
})();
