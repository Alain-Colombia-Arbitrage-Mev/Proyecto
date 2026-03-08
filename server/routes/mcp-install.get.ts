/**
 * GET /mcp-install?client=cursor|windsurf|cline|vscode
 *
 * Redirect page that opens the MCP deep link for the selected client.
 * GitHub blocks custom URI schemes (cursor://, vscode:) in markdown,
 * so this page acts as an HTTPS intermediary.
 */
export default defineEventHandler((event) => {
  const query = getQuery(event)
  const client = (query.client as string || 'cursor').toLowerCase()
  const host = getRequestURL(event).origin
  const endpoint = `${host}/api/mcp`

  // Cursor deep link
  const cursorConfig = JSON.stringify({ url: endpoint, headers: { Authorization: 'Bearer ff_YOUR_TOKEN' } })
  const cursorB64 = Buffer.from(cursorConfig).toString('base64')
  const cursorUri = `cursor://anysphere.cursor-deeplink/mcp/install?name=focusflow&config=${cursorB64}`

  // Windsurf — no deep link, show instructions
  // Cline — no deep link, show instructions

  const deepLinks: Record<string, string | null> = {
    cursor: cursorUri,
    windsurf: null,
    cline: null,
  }

  const deepLink = deepLinks[client]
  const title = `Install FocusFlow MCP — ${client.charAt(0).toUpperCase() + client.slice(1)}`

  setResponseHeader(event, 'content-type', 'text/html; charset=utf-8')

  if (deepLink) {
    // Auto-redirect page for clients with deep links
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#e5e5e5;display:flex;align-items:center;justify-content:center;min-height:100vh}
    .card{max-width:480px;padding:48px;text-align:center}
    h1{font-size:24px;font-weight:700;margin-bottom:12px}
    p{color:#999;font-size:14px;line-height:1.6;margin-bottom:24px}
    .btn{display:inline-block;padding:12px 32px;background:#14b8a6;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px;transition:background .2s}
    .btn:hover{background:#0d9488}
    code{background:#1a1a2e;padding:2px 8px;border-radius:6px;font-size:12px;color:#5eead4}
    .fallback{margin-top:24px;font-size:12px;color:#666}
  </style>
</head>
<body>
  <div class="card">
    <h1>Opening ${client.charAt(0).toUpperCase() + client.slice(1)}...</h1>
    <p>FocusFlow MCP server is being installed. If nothing happened, click the button below.</p>
    <a href="${deepLink}" class="btn">Open in ${client.charAt(0).toUpperCase() + client.slice(1)}</a>
    <p class="fallback">After installing, replace <code>ff_YOUR_TOKEN</code> with your actual API token from <a href="${host}/integrations" style="color:#5eead4">Settings &gt; MCP/API</a>.</p>
  </div>
  <script>setTimeout(()=>{window.location.href="${deepLink}"},500)</script>
</body>
</html>`
  }

  // Fallback: show config to copy for clients without deep links
  const npxConfig = JSON.stringify({
    mcpServers: {
      focusflow: {
        command: 'npx',
        args: ['-y', 'mcp-remote', endpoint, '--header', 'Authorization:Bearer ff_YOUR_TOKEN'],
      },
    },
  }, null, 2)

  const fileMap: Record<string, string> = {
    windsurf: '~/.codeium/windsurf/mcp_config.json',
    cline: 'VS Code → Cline → MCP Servers',
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#e5e5e5;display:flex;align-items:center;justify-content:center;min-height:100vh}
    .card{max-width:560px;padding:48px;text-align:center}
    h1{font-size:24px;font-weight:700;margin-bottom:8px}
    .sub{color:#999;font-size:13px;margin-bottom:24px}
    pre{background:#111;border:1px solid #222;border-radius:12px;padding:16px;text-align:left;font-size:12px;line-height:1.6;overflow-x:auto;color:#5eead4;margin-bottom:16px;cursor:pointer;position:relative}
    pre:hover::after{content:'Click to copy';position:absolute;top:8px;right:12px;font-size:10px;color:#999;font-family:system-ui}
    .btn{display:inline-block;padding:10px 24px;background:#14b8a6;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:13px;border:none;cursor:pointer}
    .note{margin-top:20px;font-size:11px;color:#666}
    .note a{color:#5eead4}
  </style>
</head>
<body>
  <div class="card">
    <h1>Install FocusFlow MCP</h1>
    <p class="sub">Copy this config to <strong>${fileMap[client] || 'your MCP config'}</strong></p>
    <pre id="config" onclick="copy()">${npxConfig}</pre>
    <button class="btn" onclick="copy()">Copy to Clipboard</button>
    <p class="note">Replace <code style="background:#1a1a2e;padding:2px 6px;border-radius:4px;font-size:11px">ff_YOUR_TOKEN</code> with your token from <a href="${host}/integrations">Settings &gt; MCP/API</a></p>
  </div>
  <script>
    function copy(){
      navigator.clipboard.writeText(document.getElementById('config').textContent);
      document.querySelector('.btn').textContent='Copied!';
      setTimeout(()=>document.querySelector('.btn').textContent='Copy to Clipboard',2000);
    }
  </script>
</body>
</html>`
})
