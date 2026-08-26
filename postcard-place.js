(function () {
  function apply() {
    fetch("/status.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (status) {
        if (!status || !status.postcard) return;
        var card = status.postcard;
        var place = card.place || "";
        if (!place) return;

        var postcard = document.getElementById("postcard");
        if (!postcard) return;

        var title = document.getElementById("postcard-title");
        // Prefer: place as primary label above title
        var existing = document.getElementById("postcard-place");
        if (!existing) {
          existing = document.createElement("p");
          existing.id = "postcard-place";
          existing.className = "text-xs font-semibold uppercase tracking-widest text-primary";
          // Insert just above the title if possible
          if (title && title.parentNode) {
            title.parentNode.insertBefore(existing, title);
          } else {
            postcard.appendChild(existing);
          }
        }
        existing.textContent = place;

        // Picture of the day caption: include place
        var pcap = document.getElementById("photo-day-caption");
        if (pcap && card.note) {
          pcap.textContent = place + (card.title ? " · " + card.title : "") + " — " + card.note;
        }
      })
      .catch(function () {});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(apply, 700); });
  } else {
    setTimeout(apply, 700);
  }
})();
