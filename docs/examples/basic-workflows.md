# Basic Workflows

This guide covers the most common workflows for using the Figma Context MCP server.

## Workflow 1: Extract and Generate React Component

### Objective
Extract a button component from Figma and generate a React component with TypeScript.

### Steps

#### 1. Prepare in Figma
- Open your Figma file
- Select the button component you want to extract
- Ensure the component has proper naming

#### 2. Extract Design Data
- Run the "Figma Context MCP" plugin
- Click "Extract Dev Code"
- Verify the plugin shows "Connected" status

#### 3. Generate React Component
Use your AI agent with this prompt:
```
"Generate a React component from the extracted button with TypeScript interfaces and CSS modules"
```

The AI agent will execute:
```javascript
// Get the extracted design data
get_figma_dev_code({ format: "both" })

// Generate React component
get_react_component({
  componentName: "PrimaryButton",
  includeProps: true,
  styleType: "css-modules"
})
```

#### 4. Expected Output
```typescript
import React from 'react';
import styles from './PrimaryButton.module.css';

interface PrimaryButtonProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ 
  className, 
  style, 
  children 
}) => {
  return (
    <div className={`${styles.primarybutton} ${className || ''}`} style={style}>
      {children}
    </div>
  );
};

export default PrimaryButton;

/* PrimaryButton.module.css */
.primarybutton {
  width: 200px;
  height: 48px;
  background: #3b82f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 500;
}
```

## Workflow 2: Generate Tailwind Component

### Objective
Create a Tailwind CSS component with responsive breakpoints.

### Steps

#### 1. Extract Design Data
Follow the same extraction process as Workflow 1.

#### 2. Generate Tailwind Component
AI agent prompt:
```
"Create a Tailwind component with responsive breakpoints from the extracted design"
```

AI agent executes:
```javascript
get_tailwind_component({
  componentName: "ResponsiveCard",
  responsiveBreakpoints: true,
  useDesignTokens: true
})
```

#### 3. Expected Output
```jsx
import React from 'react';

interface ResponsivecardProps {
  className?: string;
  children?: React.ReactNode;
}

const Responsivecard: React.FC<ResponsivecardProps> = ({ 
  className, 
  children 
}) => {
  return (
    <div className={`w-full md:w-[400px] lg:w-[500px] p-6 bg-white rounded-lg shadow-lg ${className || ''}`}>
      {children}
    </div>
  );
};

export default Responsivecard;
```

## Workflow 3: Extract and Download Assets

### Objective
Download icons and images from a Figma design system.

### Steps

#### 1. Identify Assets in Figma
- Open your design system file
- Note the node IDs of icons and images you want to download
- You can find node IDs in the Figma URL or by selecting elements

#### 2. Get Asset Information
AI agent prompt:
```
"Show me information about the UI assets in the current selection"
```

AI agent executes:
```javascript
get_UI_Screenshots({ includeImageData: false })
```

#### 3. Download Assets
AI agent prompt:
```
"Download the icon set as SVG files to my assets folder"
```

AI agent executes:
```javascript
download_figma_images({
  fileKey: "your-figma-file-key",
  nodes: [
    { nodeId: "100:1", fileName: "icons/home.svg" },
    { nodeId: "100:2", fileName: "icons/search.svg" },
    { nodeId: "100:3", fileName: "icons/user.svg" },
    { nodeId: "100:4", fileName: "icons/settings.svg" }
  ],
  localPath: "./src/assets",
  svgOptions: {
    outlineText: true,
    simplifyStroke: true
  }
})
```

#### 4. Expected Result
```
Asset Download Complete

Downloaded 4 assets to ./src/assets:
✓ icons/home.svg (SVG, 2.1 KB)
✓ icons/search.svg (SVG, 1.8 KB)
✓ icons/user.svg (SVG, 2.3 KB)
✓ icons/settings.svg (SVG, 2.7 KB)

Total size: 8.9 KB
```

## Workflow 4: Extract Design Tokens

### Objective
Extract and catalog design tokens from a Figma design system.

### Steps

#### 1. Select Design System Components
- Open your design system file
- Select components that contain design tokens
- Include color swatches, typography samples, spacing examples

#### 2. Extract Tokens
AI agent prompt:
```
"Extract all design tokens from the selected components including colors, spacing, and typography"
```

AI agent executes:
```javascript
extract_design_tokens({
  includeVariables: true,
  includeStyles: true,
  scanDepth: 5
})
```

#### 3. Expected Output
```
Design Token Extraction Complete

Found 15 design tokens: 6 color tokens, 4 spacing tokens, 3 typography tokens, 2 shadow tokens

Extracted Tokens:
• Primary Blue (color): #3b82f6
• Secondary Gray (color): #6b7280
• Success Green (color): #10b981
• Warning Yellow (color): #f59e0b
• Error Red (color): #ef4444
• Text Dark (color): #1f2937

• Spacing XS (spacing): 4px
• Spacing SM (spacing): 8px
• Spacing MD (spacing): 16px
• Spacing LG (spacing): 24px

• Heading Large (typography): Inter, 32px, 700
• Body Regular (typography): Inter, 16px, 400
• Caption Small (typography): Inter, 14px, 400

• Card Shadow (shadow): 0px 4px 12px rgba(0,0,0,0.1)
• Button Shadow (shadow): 0px 2px 4px rgba(0,0,0,0.2)

15 tokens added to registry
```

## Workflow 5: Generate Multiple Component Formats

### Objective
Generate the same component in different styling approaches.

### Steps

#### 1. Extract Design Data
Follow the standard extraction process.

#### 2. Generate Multiple Formats
AI agent prompt:
```
"Generate the extracted component in CSS Modules, Tailwind, and styled-components formats"
```

AI agent executes:
```javascript
// CSS Modules version
get_react_component({
  componentName: "Button",
  styleType: "css-modules"
})

// Tailwind version
get_tailwind_component({
  componentName: "Button",
  responsiveBreakpoints: false
})

// Styled Components version
get_styled_component({
  componentName: "Button",
  useTheme: true
})
```

#### 3. Compare Outputs
You'll receive three different implementations of the same component, allowing you to choose the best approach for your project.

## Common Tips

### Before Starting
- Ensure Figma plugin is installed and connected
- Verify server is running on port 3333
- Have your Figma API key configured
- Select appropriate elements in Figma

### Best Practices
- Use semantic component names
- Organize assets in logical folder structures
- Extract design tokens early in the process
- Test generated components before integration

### Troubleshooting
- If no data is extracted, ensure an element is selected in Figma
- If plugin shows "Disconnected", check server status
- If tools return errors, verify API key and server configuration

## Next Steps

- [Advanced Examples](advanced-examples.md) - Complex workflows
- [Design System Examples](design-system-examples.md) - Token management
- [Integration Examples](integration-examples.md) - AI agent setup
- [Tool Reference](../tools/README.md) - Complete tool documentation
