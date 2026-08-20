(function () {
  function clockTime(tz) {
    try {
      return new Date().toLocaleTimeString("en-US", {
        timeZone: tz, hour: "numeric", minute: "2-digit"
      });
    } catch (e) { return ""; }
  }
  function tickClocks() {
    var la = document.getElementById("clock-la");
    var gr = document.getElementById("clock-gr");
    if (la) la.textContent = clockTime("America/Los_Angeles");
    if (gr) gr.textContent = clockTime("Europe/Athens");
  }
  tickClocks();
  setInterval(tickClocks, 15000);

  fetch("/status.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (status) {
      status = status || {};
      var word = status.word || {};
      var wordCard = document.getElementById("word-card");
      if (wordCard && (word.el || word.en)) {
        wordCard.classList.remove("hidden");
        var wel = document.getElementById("word-el");
        var wen = document.getElementById("word-en");
        var wsay = document.getElementById("word-say");
        if (wel) wel.textContent = word.el || "";
        if (wen) {
          var bits = [];
          if (word.en) bits.push(word.en);
          if (word.meaning) bits.push(word.meaning);
          wen.textContent = bits.join(" \u2014 ");
        }
        if (wsay) wsay.textContent = word.say ? ("Say it: " + word.say) : "";
      }
    })
    .catch(function () {});

  fetch("/eats.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (items) {
      var list = document.getElementById("eats-list");
      var empty = document.getElementById("eats-empty");
      if (!list) return;
      if (!items || !items.length) return;
      if (empty) empty.classList.add("hidden");
      items.forEach(function (e) {
        var li = document.createElement("li");
        li.className = "rounded-xl bg-surface p-5 card-shadow";
        li.innerHTML =
          "<p class=\"text-xs font-semibold uppercase tracking-widest text-primary\">" + (e.place || "Somewhere along the way") + "</p>" +
          "<h3 class=\"mt-1 font-serif text-xl font-semibold text-fg\">" + (e.dish || "") + "</h3>" +
          (e.note ? "<p class=\"mt-1.5 text-base leading-relaxed text-fg/90\">" + e.note + "</p>" : "");
        list.appendChild(li);
      });
    })
    .catch(function () {});
})();
