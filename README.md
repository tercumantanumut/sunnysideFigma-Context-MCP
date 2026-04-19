[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/tercumantanumut-sunnysidefigma-context-mcp-badge.png)](https://mseep.ai/app/tercumantanumut-sunnysidefigma-context-mcp)

# Sunnyside Figma MCP

A Model Context Protocol (MCP) server that turns Figma designs into production code. It ships with a companion Figma plugin so LLM clients can read the layer you're actually looking at, extract pixel-perfect CSS and design tokens, and generate React / Tailwind / styled-components output — all from a natural-language prompt.

Two data paths are supported:

- **Plugin bridge** — highest fidelity. Uses Figma's native `getCSSAsync()` from inside the editor. Works on any plan, even Drafts.
- **Figma REST API** — works headless from a `fileKey` / `nodeId` for designs that live in a team/project you can reach with a Personal Access Token.

---

## Quick Start

Requirements: Node 18+, a Figma Personal Access Token ([create one here](https://www.figma.com/developers/api#access-tokens)).

```bash
git clone https://github.com/tercumantanumut/sunnysideFigma-Context-MCP
cd sunnysideFigma-Context-MCP
npm install
npm run build
```

Create a `.env`:

```env
FIGMA_API_KEY=figd_your_token_here
PORT=3333
OUTPUT_FORMAT=json
```

Run the HTTP/SSE server:

```bash
npm start
# → http://localhost:3333
#   SSE:              /sse
#   Streamable HTTP:  /mcp
```

Install the Figma plugin (one time):

1. Open Figma Desktop → **Plugins → Development → Import plugin from manifest…**
2. Pick `figma-dev-plugin/manifest.json` from this repo.
3. Run the plugin on any file. Select a frame → click **Extract Dev Code**.

You'll see **"Data sent to MCP server successfully"** when the bridge is live.

---

## Connect an MCP Client

Pick **one** transport. Both expose the same 27 tools against the same running server.

### stdio (client spawns the process)

Use this if you want the client to own the lifecycle and don't need the Figma plugin bridge to share state with the MCP process.

```json
{
  "mcpServers": {
    "sunnyside-figma": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/absolute/path/to/sunnysideFigma-Context-MCP/dist/cli.js",
        "--stdio"
      ],
      "env": {
        "FIGMA_API_KEY": "figd_your_token_here"
      }
    }
  }
}
```

### SSE (recommended when using the Figma plugin)

The plugin posts extractions to `http://localhost:3333/plugin/*`. Point your MCP client at the same process so both share the extraction buffer.

```json
{
  "mcpServers": {
    "sunnyside-figma": {
      "type": "sse",
      "url": "http://localhost:3333/sse"
    }
  }
}
```

### Streamable HTTP

```json
{
  "mcpServers": {
    "sunnyside-figma": {
      "type": "http",
      "url": "http://localhost:3333/mcp"
    }
  }
}
```

---

## Tool Reference (27 tools)

### Plugin-bridge tools — use these first

These read the buffer filled by the Figma plugin. Fastest, highest fidelity, no API limits.

| Tool | Returns |
|---|---|
| `get_figma_dev_history` | List of past extractions (name, id, layout) |
| `get_Basic_CSS` | Root element CSS via `getCSSAsync()` |
| `get_All_Layers_CSS` | CSS for every layer in the selection |
| `get_JSON` | Structured: id, fills, variables, design tokens, `allLayersCSS` — **the highest-signal single call** |
| `get_react_component` | TypeScript React + CSS module |
| `get_tailwind_component` | React + Tailwind classes (arbitrary values) |
| `get_styled_component` | React + styled-components |
| `get_plugin_project_overview` | Summary of the full scanned project (requires **Scan Entire Project** in the plugin) |
| `analyze_app_structure` | Architectural breakdown of a scanned project |

### Figma REST API tools

Require `FIGMA_API_KEY` + a file the token can see. **Do not work on Drafts** — move files to a team/project first.

| Tool | Use |
|---|---|
| `get_figma_data` | Raw file or node JSON |
| `get_figma_page_structure` | Page-level tree for orientation |
| `get_figma_project_overview` | Team/project-level summary |
| `analyze_figma_components` | Component detection across a file |
| `download_figma_images` | Batch SVG/PNG export to disk |

### Design token lifecycle

Token registry + what-if simulation for design-system changes.

| Tool | Use |
|---|---|
| `extract_design_tokens` | Build a token catalog from current selection |
| `build_dependency_graph` | Map which layers consume which tokens |
| `debug_token_registry` | Inspect the current registry state |
| `track_design_system_health` | Coverage / conflict report |
| `simulate_token_change` | Dry-run a rename/value change |
| `analyze_token_change_impact` | Blast-radius report for a proposed change |
| `apply_token_change` | Commit a simulated change |
| `rollback_token_change` | Revert an applied change |
| `list_token_simulations` | List staged simulations |
| `generate_migration_code` | Produce codemod-style output for the change |

### Figma Dev Mode (official) — Professional plan only

Bridges to Figma's official Dev Mode MCP Server on `localhost:3845`. Requires a Figma Professional plan with Dev Mode enabled in the desktop app.

| Tool | Use |
|---|---|
| `check_figma_dev_connection` | Probe the Dev Mode server |
| `get_figma_dev_mode_code` | React + Tailwind from Figma's own generator |

### Utility

| Tool | Use |
|---|---|
| `generate_codegen_plugin` | Scaffold a new Figma Dev Mode codegen plugin |

---

## Typical Workflows

**Generate a component from a selection**
1. In Figma, select the frame.
2. In the plugin, click **Extract Dev Code**.
3. Ask your agent: _"Generate a React + Tailwind component from the latest extraction."_ → calls `get_tailwind_component`.

**Audit a design system**
1. Click **Scan Entire Project** in the plugin.
2. Ask: _"Summarize this project's design tokens and flag conflicts."_ → calls `get_plugin_project_overview` + `extract_design_tokens` + `track_design_system_health`.

**Propose a token change safely**
1. `simulate_token_change` → `analyze_token_change_impact` → review.
2. `apply_token_change` if safe, `rollback_token_change` to undo.
3. `generate_migration_code` to produce the code migration.

**Headless export**
- Give your agent a Figma URL (Copy link to selection). It parses `fileKey` + `nodeId` and calls `get_figma_data` / `download_figma_images`.

---

## Architecture

```
┌───────────────────┐     POST /plugin/*     ┌──────────────────────┐
│  Figma Plugin     │ ─────────────────────▶ │                      │
│  (figma-dev-plugin)                        │  HTTP server :3333   │
└───────────────────┘                        │  ├─ /sse   (MCP SSE) │
                                             │  ├─ /mcp   (MCP HTTP)│
┌───────────────────┐   MCP (SSE / HTTP /    │  └─ extraction cache │
│  MCP client       │   stdio)               │                      │
│  (Claude, Selene, │ ◀──────────────────────│                      │
│   Cursor, etc.)   │                        └──────────────────────┘
└───────────────────┘                                   │
                                                        │ optional
                                                        ▼
                                            ┌──────────────────────┐
                                            │  Figma REST API      │
                                            │  Figma Dev Mode :3845│
                                            └──────────────────────┘
```

- The HTTP server and MCP endpoints live in the **same Node process**, so the plugin's extraction buffer and the MCP tools share memory. That's why SSE is the recommended transport when the plugin is in play.
- stdio mode spawns a fresh process per client — it **won't** see plugin extractions from a separate running server. Use SSE/HTTP if you need that shared state.

---

## Troubleshooting

**"No extracted data available"** — re-open the plugin and click **Extract Dev Code**. If the client is stdio, switch to SSE so it shares state with the plugin server.

**Figma REST tools time out / 404** — the file is likely in Drafts. Move it to a team/project, or use the plugin path.

**`check_figma_dev_connection` fails** — requires Figma Professional + Dev Mode MCP Server enabled in Figma Desktop (Preferences → Enable local MCP Server). Free plan users should stick to the plugin tools.

**Server won't start on :3333** — another process is bound. Change `PORT` in `.env` and update your MCP client URL accordingly.

**Session errors hitting `/mcp` directly with curl** — the Streamable HTTP transport requires initializing a session (`initialize` → `notifications/initialized`) before `tools/list`. MCP clients handle this automatically.

---

## Development

```bash
npm run dev          # tsup watch build
npm run dev:cli      # stdio dev loop
npm run type-check   # tsc --noEmit
npm run lint
npm test             # jest
npm run inspect      # open @modelcontextprotocol/inspector
```

Project layout:

```
src/
├─ cli.ts                    # entrypoint (HTTP + stdio)
├─ mcp.ts                    # tool registration
├─ server.ts                 # Express + MCP transport wiring
├─ tools/
│  ├─ plugin-tools.ts        # plugin-bridge tools
│  ├─ figma-codegen-tools.ts # React / Tailwind / styled-components
│  ├─ figma-dev-tools.ts     # official Dev Mode bridge
│  ├─ design-system-tools.ts # token lifecycle
│  └─ figma-api-tools.ts     # REST API
└─ services/
   └─ plugin-integration.ts  # /plugin/* endpoints + extraction cache

figma-dev-plugin/            # companion Figma plugin (manifest + UI + code)
```

---

## Contributing

PRs welcome. Run `npm run lint && npm test && npm run build` before opening. Keep the tool surface lean — if you add a new tool, audit for overlap with an existing one.

## License

See [LICENSE](LICENSE). Built on concepts from Framelink MCP but substantially different; proprietary with specific terms. Commercial inquiries: **Umut TAN — tercumantanumut@gmail.com**.
