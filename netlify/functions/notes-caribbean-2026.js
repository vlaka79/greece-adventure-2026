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
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var pinned = [];
  try {
    var origin = process.env.URL || process.env.DEPLOY_PRIME_URL || "https://djbooneadventures.com";
    var pinRes = await fetch(origin + "/trips/caribbean-2026/notes.json", { cache: "no-store" });
    if (pinRes.ok) pinned = await pinRes.json();
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
        return f && f.name === "notes-caribbean-2026";
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

  function key(n) {
    return String(n.name || "").trim().toLowerCase() + "|" + String(n.message || "").trim().toLowerCase();
  }

  var seen = {};
  var out = [];
  function add(n) {
    if (!n || !n.message) return;
    var k = key(n);
    if (seen[k]) return;
    seen[k] = true;
    out.push({
      name: n.name || "Friend",
      date: n.date || "",
      message: n.message,
      reply: n.reply || ""
    });
  }

  live.forEach(add);
  (pinned || []).forEach(add);

  out.sort(function (a, b) {
    return String(b.date || "").localeCompare(String(a.date || ""));
  });

  return ok(out);
};
