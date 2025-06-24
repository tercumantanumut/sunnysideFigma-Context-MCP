# Installation Guide

This guide walks you through setting up the Figma Context MCP server from scratch.

## Prerequisites

### Required Software
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Figma Desktop App** - [Download here](https://www.figma.com/downloads/)
- **Git** - For cloning the repository

### Required Credentials
- **Figma API Key** - [Get one here](https://www.figma.com/developers/api#access-tokens)
  - Log into Figma
  - Go to Settings → Account → Personal Access Tokens
  - Generate new token with appropriate permissions

## Installation Steps

### 1. Clone Repository
```bash
git clone https://github.com/tercumantanumut/sunnysideFigma-Context-MCP
cd sunnysideFigma-Context-MCP
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build the Project
```bash
npm run build
```

### 4. Configure Environment
Create a `.env` file in the root directory:
```env
# Required
FIGMA_API_KEY=your_figma_api_key_here

# Optional
PORT=3333
OUTPUT_FORMAT=json
```

### 5. Verify Installation
Test the development server:
```bash
npm run dev
```

You should see:
```
CLI Building entry: src/cli.ts, src/index.ts
ESM Build success in 16ms
Configuration:
- FIGMA_API_KEY: ****DIC1 (source: env)
- PORT: 3333 (source: env)
[INFO] HTTP server listening on port 3333
[INFO] Plugin integration endpoints configured
[INFO] SSE endpoint available at http://localhost:3333/sse
```

Test the MCP CLI server (for AI agent integration):
```bash
npm run start:cli
```

## Figma Plugin Installation

### 1. Locate Plugin Files
The plugin files are in the `figma-dev-plugin/` directory:
- `manifest.json` - Plugin configuration
- `code.js` - Plugin logic
- `ui.html` - Plugin interface

### 2. Install in Figma Desktop
1. Open Figma Desktop App
2. Go to **Plugins** → **Development** → **Import plugin from manifest**
3. Navigate to your project directory
4. Select `figma-dev-plugin/manifest.json`
5. Click **Import**

### 3. Verify Plugin Installation
1. Open any Figma file
2. Go to **Plugins** → **Development** → **Figma Context MCP**
3. The plugin should open and show connection status

## AI Agent Configuration

### Augment Configuration

#### Configuration
Add to your Augment MCP configuration:
```json
{
  "mcpServers": {
    "Framelink Figma MCP": {
      "command": "node",
      "args": [
        "/Users/umuttan/Documents/MCPs/sunnysideFigma-Context-MCP-main/dist/cli.js",
        "--stdio"
      ],
      "env": {
        "FIGMA_API_KEY": "figd_YOUR_FIGMA_API_KEY_HERE"
      }
    }
  }
}
```

#### Alternative Configuration (using npm)
```json
{
  "mcpServers": {
    "Framelink Figma MCP": {
      "command": "npm",
      "args": ["run", "start:cli"],
      "cwd": "/Users/umuttan/Documents/MCPs/sunnysideFigma-Context-MCP-main",
      "env": {
        "FIGMA_API_KEY": "figd_YOUR_FIGMA_API_KEY_HERE"
      }
    }
  }
}
```

### Claude Desktop Configuration

#### Configuration
Add to your Claude Desktop configuration:
```json
{
  "mcpServers": {
    "figma-mcp": {
      "command": "node",
      "args": [
        "/Users/umuttan/Documents/MCPs/sunnysideFigma-Context-MCP-main/dist/cli.js",
        "--stdio"
      ],
      "env": {
        "FIGMA_API_KEY": "figd_YOUR_FIGMA_API_KEY_HERE"
      }
    }
  }
}
```

#### Alternative Configuration (using npm)
```json
{
  "mcpServers": {
    "figma-mcp": {
      "command": "npm",
      "args": ["run", "start:cli"],
      "cwd": "/Users/umuttan/Documents/MCPs/sunnysideFigma-Context-MCP-main",
      "env": {
        "FIGMA_API_KEY": "figd_YOUR_FIGMA_API_KEY_HERE"
      }
    }
  }
}
```

## Verification Checklist

- [ ] Node.js 18+ installed and working
- [ ] Repository cloned successfully
- [ ] Dependencies installed without errors
- [ ] Project builds successfully
- [ ] `.env` file created with valid API key
- [ ] HTTP server starts on port 3333
- [ ] MCP server responds to STDIO commands
- [ ] Figma plugin installed and shows "Connected"
- [ ] AI agent configuration added and working

## Next Steps

1. **Test Basic Workflow** - [Basic Workflows](examples/basic-workflows.md)
2. **Explore Tools** - [Tool Reference](tools/README.md)
3. **Configure Advanced Features** - [Configuration Guide](configuration.md)

## Troubleshooting

If you encounter issues during installation, see the [Troubleshooting Guide](troubleshooting.md) for common solutions.
