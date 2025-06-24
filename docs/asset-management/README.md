# Asset Management Tools

The Figma Context MCP server provides comprehensive asset management capabilities for extracting, optimizing, and organizing design assets from Figma files.

## Quick Start Guide

### Plugin Asset Extraction (NEW)
Extract assets directly from Figma using our Dev Mode plugin:

1. **Select any component, frame, or layer** in Figma
2. **Click "🎨 Extract Assets"** in the plugin
3. **Download individual or all assets** from the assets grid
4. **Send to MCP** for AI workflows with one click

### URL-Based Asset Access (RECOMMENDED)
For reliable image access, use Figma's "Copy link to selection" feature:

1. **Right-click any element** in Figma
2. **Select "Copy link to selection"**
3. **Use the URL directly** in MCP tools or AI workflows
4. **Images work perfectly** via URL method

> **Note:** Direct plugin extraction may have limitations with certain image types. For best results with images, use the "Copy link to selection" method from Figma's context menu.

## Available Tools

### Image Extraction

#### `download_figma_images`
Downloads SVG and PNG images from Figma files based on node IDs. Supports batch downloads with configurable export settings.

**Parameters:**
- `fileKey` (required) - Figma file key
- `nodes` (required) - Array of nodes to download
- `localPath` (required) - Local directory path for saving files
- `pngScale` (default: 2) - Export scale for PNG images
- `svgOptions` (optional) - SVG export configuration

**Node Object Structure:**
```javascript
{
  nodeId: "123:456",        // Figma node ID (format: 1234:5678)
  fileName: "icon.svg",     // Local filename
  imageRef: ""              // Required for image fills, empty for vectors
}
```

**SVG Options:**
```javascript
{
  includeId: false,         // Include IDs in SVG exports
  outlineText: true,        // Outline text in SVG exports
  simplifyStroke: true      // Simplify strokes in SVG exports
}
```

**Example:**
```javascript
download_figma_images({
  fileKey: "W8A0ZKTPi04qt97CGuYIwA",
  nodes: [
    { nodeId: "197:259", fileName: "button-background.png" },
    { nodeId: "197:260", fileName: "arrow-icon.svg" },
    { nodeId: "197:261", fileName: "logo.svg" }
  ],
  localPath: "/Users/project/assets",
  pngScale: 2,
  svgOptions: {
    includeId: false,
    outlineText: true,
    simplifyStroke: true
  }
})
```

**Output:**
```
Asset Download Complete

Downloaded 3 assets to /Users/project/assets:
✓ button-background.png (PNG, 2x scale)
✓ arrow-icon.svg (SVG, optimized)
✓ logo.svg (SVG, text outlined)

Total size: 45.2 KB
```

### Asset Information

#### `get_UI_Screenshots`
Provides detailed information about UI components and visual assets, including metadata and export options.

**Parameters:**
- `includeImageData` (default: false) - Include base64 image data

**Example:**
```javascript
get_UI_Screenshots({
  includeImageData: false
})
```

**Output:**
```
UI Component Information for: Button Component

Type: INSTANCE
Dimensions: 200x48
Children: 2 child elements

Layout Data:
{
  "x": 100,
  "y": 200,
  "width": 200,
  "height": 48,
  "padding": {
    "top": 12,
    "right": 24,
    "bottom": 12,
    "left": 24
  }
}

Asset Information:
• Background: Image fill (hash: abc123...)
• Icon: Vector shape
• Text: "Get Started" (Inter, 16px)

Export Options:
• PNG: Available at 1x, 2x, 3x
• SVG: Vector elements available
• PDF: Print-ready format available
```

## Asset Workflows

### Plugin-Based Workflow (NEW)
```javascript
// 1. In Figma: Select element → Click "🎨 Extract Assets" 
// 2. Download assets directly from plugin UI
// 3. Or click "🚀 Send to MCP" for AI workflows

// Assets are automatically available in MCP with localhost URLs:
// http://localhost:3333/plugin/assets/{nodeId}/{filename}
```

### URL-Based Workflow (RECOMMENDED FOR IMAGES)
```javascript
// 1. In Figma: Right-click → "Copy link to selection"
// 2. Use URL directly in tools:

get_figma_file_from_url({
  url: "https://www.figma.com/design/filekey?node-id=123-456"
})

// 3. Images will load properly via URL method
```

### API-Based Asset Extraction
```javascript
// 1. Get asset information
get_UI_Screenshots({ includeImageData: false })

// 2. Download specific assets
download_figma_images({
  fileKey: "your-file-key",
  nodes: [
    { nodeId: "123:456", fileName: "hero-image.png" },
    { nodeId: "123:457", fileName: "icon-set.svg" }
  ],
  localPath: "./assets"
})
```

### Batch Asset Processing
```javascript
// Download multiple asset types
download_figma_images({
  fileKey: "design-file-key",
  nodes: [
    // Icons (SVG)
    { nodeId: "100:1", fileName: "icons/home.svg" },
    { nodeId: "100:2", fileName: "icons/search.svg" },
    { nodeId: "100:3", fileName: "icons/profile.svg" },
    
    // Images (PNG)
    { nodeId: "200:1", fileName: "images/hero-bg.png" },
    { nodeId: "200:2", fileName: "images/feature-1.png" },
    
    // Logos (SVG)
    { nodeId: "300:1", fileName: "logos/brand-logo.svg" },
    { nodeId: "300:2", fileName: "logos/partner-logo.svg" }
  ],
  localPath: "./public/assets",
  pngScale: 2,
  svgOptions: {
    outlineText: true,
    simplifyStroke: true
  }
})
```

