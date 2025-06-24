# Tool Reference

The Sunnyside Figma MCP server provides 30+ specialized tools for design-to-code workflows. This reference covers all available tools organized by category.

## 🆕 Recent Updates

- **✅ Enhanced Design System Tools** - Advanced conflict detection and multi-format health reports
- **✅ Improved File Scanning** - Now successfully scans 5+ files vs 0 before
- **✅ Fixed TokenId Consistency** - Resolved naming conflicts across all tools
- **✅ Production Testing** - Comprehensive test suite with realistic scenarios

## Tool Categories

### [Code Generation Tools](../code-generation/README.md)
Tools for generating production-ready code from Figma designs.

| Tool | Description | Output |
|------|-------------|--------|
| `get_react_component` | Clean TypeScript React components | TSX with interfaces |
| `get_tailwind_component` | Smart Tailwind class conversion | React + Tailwind |
| `get_styled_component` | Modern styled-components | CSS-in-JS |
| `get_figma_css` | Native Figma CSS extraction | Clean CSS |
| `get_Basic_CSS` | Simple CSS for containers | Basic styling |
| `get_All_Layers_CSS` | Comprehensive layer CSS | Complete styling |
| `generate_component_from_figma` | Advanced component generation | Multiple formats |
| `generate_codegen_plugin` | Custom Figma plugins | Complete plugin |

### [Design System Tools](../design-system/README.md) *(Enhanced)*
Advanced tools for managing design system evolution, conflict detection, and token tracking.

| Tool | Description | Output | Status |
|------|-------------|--------|--------|
| `extract_design_tokens` | Token cataloging and mapping | Token registry | ✅ Enhanced |
| `build_dependency_graph` | Codebase impact analysis | Dependency map | ✅ Fixed |
| `analyze_token_change_impact` | AI-powered change analysis | Impact report | ✅ Fixed |
| `generate_migration_code` | Automated migration generation | Migration scripts | ✅ Working |
| `track_design_system_health` | System health monitoring | Health report | ✅ Enhanced |
| `simulate_token_change` | Safe change simulation | Preview results | ✅ Working |
| `debug_token_registry` | Debug token registry contents | Registry info | ✅ Working |
| `list_token_simulations` | List active simulations | Simulation list | ✅ Working |

### [Asset Management Tools](../asset-management/README.md)
Tools for extracting and managing design assets.

| Tool | Description | Output |
|------|-------------|--------|
| `download_figma_images` | Batch SVG/PNG extraction | Image files |
| `get_UI_Screenshots` | Visual asset information | Asset metadata |

### [Data & Analysis Tools](data-analysis.md)
Tools for accessing raw design data and analysis.

| Tool | Description | Output |
|------|-------------|--------|
| `get_JSON` | Complete layout and styling data | JSON structure |
| `get_figma_data` | Complete file structure access | File data |
| `get_figma_dev_history` | Change tracking timeline | History log |

### [Integration Tools](integration.md)
Tools for connecting with Figma services and external systems.

| Tool | Description | Output |
|------|-------------|--------|
| `get_figma_dev_code` | Latest extracted code | CSS/React/JSON |
| `get_figma_dev_mode_code` | Official Dev Mode integration | React + Tailwind |
| `check_figma_dev_connection` | Connection health monitoring | Status report |

## Tool Usage Patterns

### Basic Extraction Workflow
```javascript
// 1. Extract latest design data
get_figma_dev_code({ format: "both" })

// 2. Generate specific component type
get_react_component({ 
  componentName: "Button",
  includeProps: true,
  styleType: "css-modules"
})

// 3. Get comprehensive styling
get_All_Layers_CSS({ formatted: true })
```

### Design System Workflow
```javascript
// 1. Extract design tokens
extract_design_tokens({
  includeVariables: true,
  includeStyles: true,
  scanDepth: 3
})

// 2. Build dependency graph
build_dependency_graph({
  codebasePath: "./src",
  filePatterns: ["**/*.{ts,tsx,js,jsx,css}"]
})

// 3. Analyze token changes
analyze_token_change_impact({
  tokenId: "color-primary-500",
  newValue: "#2563EB",
  generateMigration: true
})
```

### Asset Extraction Workflow
```javascript
// 1. Get asset information
get_UI_Screenshots({ includeImageData: false })

// 2. Download specific assets
download_figma_images({
  fileKey: "your-file-key",
  nodes: [
    { nodeId: "123:456", fileName: "icon.svg" },
    { nodeId: "123:457", fileName: "background.png" }
  ],
  localPath: "./assets"
})
```

## Tool Parameters

### Common Parameters
Most tools accept these common parameters:

- `nodeId` (optional) - Specific Figma node ID
- `fileKey` (optional) - Figma file key for API access
- `format` - Output format (varies by tool)
- `includeChildren` - Whether to include child elements

### Tool-Specific Parameters
Each tool has specific parameters documented in its individual reference page.

## Error Handling

All tools return structured responses with error information:

```javascript
// Success response
{
  success: true,
  data: { /* tool output */ }
}

// Error response
{
  success: false,
  error: "Error description",
  details: { /* additional error info */ }
}
```

## Next Steps

- [Code Generation Tools](../code-generation/README.md) - Generate React, CSS, and more
- [Design System Tools](../design-system/README.md) - Manage design tokens and evolution
- [Examples](../examples/README.md) - See tools in action
- [API Reference](../api/README.md) - Technical specifications
