(function () {
  var tries = 0;
  function enhance() {
    tries += 1;
    var pins = document.querySelectorAll(".photo-pin-card");
    if (!pins.length) {
      if (tries < 40) setTimeout(enhance, 250);
      return;
    }
    fetch("/photos/album.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (items) {
        var newest = null, newestT = -1;
        (items || []).forEach(function (it) {
          if (!it.lat || !it.lng || !it.src || !it.added) return;
          var t = Date.parse(it.added + (it.added.length <= 10 ? "T12:00:00" : "")) || 0;
          if (t > newestT) { newestT = t; newest = it; }
        });
        if (!newest) return;
        var needle = newest.src.split("/").pop();
        pins.forEach(function (card) {
          var img = card.querySelector("img");
          if (!img) return;
          var src = img.getAttribute("src") || "";
          if (src.indexOf(needle) >= 0) {
            var wrap = card.closest(".photo-pin") || card.parentElement;
            if (wrap) wrap.classList.add("photo-pin-new");
          }
        });
      })
      .catch(function () {});
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(enhance, 800); });
  } else {
    setTimeout(enhance, 800);
  }
})();
