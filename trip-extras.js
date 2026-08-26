(function () {
  var base = document.createElement("script");
  base.src = "https://cdn.jsdelivr.net/gh/vlaka79/greece-adventure-2026@a17972c1c5e11d60e9a028831f76589255e7fd8c/trip-extras.js";
  document.head.appendChild(base);

  function formatDate(iso) {
    if (!iso) return "";
    try {
      return new Date(iso + "T12:00:00").toLocaleDateString(undefined, {
        year: "numeric", month: "long", day: "numeric"
      });
    } catch (e) { return iso; }
  }

  function buildLogPreview() {
    fetch("/log.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (items) {
        items = items || [];
        var list = document.querySelector("#log ol");
        if (!list) return;
        list.innerHTML = "";
        items.slice(0, 2).forEach(function (e) {
          var li = document.createElement("li");
          li.innerHTML =
            '<article class="rounded-xl bg-surface p-5 card-shadow">' +
            '<div class="flex flex-wrap items-center gap-2">' +
            '<time datetime="' + (e.date || "") + '" class="text-sm font-medium text-muted">' + formatDate(e.date) + "</time>" +
            (e.tag ? '<span class="inline-flex min-h-7 items-center rounded-full bg-primary-soft px-2.5 text-xs font-semibold tracking-wide text-primary">' + e.tag + "</span>" : "") +
            "</div>" +
            '<h3 class="mt-3 font-serif text-2xl font-semibold text-fg">' + (e.title || "") + "</h3>" +
            '<p class="mt-2 text-base leading-relaxed text-fg/90">' + (e.body || "") + "</p>" +
            "</article>";
          list.appendChild(li);
        });
        if (items.length > 2 && !document.getElementById("log-see-all")) {
          var more = document.createElement("p");
          more.id = "log-see-all";
          more.className = "mt-4";
          more.innerHTML = '<a href="/log.html" class="text-sm font-semibold text-primary">See all adventures \u2192</a>';
          list.parentNode.insertBefore(more, list.nextSibling);
        }
      })
      .catch(function () {});
  }
  setTimeout(buildLogPreview, 400);
  setTimeout(buildLogPreview, 1200);

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

  function styleItinerary() {
    fetch("/itinerary.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (stops) {
        var list = document.getElementById("itinerary-list");
        if (!list || !stops || !stops.length) return;
        var items = list.querySelectorAll(":scope > li");
        stops.forEach(function (s, idx) {
          var li = items[idx];
          if (!li) return;
          var article = li.querySelector("article");
          var dot = li.querySelector(":scope > span");
          var state = s.state || "upcoming";
          if (state === "done") {
            if (article) article.style.opacity = "0.55";
            if (dot) {
              dot.style.background = "#1b6f66";
              dot.style.borderColor = "#1b6f66";
              dot.innerHTML = '<span style="display:block;width:100%;height:100%;border-radius:999px;background:#1b6f66;color:#f4eee4;font-size:10px;line-height:14px;text-align:center;font-weight:700;">\u2713</span>';
              dot.style.display = "flex";
              dot.style.alignItems = "center";
              dot.style.justifyContent = "center";
              dot.style.overflow = "hidden";
            }
            var h3 = li.querySelector("h3");
            if (h3 && !li.querySelector(".it-done-label")) {
              var lab = document.createElement("span");
              lab.className = "it-done-label";
              lab.style.cssText = "margin-left:0.5rem;font-size:0.7rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#1b6f66;";
              lab.textContent = "Done";
              h3.appendChild(lab);
            }
          } else if (state === "now") {
            if (article) {
              article.style.boxShadow = "0 0 0 2px #1b6f66, 0 8px 24px rgba(27,111,102,0.15)";
              article.style.background = "#f7faf9";
            }
            if (dot) {
              dot.style.background = "#1b6f66";
              dot.style.borderColor = "#1b6f66";
              dot.style.boxShadow = "0 0 0 4px rgba(27,111,102,0.25)";
            }
            var head = li.querySelector(".flex.flex-wrap");
            if (head && !li.querySelector(".it-now-label")) {
              var now = document.createElement("span");
              now.className = "it-now-label inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-semibold tracking-wide";
              now.style.cssText = "background:#1b6f66;color:#f4eee4;";
              now.textContent = "Here now";
              head.appendChild(now);
            }
          }
        });
      })
      .catch(function () {});
  }
  setTimeout(styleItinerary, 700);
  setTimeout(styleItinerary, 1600);
})();
