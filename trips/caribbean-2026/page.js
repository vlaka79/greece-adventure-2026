(function () {
  function formatDate(iso) {
    if (!iso) return "";
    try {
      return new Date(iso + "T12:00:00").toLocaleDateString(undefined, {
        year: "numeric", month: "long", day: "numeric"
      });
    } catch (e) { return iso; }
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  fetch("/trips/caribbean-2026/log.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (items) {
      var list = document.getElementById("trip-log");
      if (!list) return;
      (items || []).forEach(function (e) {
        var li = document.createElement("li");
        li.innerHTML =
          '<article class="rounded-xl bg-surface p-5 card-shadow">' +
          '<div class="flex flex-wrap items-center gap-2">' +
          '<time datetime="' + esc(e.date || "") + '" class="text-sm font-medium text-muted">' + esc(formatDate(e.date)) + "</time>" +
          (e.tag ? '<span class="inline-flex min-h-7 items-center rounded-full bg-primary-soft px-2.5 text-xs font-semibold tracking-wide text-primary">' + esc(e.tag) + "</span>" : "") +
          "</div>" +
          '<h3 class="mt-3 font-serif text-2xl font-semibold text-fg">' + esc(e.title || "") + "</h3>" +
          '<p class="mt-2 text-base leading-relaxed text-fg/90">' + esc(e.body || "") + "</p>" +
          "</article>";
        list.appendChild(li);
      });
    })
    .catch(function () {});

  fetch("/trips/caribbean-2026/eats.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (items) {
      var list = document.getElementById("eats-list");
      var empty = document.getElementById("eats-empty");
      if (!list) return;
      items = items || [];
      if (!items.length) {
        if (empty) empty.classList.remove("hidden");
        return;
      }
      if (empty) empty.classList.add("hidden");
      items.forEach(function (e) {
        var li = document.createElement("li");
        li.className = "overflow-hidden rounded-xl bg-surface card-shadow";
        var html = "";
        if (e.photo) {
          html += '<img src="' + esc(e.photo) + '" alt="" class="aspect-video w-full object-cover" />';
        }
        html += '<div class="p-5">' +
          '<p class="text-xs font-semibold uppercase tracking-widest text-primary">' + esc(e.place || "Somewhere along the way") + "</p>" +
          '<h3 class="mt-1 font-serif text-2xl font-semibold text-fg">' + esc(e.dish || "") + "</h3>" +
          (e.note ? '<p class="mt-2 text-base leading-relaxed text-fg/90">' + esc(e.note) + "</p>" : "") +
          "</div>";
        li.innerHTML = html;
        list.appendChild(li);
      });
    })
    .catch(function () {});

  var notesList = document.getElementById("guestbook-list");
  if (notesList) {
    fetch("/trips/caribbean-2026/notes.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (items) {
        notesList.innerHTML = "";
        (items || []).forEach(function (n) {
          var li = document.createElement("li");
          li.className = "rounded-xl bg-surface p-5 card-shadow";
          var when = formatDate(n.date);
          var html =
            '<div class="flex flex-wrap items-baseline justify-between gap-2">' +
            '<p class="font-semibold text-fg">' + esc(n.name || "Friend") + "</p>" +
            (when ? '<time class="text-sm text-muted">' + esc(when) + "</time>" : "") +
            "</div>" +
            '<p class="mt-2 text-base leading-relaxed text-fg/90">' + esc(n.message || "") + "</p>";
          if (n.reply) {
            html +=
              '<div class="guestbook-reply">' +
              '<p class="text-xs font-semibold uppercase tracking-wide text-primary">Daniel &amp; Julia</p>' +
              '<p class="mt-1 text-base leading-relaxed text-fg/90">' + esc(n.reply) + "</p>" +
              "</div>";
          }
          li.innerHTML = html;
          notesList.appendChild(li);
        });
      })
      .catch(function () {});
  }

  function showFormToast(msg) {
    var el = document.getElementById("form-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "form-toast";
      el.setAttribute("role", "status");
      el.style.cssText = "position:fixed;left:50%;bottom:1.4rem;transform:translateX(-50%);z-index:80;width:min(22rem,calc(100% - 2rem));border-radius:1rem;background:#1b6f66;color:#f4eee4;padding:1rem 1.15rem;text-align:center;font:600 1rem/1.4 Source Sans 3,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.2);";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = "block";
    clearTimeout(showFormToast._t);
    showFormToast._t = setTimeout(function () { el.style.display = "none"; }, 4200);
  }
  var form = document.getElementById("notes-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector("button[type=submit]");
      if (btn) btn.disabled = true;
      var data = new URLSearchParams(new FormData(form));
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: data.toString()
      }).then(function () {
        form.reset();
        showFormToast("Got it — thank you. We’ll read this.");
      }).catch(function () {
        form.submit();
      }).then(function () {
        if (btn) btn.disabled = false;
      });
    });
  }
})();
