# Facebook Marketplace MCP Server

This repo ships a project-scoped MCP server config in [`.mcp.json`](../.mcp.json)
for [`jdcodes1/facebook-marketplace-mcp`](https://github.com/jdcodes1/facebook-marketplace-mcp).

The server is a Node.js project that has to be cloned and built locally — its
`bin` points at a compiled `dist/index.js` and there is no `prepare` script, so
it cannot be run straight from `npx`.

## Prerequisites

- macOS (cookie extraction uses the Keychain)
- Google Chrome with an active Facebook login
- Node.js 20+

## One-time setup

Clone and build the server. By default `.mcp.json` looks for it at
`~/facebook-marketplace-mcp`:

```bash
git clone https://github.com/jdcodes1/facebook-marketplace-mcp.git ~/facebook-marketplace-mcp
cd ~/facebook-marketplace-mcp
npm install
npm run build
```

If you cloned it somewhere else, point the config at it by exporting
`FB_MARKETPLACE_MCP_DIR` before starting Claude Code:

```bash
export FB_MARKETPLACE_MCP_DIR=/path/to/facebook-marketplace-mcp
```

## Configuration

The server is defined in `.mcp.json`:

```json
{
  "mcpServers": {
    "facebook-marketplace": {
      "command": "node",
      "args": ["${FB_MARKETPLACE_MCP_DIR:-${HOME}/facebook-marketplace-mcp}/dist/index.js"],
      "env": {
        "CHROME_PROFILE": "Default"
      }
    }
  }
}
```

| Env var | Default | Purpose |
|---------|---------|---------|
| `CHROME_PROFILE` | `Default` | Chrome profile directory name to read cookies from |
| `FB_MARKETPLACE_MCP_DIR` | `~/facebook-marketplace-mcp` | Location of the built server |

Claude Code discovers `.mcp.json` at the repo root automatically. Run
`claude mcp list` (or approve the project server when prompted) to confirm it is
picked up.
