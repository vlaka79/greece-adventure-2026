(function () {
  var KEY = "dj-theme";

  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function current() {
    return document.documentElement.getAttribute("data-theme") === "night" ? "night" : "day";
  }

  function paintButton(theme) {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    var night = theme === "night";
    btn.setAttribute("aria-pressed", night ? "true" : "false");
    btn.textContent = night ? "Day map" : "Night map";
  }

  function apply(theme, persist) {
    document.documentElement.setAttribute("data-theme", theme);
    if (persist) {
      try { localStorage.setItem(KEY, theme); } catch (e) {}
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "night" ? "#101614" : "#f4eee4");
    paintButton(theme);
    window.dispatchEvent(new CustomEvent("dj-theme", { detail: theme }));
  }

  var initial = saved();
  if (initial !== "night" && initial !== "day") {
    initial = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "day";
  }
  apply(initial, false);

  var btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.addEventListener("click", function () {
      apply(current() === "night" ? "day" : "night", true);
    });
  }

  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onScheme = function (e) {
      if (saved()) return;
      apply(e.matches ? "night" : "day", false);
    };
    if (mq.addEventListener) mq.addEventListener("change", onScheme);
    else if (mq.addListener) mq.addListener(onScheme);
  }
})();
