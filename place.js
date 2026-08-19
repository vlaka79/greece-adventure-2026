(function () {
  var PLACES = {
    crete: { title: "Crete", lead: "Hills, coast, and the days on the island." },
    santorini: { title: "Santorini", lead: "Three nights on the island." },
    athens: { title: "Athens", lead: "The last days in the city." }
  };
  var id = (new URLSearchParams(location.search).get("place") || "crete").toLowerCase();
  if (!PLACES[id]) id = "crete";
  var meta = PLACES[id];
  document.title = meta.title + " — Greece Adventure 2026";
  var title = document.getElementById("place-title");
  var lead = document.getElementById("place-lead");
  if (title) title.textContent = meta.title;
  if (lead) lead.textContent = meta.lead;

  var album = document.getElementById("place-album");
  var empty = document.getElementById("place-empty");
  var lb = document.getElementById("lb");
  var lbImg = document.getElementById("lb-img");

  fetch("/photos/album.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (items) {
      var shots = (items || []).filter(function (item) {
        return (item.place || "").toLowerCase() === id;
      });
      if (!shots.length) {
        if (empty) empty.classList.remove("hidden");
        return;
      }
      shots.forEach(function (item) {
        var li = document.createElement("li");
        li.innerHTML =
          '<button type="button" class="photo group relative block w-full overflow-hidden rounded-xl bg-bg-warm text-left card-shadow" data-full="' + item.src + '">' +
          '<img src="' + item.src + '" alt="' + (item.caption || "") + '" class="aspect-photo w-full object-cover" />' +
          (item.caption ? '<span class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-fg/70 to-transparent px-3 pb-3 pt-8 text-sm font-medium text-surface">' + item.caption + "</span>" : "") +
          "</button>";
        album.appendChild(li);
      });
      album.querySelectorAll(".photo").forEach(function (el) {
        el.addEventListener("click", function () {
          lbImg.src = el.getAttribute("data-full");
          lb.classList.remove("hidden");
          lb.classList.add("flex");
        });
      });
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
