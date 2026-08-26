(function () {
  var base = document.createElement("script");
  base.src = "https://cdn.jsdelivr.net/gh/vlaka79/greece-adventure-2026@a17972c1c5e11d60e9a028831f76589255e7fd8c/trip-extras.js";
  document.head.appendChild(base);

  function buildRotator() {
    fetch("/eats.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (items) {
        items = items || [];
        var list = document.getElementById("eats-list");
        var empty = document.getElementById("eats-empty");
        if (!list || !items.length) return;
        if (empty) empty.classList.add("hidden");
        list.innerHTML = "";
        list.className = "mt-6";
        var card = document.createElement("article");
        card.id = "eats-rotator";
        card.className = "overflow-hidden rounded-xl bg-surface card-shadow";
        card.innerHTML =
          '<div id="eats-rot-photo-wrap" class="hidden">' +
          '<img id="eats-rot-photo" alt="" class="aspect-video w-full object-cover" />' +
          "</div>" +
          '<div class="p-5">' +
          '<p id="eats-rot-place" class="text-xs font-semibold uppercase tracking-widest text-primary"></p>' +
          '<h3 id="eats-rot-dish" class="mt-1 font-serif text-xl font-semibold text-fg"></h3>' +
          '<p id="eats-rot-note" class="mt-1.5 text-base leading-relaxed text-fg/90"></p>' +
          '<p id="eats-rot-dots" class="mt-3 flex gap-1.5"></p>' +
          "</div>";
        list.appendChild(card);
        if (!document.getElementById("eats-see-all")) {
          var more = document.createElement("p");
          more.id = "eats-see-all";
          more.className = "mt-4";
          more.innerHTML = '<a href="/eats.html" class="text-sm font-semibold text-primary">See all eat & drink \u2192</a>';
          list.parentNode.insertBefore(more, list.nextSibling);
        }
        var i = 0;
        function show(idx) {
          var e = items[idx];
          if (!e) return;
          var place = document.getElementById("eats-rot-place");
          var dish = document.getElementById("eats-rot-dish");
          var note = document.getElementById("eats-rot-note");
          var photo = document.getElementById("eats-rot-photo");
          var wrap = document.getElementById("eats-rot-photo-wrap");
          var dots = document.getElementById("eats-rot-dots");
          if (place) place.textContent = e.place || "Somewhere along the way";
          if (dish) dish.textContent = e.dish || "";
          if (note) note.textContent = e.note || "";
          if (photo && wrap) {
            if (e.photo) {
              photo.src = e.photo;
              photo.alt = e.dish || "";
              wrap.classList.remove("hidden");
            } else {
              wrap.classList.add("hidden");
            }
          }
          if (dots) {
            dots.innerHTML = "";
            items.forEach(function (_, j) {
              var d = document.createElement("button");
              d.type = "button";
              d.setAttribute("aria-label", "Show item " + (j + 1));
              d.className = "size-2 rounded-full " + (j === idx ? "bg-primary" : "bg-fg/20");
              d.addEventListener("click", function () { i = j; show(i); });
              dots.appendChild(d);
            });
          }
        }
        show(0);
        if (items.length > 1) {
          setInterval(function () {
            i = (i + 1) % items.length;
            show(i);
          }, 5500);
        }
      })
      .catch(function () {});
  }
  setTimeout(buildRotator, 900);
  setTimeout(buildRotator, 2000);
})();
