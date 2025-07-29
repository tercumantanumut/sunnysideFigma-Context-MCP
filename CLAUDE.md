# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

```bash
# Development
npm run dev          # Watch mode with auto-restart
npm run dev:cli      # Watch mode for CLI/stdio

# Building & Type Checking
npm run build        # Production build with types
npm run type-check   # TypeScript validation only

# Testing
npm run test         # Run Jest tests

# Code Quality
npm run lint         # ESLint checking
npm run format       # Prettier formatting

# Running the Server
npm run start        # Start in default mode
npm run start:cli    # Start in stdio mode (for AI agents)
npm run start:http   # Start in HTTP server mode (port 3333)
```

## Project Architecture

This is a Model Context Protocol (MCP) server that bridges Figma designs with AI agents, enabling natural language code generation from Figma designs.

### Core Architecture Concepts

1. **Multi-Mode Operation**: The server can run in stdio mode (for AI agents) or HTTP mode (for the Figma plugin)
   - Entry point: `src/cli.ts` determines mode and initializes appropriate server
   - MCP server: `src/mcp.ts` registers all tools and handles requests
   - HTTP server: `src/server.ts` wraps MCP in Express for plugin communication

2. **Tool System**: All functionality is exposed through MCP tools
   - Tools are defined in `src/tools/` and registered in `src/mcp.ts`
   - Each tool has input/output schemas defined with Zod
   - Tools handle specific operations: code generation, asset extraction, design tokens

3. **Code Generation Pipeline**:
   - Figma API → Node data → Transformers → Generated code
   - Transformers in `src/transformers/` handle different output formats
   - Component generator supports React/Vue with various styling options
   - Style transformers handle CSS modules, inline styles, Tailwind

4. **Authentication Flow**:
   - Supports both Personal Access Token and OAuth Bearer tokens
   - Token passed via `X-Figma-Token` header
   - Figma service (`src/services/figma.ts`) handles all API interactions

5. **Plugin Integration**:
   - Figma plugin in `figma-dev-plugin/` communicates with HTTP server
   - Plugin sends selections/commands → Server processes → Returns generated code
   - Uses localhost:3333 for development

### Key Design Patterns

- **Modular Tool Registration**: Each tool is self-contained with its own schema and handler
- **Unified Error Handling**: All errors bubble up through MCP protocol with proper error codes
- **Type Safety**: Extensive use of TypeScript and Zod for runtime validation
- **Multi-Format Output**: Tools can return YAML or JSON based on request parameters
- **Retry Logic**: Built-in retry mechanism for Figma API calls with exponential backoff

### Development Notes

- TypeScript uses ES2022 target with NodeNext module resolution
- Path alias `~/` maps to `./src/` directory
- Tests require `FIGMA_API_KEY` and `FIGMA_FILE_KEY` environment variables
- Use pnpm v10.10.0 for dependency management
- ESM output via tsup build configuration