### Organized Asset Structure
```javascript
// Create organized folder structure
download_figma_images({
  fileKey: "design-system-file",
  nodes: [
    // Component assets
    { nodeId: "1:1", fileName: "components/button/background.png" },
    { nodeId: "1:2", fileName: "components/card/shadow.png" },
    
    // Icon library
    { nodeId: "2:1", fileName: "icons/ui/arrow-right.svg" },
    { nodeId: "2:2", fileName: "icons/ui/close.svg" },
    { nodeId: "2:3", fileName: "icons/social/twitter.svg" },
    
    // Brand assets
    { nodeId: "3:1", fileName: "brand/logo-primary.svg" },
    { nodeId: "3:2", fileName: "brand/logo-secondary.svg" },
    
    // Marketing assets
    { nodeId: "4:1", fileName: "marketing/hero-image.png" },
    { nodeId: "4:2", fileName: "marketing/feature-graphic.png" }
  ],
  localPath: "./src/assets"
})
```

## Asset Types and Formats

### Vector Assets (SVG)
**Best for:**
- Icons and simple graphics
- Logos and brand elements
- Scalable illustrations
- UI elements

**Export Options:**
- Include/exclude IDs
- Outline text for consistency
- Simplify strokes for smaller files

### Raster Assets (PNG)
**Best for:**
- Complex images and photos
- Detailed illustrations
- Screenshots and mockups
- Textured backgrounds

**Export Scales:**
- 1x - Standard resolution
- 2x - Retina/high-DPI displays
- 3x - Ultra-high resolution

### Supported Node Types
- **RECTANGLE** - Shape-based assets
- **ELLIPSE** - Circular assets
- **VECTOR** - Custom vector shapes
- **INSTANCE** - Component instances
- **FRAME** - Container elements
- **GROUP** - Grouped elements

## File Organization Best Practices

### Directory Structure
```
assets/
├── icons/
│   ├── ui/           # User interface icons
│   ├── social/       # Social media icons
│   └── brand/        # Brand-specific icons
├── images/
│   ├── backgrounds/  # Background images
│   ├── features/     # Feature graphics
│   └── marketing/    # Marketing assets
├── logos/
│   ├── primary/      # Primary brand logos
│   └── partners/     # Partner logos
└── components/
    ├── buttons/      # Button assets
    ├── cards/        # Card assets
    └── forms/        # Form assets
```

### Naming Conventions
- Use kebab-case for filenames
- Include size indicators when relevant
- Use descriptive, semantic names
- Group related assets with prefixes

**Examples:**
```
// Good naming
arrow-right.svg
hero-background-2x.png
logo-primary-dark.svg
button-primary-hover.png

// Avoid
ArrowRight.svg
bg.png
logo1.svg
btn.png
```

## Performance Optimization

### Plugin Asset Extraction
- **On-demand extraction**: Assets are only processed when you click "🎨 Extract Assets"
- **Optimized scales**: PNG exports at 1x and 2x (reduced from 3x for performance)
- **Single SVG variant**: Default SVG export only (faster processing)
- **No auto-extraction**: Selecting layers no longer triggers automatic asset processing

### URL-Based Method (BEST PERFORMANCE)
- **Instant access**: No processing delays
- **Reliable images**: Better compatibility with image content
- **Direct Figma serving**: Assets served directly by Figma's CDN
- **No local processing**: Reduced system load

### API-Based Optimization
- Enable `simplifyStroke` for smaller files
- Use `outlineText` for font consistency
- Remove unnecessary IDs with `includeId: false`
- Use appropriate scale factors (2x for most cases)
- Group similar assets in single requests

## Error Handling

### Common Issues

#### Plugin Asset Extraction
- **Images not working**: Use "Copy link to selection" method instead
- **Plugin freezing**: Assets are now extracted on-demand only
- **Large files**: Reduced to 2 PNG scales for better performance
- **Export failures**: Some node types may not support all export formats

#### URL-Based Method (RECOMMENDED)
- **Copy link not working**: Ensure you're right-clicking the correct element
- **Invalid URLs**: Check that the URL includes the node-id parameter
- **Permission errors**: Verify the Figma file is accessible

#### API-Based Method
- **Invalid Node ID**: Ensure node IDs are in correct format (123:456)
- **File Not Found**: Verify file key and node existence
- **Permission Denied**: Check Figma API key permissions
- **Path Not Found**: Ensure local directory exists or can be created

### Troubleshooting

#### Plugin Method
```javascript
// 1. Select element in Figma
// 2. Click "🎨 Extract Assets" button
// 3. Check browser console for errors
// 4. If images fail, try URL method instead
```

#### URL Method (BEST FOR IMAGES)
```javascript
// 1. Right-click element in Figma → "Copy link to selection"
// 2. Use URL directly in MCP tools:
get_figma_file_from_url({
  url: "https://www.figma.com/design/your-copied-link"
})
```

#### API Method
```javascript
// Test with single asset first
download_figma_images({
  fileKey: "test-file-key",
  nodes: [{ nodeId: "1:1", fileName: "test.svg" }],
  localPath: "./test-assets"
})
```

## Next Steps

- [Code Generation Tools](../code-generation/README.md) - Generate components using assets
- [Design System Tools](../design-system/README.md) - Manage asset tokens
- [Examples](../examples/asset-workflows.md) - Complete asset workflows
- [API Reference](../api/asset-api.md) - Technical specifications
