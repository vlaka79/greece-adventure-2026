var OWNER = "vlaka79";
var REPO = "greece-adventure-2026";
var PATH = "guestbook.json";

function json(status, body) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

function today() {
  var d = new Date();
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

function clean(s) {
  return String(s || "").replace(/\s+/g, " ").trim().slice(0, 800);
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*" } };
  }
  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "POST only" });
  }

  var token = process.env.GITHUB_TOKEN || process.env.GUESTBOOK_GITHUB_TOKEN;
  if (!token) return json(500, { ok: false, error: "Missing GITHUB_TOKEN" });

  var name = "";
  var message = "";
  var date = today();
  try {
    var raw = event.body || "";
    if (event.isBase64Encoded) raw = Buffer.from(raw, "base64").toString("utf8");
    var parsed;
    try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }
    if (parsed) {
      var data = (parsed.payload && parsed.payload.data) || parsed.data || parsed;
      name = clean(data.name);
      message = clean(data.message);
      if (parsed.payload && parsed.payload.created_at) date = String(parsed.payload.created_at).slice(0, 10);
    } else {
      var params = new URLSearchParams(raw);
      name = clean(params.get("name"));
      message = clean(params.get("message"));
    }
  } catch (e) {
    return json(400, { ok: false, error: "Bad body" });
  }

  if (!message) return json(400, { ok: false, error: "No message" });
  if (!name) name = "Friend";

  var headers = {
    Authorization: "Bearer " + token,
    Accept: "application/vnd.github+json",
    "User-Agent": "djboone-guestbook"
  };

  var getRes = await fetch(
    "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/" + PATH,
    { headers: headers }
  );
  if (!getRes.ok) return json(502, { ok: false, error: "Could not read guestbook" });
  var file = await getRes.json();
  var current = [];
  try {
    current = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
  } catch (e) {
    current = [];
  }
  if (!Array.isArray(current)) current = [];

  var exists = current.some(function (n) {
    return String(n.name || "").toLowerCase() === name.toLowerCase() &&
      String(n.message || "") === message;
  });
  if (!exists) {
    current.unshift({ name: name, date: date, message: message, reply: "" });
  }

  var encoded = Buffer.from(JSON.stringify(current, null, 2) + "\n").toString("base64");
  var putRes = await fetch(
    "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/" + PATH,
    {
      method: "PUT",
      headers: Object.assign({ "Content-Type": "application/json" }, headers),
      body: JSON.stringify({
        message: "Add guestbook note from " + name,
        content: encoded,
        sha: file.sha,
        branch: "main"
      })
    }
  );
  if (!putRes.ok) {
    var err = await putRes.text();
    return json(502, { ok: false, error: err.slice(0, 300) });
  }
  return json(200, { ok: true });
};
