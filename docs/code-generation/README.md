# Code Generation Tools

The Figma Context MCP server provides comprehensive code generation capabilities, transforming Figma designs into production-ready code across multiple frameworks and styling approaches.

## Available Code Generation Tools

### React Components

#### `get_react_component`
Generates clean TypeScript React components with proper interfaces and styling options.

**Parameters:**
- `componentName` (optional) - Custom component name
- `includeProps` (default: true) - Include TypeScript interface
- `styleType` (default: "css-modules") - Styling approach

**Example:**
```javascript
get_react_component({
  componentName: "PrimaryButton",
  includeProps: true,
  styleType: "css-modules"
})
```

**Output:**
```typescript
import React from 'react';
import styles from './PrimaryButton.module.css';

interface PrimaryButtonProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ className, style, children }) => {
  return (
    <div className={`${styles.primarybutton} ${className || ''}`} style={style}>
      {children}
    </div>
  );
};

export default PrimaryButton;
```

#### `get_tailwind_component`
Generates React components with smart Tailwind class conversion and design token integration.

**Parameters:**
- `componentName` (optional) - Custom component name
- `responsiveBreakpoints` (default: false) - Include responsive classes
- `useDesignTokens` (default: true) - Convert to design tokens

**Example:**
```javascript
get_tailwind_component({
  componentName: "Card",
  responsiveBreakpoints: true,
  useDesignTokens: true
})
```

#### `get_styled_component`
Generates modern styled-components with theme support and clean architecture.

**Parameters:**
- `componentName` (optional) - Custom component name
- `useTheme` (default: false) - Include theme props
- `exportType` (default: "default") - Export format

### CSS Extraction

#### `get_figma_css`
Extracts clean CSS using Figma's native getCSSAsync() API, following Dev Mode standards.

**Parameters:**
- `format` (default: "formatted") - CSS output format
- `nodeId` (optional) - Specific node ID

**Formats:**
- `raw` - Unformatted CSS properties
- `formatted` - Clean, readable CSS
- `with-selector` - CSS with class selector

#### `get_Basic_CSS`
Provides simple CSS extraction for basic container styling.

**Parameters:**
- `includeClassName` (default: true) - Include CSS class wrapper

#### `get_All_Layers_CSS`
Comprehensive CSS extraction for all layers, similar to Figma's "Copy all layers as CSS" feature.

**Parameters:**
- `formatted` (default: true) - Return formatted CSS with comments

### Advanced Generation

#### `generate_component_from_figma`
Advanced component generation with multiple styling options and comprehensive features.

**Parameters:**
- `componentName` (optional) - Component name
- `includeChildren` (default: true) - Include child components
- `styleType` (default: "css-modules") - Styling approach

**Style Types:**
- `css-modules` - CSS Modules approach
- `styled-components` - CSS-in-JS
- `tailwind` - Utility-first CSS
- `inline` - Inline styles

#### `generate_codegen_plugin`
Generates complete Figma Dev Mode codegen plugins following official standards.

**Parameters:**
- `pluginName` (default: "Custom Codegen Plugin") - Plugin name
- `supportedLanguages` (default: ["React", "CSS"]) - Supported languages
- `includePreferences` (default: true) - Include codegen preferences

## Code Generation Workflows

### Basic Component Generation
```javascript
// 1. Extract design data
get_figma_dev_code({ format: "both" })

// 2. Generate React component
get_react_component({
  componentName: "Button",
  styleType: "css-modules"
})

// 3. Get comprehensive CSS
get_All_Layers_CSS({ formatted: true })
```

### Multi-Framework Generation
```javascript
// Generate for different frameworks
get_react_component({ styleType: "css-modules" })
get_tailwind_component({ responsiveBreakpoints: true })
get_styled_component({ useTheme: true })
```

### Plugin Development
```javascript
// Generate custom Figma plugin
generate_codegen_plugin({
  pluginName: "Design System Plugin",
  supportedLanguages: ["React", "Vue", "CSS", "Tailwind"],
  includePreferences: true
})
```

## Best Practices

### Component Naming
- Use PascalCase for component names
- Be descriptive but concise
- Follow your team's naming conventions

### Styling Approaches
- **CSS Modules** - Best for traditional CSS workflows
- **Tailwind** - Ideal for utility-first development
- **Styled Components** - Great for component libraries
- **Inline Styles** - Use sparingly, mainly for dynamic styles

### Code Quality
- Always include TypeScript interfaces
- Use proper prop destructuring
- Include default props where appropriate
- Follow React best practices

## Output Examples

### CSS Modules Output
```css
.button {
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

### Tailwind Output
```jsx
const Button = ({ children, className }) => (
  <div className={`w-[200px] h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-medium ${className}`}>
    {children}
  </div>
);
```

### Styled Components Output
```jsx
const StyledButton = styled.div`
  width: 200px;
  height: 48px;
  background: #3b82f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 500;
`;
```

## Next Steps

- [Design System Tools](../design-system/README.md) - Manage design tokens
- [Asset Management](../asset-management/README.md) - Extract images and assets
- [Examples](../examples/README.md) - See complete workflows
- [API Reference](../api/README.md) - Technical specifications
