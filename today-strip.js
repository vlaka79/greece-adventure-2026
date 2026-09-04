(function () {
  var strip = document.getElementById("today-strip");
  if (!strip) return;
  var img = document.getElementById("today-strip-img");
  var whereEl = document.getElementById("today-strip-where");
  var wordEl = document.getElementById("today-strip-word");
  var noteEl = document.getElementById("today-strip-note");
  var btn = document.getElementById("today-strip-btn");

  function fill(status) {
    var pc = status.postcard || {};
    var word = status.word || {};
    var photo = pc.photo || "";
    if (!photo && !word.el && !pc.note) return;
    var loc = status.location || "";
    var place = (pc.place || "").split(",").pop().trim();
    var where = loc;
    if (place && loc.toLowerCase().indexOf(place.toLowerCase()) === -1) {
      where = loc ? loc + " · " + place : place;
    }
    if (whereEl) whereEl.textContent = where;
    if (wordEl) {
      wordEl.innerHTML = "";
      if (word.el) {
        wordEl.appendChild(document.createTextNode(word.el + " "));
        var em = document.createElement("span");
        em.textContent = (word.meaning || word.en || "").replace(/\.$/, "").toLowerCase();
        wordEl.appendChild(em);
      }
    }
    if (noteEl) noteEl.textContent = pc.note || pc.title || "";
    if (img) {
      if (photo) {
        img.src = photo;
        img.alt = pc.title || "";
        img.hidden = false;
      } else {
        img.hidden = true;
      }
    }
    strip.hidden = false;
    if (btn && photo) {
      btn.addEventListener("click", function () {
        if (typeof window.__openLb === "function") {
          window.__openLb([{ src: photo, caption: pc.caption || pc.title || pc.note || "" }], 0);
        }
      });
    }
  }

  fetch("/status.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (status) {
      if (status) fill(status);
    })
    .catch(function () {});
})();
