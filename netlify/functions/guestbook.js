exports.handler = async function () {
  var headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store"
  };

  function ok(body) {
    return { statusCode: 200, headers: headers, body: JSON.stringify(body) };
  }

  function escape(s) {
    return String(s || "")
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var pinned = [];
  var replies = {};
  try {
    var origin = process.env.URL || process.env.DEPLOY_PRIME_URL || "https://djbooneadventures.com";
    var pinRes = await fetch(origin + "/guestbook.json", { cache: "no-store" });
    if (pinRes.ok) pinned = await pinRes.json();
  } catch (e) {}
  try {
    var origin2 = process.env.URL || process.env.DEPLOY_PRIME_URL || "https://djbooneadventures.com";
    var rRes = await fetch(origin2 + "/guestbook-replies.json", { cache: "no-store" });
    if (rRes.ok) replies = await rRes.json();
  } catch (e) {}

  var live = [];
  var token = process.env.NETLIFY_API_TOKEN || process.env.GUESTBOOK_TOKEN;
  var siteId = process.env.SITE_ID;
  if (token && siteId) {
    try {
      var formsRes = await fetch("https://api.netlify.com/api/v1/sites/" + siteId + "/forms", {
        headers: { Authorization: "Bearer " + token }
      });
      var forms = formsRes.ok ? await formsRes.json() : [];
      var form = (forms || []).find(function (f) {
        return f && (f.name === "guestbook" || f.name === "notes");
      });
      if (form && form.id) {
        var subRes = await fetch("https://api.netlify.com/api/v1/forms/" + form.id + "/submissions", {
          headers: { Authorization: "Bearer " + token }
        });
        var rows = subRes.ok ? await subRes.json() : [];
        live = (rows || []).map(function (row) {
          var d = (row && row.data) || {};
          var created = (row && row.created_at) ? String(row.created_at).slice(0, 10) : "";
          return {
            name: escape(d.name || "Friend"),
            date: created,
            message: escape(d.message || ""),
            id: row.id || ""
          };
        }).filter(function (n) { return n.message; });
      }
    } catch (e) {}
  }

  function isSpam(n) {
    var blob = (String(n && n.name || "") + " " + String(n && n.message || "")).toLowerCase();
    if (!blob.trim()) return true;
    var hits = [
      "organic traffic", "seo consultant", "site audit", "keyword targeting",
      "monthly reports", "free audit", "santiag mkt", "backlink", "link building"
    ];
    for (var i = 0; i < hits.length; i++) {
      if (blob.indexOf(hits[i]) >= 0) return true;
    }
    return false;
  }

    function decodeEntities(s) {
    return String(s || "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");
  }

  function norm(s) {
    return decodeEntities(s).replace(/\s+/g, " ").trim().toLowerCase();
  }

  function key(n) {
    return norm(n.name) + "|" + norm(n.message);
  }

  var seen = {};
  var out = [];
  function add(n, fromLive) {
    if (!n || !n.message) return;
    if (isSpam(n)) return;
    var k = key(n);
    if (seen[k]) {
      // Prefer pinned reply / richer fields if live already added a shell
      var prev = seen[k];
      if (typeof prev === "object" && prev.index >= 0) {
        var cur = out[prev.index];
        if (cur && !cur.reply && (n.reply || replies[n.id] || replies[k])) {
          cur.reply = n.reply || replies[n.id] || replies[k] || "";
          if (!fromLive) delete cur.live;
        }
      }
      return;
    }
    var item = {
      name: decodeEntities(n.name || "Friend"),
      date: n.date || "",
      message: fromLive ? n.message : (n.message || ""),
      reply: n.reply || replies[n.id] || replies[k] || ""
    };
    // Display pinned message unescaped; live already escaped for safety — decode for display consistency
    if (fromLive) item.message = decodeEntities(n.message);
    if (fromLive) item.live = true;
    seen[k] = { index: out.length };
    out.push(item);
  }

  // Pinned first so replies win; live fills gaps
  (pinned || []).forEach(function (n) { add(n, false); });
  live.forEach(function (n) { add(n, true); });

  out.sort(function (a, b) {
    return String(b.date || "").localeCompare(String(a.date || ""));
  });

  return ok(out);
};
