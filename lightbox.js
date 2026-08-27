(function () {
  var lb = document.getElementById("lb");
  if (!lb) return;
  var lbImg = document.getElementById("lb-img");
  var lbCaption = document.getElementById("lb-caption");
  var lbCount = document.getElementById("lb-count");
  var lbPrev = document.getElementById("lb-prev");
  var lbNext = document.getElementById("lb-next");
  var lbClose = document.getElementById("lb-close");
  var lbItems = [];
  var lbIndex = 0;
  var startX = 0;
  var startY = 0;
  var tracking = false;

  function renderLightbox() {
    if (!lbImg || !lbItems.length) return;
    var item = lbItems[lbIndex];
    lbImg.src = item.src;
    lbImg.alt = item.caption || "";
    if (lbCaption) lbCaption.textContent = item.caption || "";
    if (lbCount) lbCount.textContent = lbItems.length > 1 ? (lbIndex + 1) + " / " + lbItems.length : "";
    var many = lbItems.length > 1;
    if (lbPrev) lbPrev.hidden = !many;
    if (lbNext) lbNext.hidden = !many;
    lb.classList.remove("hidden");
    lb.classList.add("flex");
    lb.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
  }

  function openLightbox(items, start) {
    lbItems = (items || []).filter(function (it) { return it && it.src; });
    if (!lbItems.length) return;
    lbIndex = Math.max(0, Math.min(start || 0, lbItems.length - 1));
    renderLightbox();
  }

  function closeLightbox() {
    lb.classList.add("hidden");
    lb.classList.remove("flex");
    document.body.style.overflow = "";
    tracking = false;
  }

  function stepLightbox(dir) {
    if (lbItems.length < 2) return;
    lbIndex = (lbIndex + dir + lbItems.length) % lbItems.length;
    renderLightbox();
  }

  window.__openLb = openLightbox;

  if (lbClose) lbClose.addEventListener("click", function (e) { e.stopPropagation(); closeLightbox(); });
  if (lbPrev) lbPrev.addEventListener("click", function (e) { e.stopPropagation(); stepLightbox(-1); });
  if (lbNext) lbNext.addEventListener("click", function (e) { e.stopPropagation(); stepLightbox(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });
  document.addEventListener("keydown", function (e) {
    if (lb.classList.contains("hidden")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") stepLightbox(-1);
    if (e.key === "ArrowRight") stepLightbox(1);
  });

  function onDown(x, y) {
    startX = x;
    startY = y;
    tracking = true;
  }
  function onUp(x, y) {
    if (!tracking) return;
    tracking = false;
    var dx = x - startX;
    var dy = y - startY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      stepLightbox(dx < 0 ? 1 : -1);
    }
  }
  lb.addEventListener("touchstart", function (e) {
    if (e.touches.length !== 1) return;
    onDown(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    var t = e.changedTouches[0];
    if (t) onUp(t.clientX, t.clientY);
  }, { passive: true });
  lb.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "touch") return;
    if (e.target.closest && e.target.closest("button")) return;
    onDown(e.clientX, e.clientY);
  });
  lb.addEventListener("pointerup", function (e) {
    if (e.pointerType === "touch") return;
    onUp(e.clientX, e.clientY);
  });
})();
