(function () {
  var btn = document.getElementById("a2hs-btn");
  var sheet = document.getElementById("a2hs-sheet");
  var gotit = document.getElementById("a2hs-gotit");
  var note = document.getElementById("a2hs-note");
  var steps = document.getElementById("a2hs-steps");
  if (!btn) return;

  var deferredPrompt = null;
  var ua = navigator.userAgent || "";
  var isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  if (isStandalone) {
    btn.hidden = true;
    return;
  }

  function openSheet(showPhoneNote) {
    if (!sheet) return;
    if (note) note.hidden = !showPhoneNote;
    if (steps) steps.hidden = !!showPhoneNote;
    sheet.hidden = false;
    document.documentElement.style.overflow = "hidden";
  }

  function closeSheet() {
    if (!sheet) return;
    sheet.hidden = true;
    document.documentElement.style.overflow = "";
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
  });

  window.addEventListener("appinstalled", function () {
    deferredPrompt = null;
    btn.hidden = true;
    closeSheet();
  });

  btn.addEventListener("click", function () {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () {
        deferredPrompt = null;
      });
      return;
    }
    if (isIOS) {
      openSheet(false);
      return;
    }
    // Desktop / non-installable browsers: same sheet with a short note
    openSheet(true);
  });

  if (gotit) gotit.addEventListener("click", closeSheet);
  if (sheet) {
    sheet.addEventListener("click", function (e) {
      if (e.target === sheet) closeSheet();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && sheet && !sheet.hidden) closeSheet();
  });

  // Minimal SW so Android Chrome can treat the site as installable
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function () {});
    });
  }
})();
