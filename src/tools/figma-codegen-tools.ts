/**
 * Figma Dev Mode Codegen Tools
 * Following official Figma codegen plugin standards
 * Uses figma.codegen.on("generate") pattern
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { FigmaDevData } from "../plugin-integration.js";

// Utility function to convert CSS object to string
function convertCSSObjectToString(cssObj: any): string {
  if (typeof cssObj === 'string') {
    return cssObj;
  }

  if (typeof cssObj === 'object' && cssObj !== null) {
    return Object.entries(cssObj)
      .map(([property, value]) => `${property}: ${value};`)
      .join('\n  ');
  }

  return '';
}

export const figmaCodegenTools: Tool[] = [
  {
    name: "get_figma_css",
    description: "Get clean CSS from Figma using native getCSSAsync() API - follows Dev Mode standards",
    inputSchema: {
      type: "object",
      properties: {
        nodeId: {
          type: "string",
          description: "Optional Figma node ID. If not provided, uses current selection.",
          optional: true
        },
        format: {
          type: "string",
          enum: ["raw", "formatted", "with-selector"],
          default: "formatted",
          description: "CSS output format"
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "get_react_component",
    description: "Generate clean React component with TypeScript - minimal, production-ready",
    inputSchema: {
      type: "object",
      properties: {
        componentName: {
          type: "string",
          description: "Custom component name (optional, will sanitize Figma name if not provided)"
        },
        styleType: {
          type: "string",
          enum: ["css-modules", "inline", "external"],
          default: "css-modules",
          description: "How to handle component styles"
        },
        includeProps: {
          type: "boolean",
          default: true,
          description: "Include TypeScript interface for props"
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "get_tailwind_component",
    description: "Generate React component with Tailwind classes - smart design token conversion",
    inputSchema: {
      type: "object",
      properties: {
        componentName: {
          type: "string",
          description: "Custom component name (optional)"
        },
        useDesignTokens: {
          type: "boolean",
          default: true,
          description: "Convert Figma design tokens to Tailwind variables"
        },
        responsiveBreakpoints: {
          type: "boolean",
          default: false,
          description: "Include responsive Tailwind classes"
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "get_styled_component",
    description: "Generate styled-components React component - clean, modern styling",
    inputSchema: {
      type: "object",
      properties: {
        componentName: {
          type: "string",
          description: "Custom component name (optional)"
        },
        useTheme: {
          type: "boolean",
          default: false,
          description: "Include theme props in styled-components"
        },
        exportType: {
          type: "string",
          enum: ["default", "named", "both"],
          default: "default",
          description: "Component export format"
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "generate_codegen_plugin",
    description: "Generate a proper Figma Dev Mode codegen plugin following official standards",
    inputSchema: {
      type: "object",
      properties: {
        pluginName: {
          type: "string",
          default: "Custom Codegen Plugin",
          description: "Name for the generated plugin"
        },
        supportedLanguages: {
          type: "array",
          items: {
            type: "string",
            enum: ["React", "Vue", "Angular", "CSS", "Tailwind", "SCSS"]
          },
          default: ["React", "CSS"],
          description: "Languages the plugin should support"
        },
        includePreferences: {
          type: "boolean",
          default: true,
          description: "Include codegen preferences (unit scaling, select options)"
        }
      },
      additionalProperties: false
    }
  }
];

export async function handleFigmaCodegenTool(name: string, args: any): Promise<any> {
  switch (name) {
    case "get_figma_css":
      return await getFigmaCSS(args);
    
    case "get_react_component":
      return await getReactComponent(args);
    
    case "get_tailwind_component":
      return await getTailwindComponent(args);
    
    case "get_styled_component":
      return await getStyledComponent(args);
    
    case "generate_codegen_plugin":
      return await generateCodegenPlugin(args);
    
    default:
      throw new Error(`Unknown Figma codegen tool: ${name}`);
  }
}

async function getFigmaCSS(args: { nodeId?: string; format?: string; fileKey?: string }): Promise<any> {
  try {
    // First try to get plugin data
    const pluginResponse = await fetch(`http://localhost:3333/plugin/latest-dev-data`).catch(() => null);

    let devData = null;

    if (pluginResponse && pluginResponse.ok) {
      const result = await pluginResponse.json();
      if (result.success && result.data) {
        devData = result.data;
      }
    }

    // If no plugin data, try to use Figma API data
    if (!devData && args.fileKey && args.nodeId) {
      const { FigmaService } = await import('../services/figma.js');
      const figmaService = new FigmaService();
      const nodeData = await figmaService.getNode(args.fileKey, args.nodeId, 3);

      if (nodeData && nodeData.nodes && nodeData.nodes.length > 0) {
        const node = nodeData.nodes[0];
        devData = {
          id: node.id,
          name: node.name,
          type: node.type,
          layout: node.layout,
          styles: node.styles,
          children: node.children || []
        };
      }
    }

    if (!devData) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: "No component data available. Please either:\n1. Extract a component using the Figma plugin, or\n2. Provide fileKey and nodeId parameters to generate from Figma API data"
        }]
      };
    }
    const format = args.format || "formatted";

    // Prefer native CSS from getCSSAsync() if available and convert to string
    let css = convertCSSObjectToString(devData.nativeCSS) || devData.css || "";
    const isNative = !!devData.nativeCSS;

    // If no CSS available, generate from layout data
    if (!css && devData.layout) {
      css = generateCSSFromLayout(devData);
    }

    let output = "";
    switch (format) {
      case "raw":
        output = css;
        break;
      case "with-selector":
        const className = devData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        output = `.${className} {\n  ${css}\n}`;
        break;
      case "formatted":
      default:
        const source = isNative ? "native Figma getCSSAsync()" : "fallback generator";
        output = `/* CSS for ${devData.name} (${source}) */\n${css}`;
        break;
    }

    return {
      content: [{
        type: "text",
        text: output
      }]
    };

  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error getting Figma CSS: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

async function getReactComponent(args: { componentName?: string; styleType?: string; includeProps?: boolean; fileKey?: string; nodeId?: string }): Promise<any> {
  try {
    // First try to get plugin data
    const pluginResponse = await fetch(`http://localhost:3333/plugin/latest-dev-data`).catch(() => null);

    let devData = null;

    if (pluginResponse && pluginResponse.ok) {
      const result = await pluginResponse.json();
      if (result.success && result.data) {
        devData = result.data;
      }
    }

    // If no plugin data, try to use Figma API data
    if (!devData && args.fileKey && args.nodeId) {
      const { FigmaService } = await import('../services/figma.js');
      const figmaService = new FigmaService();
      const nodeData = await figmaService.getNode(args.fileKey, args.nodeId, 3);

      if (nodeData && nodeData.nodes && nodeData.nodes.length > 0) {
        const node = nodeData.nodes[0];
        devData = {
          id: node.id,
          name: node.name,
          type: node.type,
          layout: node.layout,
          styles: node.styles,
          children: node.children || []
        };
      }
    }

    // If still no data, check if we have any recent project overview data
    if (!devData) {
      const overviewResponse = await fetch(`http://localhost:3333/plugin/latest-project-overview`).catch(() => null);
      if (overviewResponse && overviewResponse.ok) {
        const overviewResult = await overviewResponse.json();
        if (overviewResult.success && overviewResult.data) {
          return {
            isError: true,
            content: [{
              type: "text",
              text: `No specific component data available. Found project overview for "${overviewResult.data.fileName}" with ${overviewResult.data.frames} frames. Please provide fileKey and nodeId parameters, or extract a specific component using the Figma plugin first.`
            }]
          };
        }
      }

      return {
        isError: true,
        content: [{
          type: "text",
          text: "No component data available. Please either:\n1. Extract a component using the Figma plugin, or\n2. Provide fileKey and nodeId parameters to generate from Figma API data"
        }]
      };
    }

    const componentName = sanitizeComponentName(args.componentName || devData.name);
    const styleType = args.styleType || "css-modules";
    const includeProps = args.includeProps !== false;

    let component = generateCleanReactComponent(devData, componentName, styleType, includeProps);

    return {
      content: [{
        type: "text",
        text: component
      }]
    };

  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error generating React component: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

async function getTailwindComponent(args: { componentName?: string; useDesignTokens?: boolean; responsiveBreakpoints?: boolean }): Promise<any> {
  try {
    const response = await fetch(`http://localhost:3333/plugin/latest-dev-data`);
    
    if (!response.ok) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: "No dev data available. Please extract code from Figma using the plugin first."
        }]
      };
    }

    const result = await response.json();
    if (!result.success || !result.data) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: "No dev data available. Please extract code from Figma using the plugin first."
        }]
      };
    }

    const devData = result.data;
    const componentName = sanitizeComponentName(args.componentName || devData.name);
    
    const component = generateTailwindComponent(devData, componentName, args.useDesignTokens !== false);

    return {
      content: [{
        type: "text",
        text: component
      }]
    };

  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error generating Tailwind component: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

async function getStyledComponent(args: { componentName?: string; useTheme?: boolean; exportType?: string }): Promise<any> {
  try {
    const response = await fetch(`http://localhost:3333/plugin/latest-dev-data`);
    
    if (!response.ok) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: "No dev data available. Please extract code from Figma using the plugin first."
        }]
      };
    }

    const result = await response.json();
    if (!result.success || !result.data) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: "No dev data available. Please extract code from Figma using the plugin first."
        }]
      };
    }

    const devData = result.data;
    const componentName = sanitizeComponentName(args.componentName || devData.name);
    
    const component = generateStyledComponentCode(devData, componentName, args.useTheme === true, args.exportType || "default");

    return {
      content: [{
        type: "text",
        text: component
      }]
    };

  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error generating styled-component: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

async function generateCodegenPlugin(args: { pluginName?: string; supportedLanguages?: string[]; includePreferences?: boolean }): Promise<any> {
  const pluginName = args.pluginName || "Custom Codegen Plugin";
  const languages = args.supportedLanguages || ["React", "CSS"];
  const includePreferences = args.includePreferences !== false;

  const manifest = generatePluginManifest(pluginName, languages, includePreferences);
  const code = generatePluginCode(languages, includePreferences);
  const ui = generatePluginUI(pluginName);

  const output = `# Figma Dev Mode Codegen Plugin

## Generated Files

### manifest.json
\`\`\`json
${manifest}
\`\`\`

### code.js
\`\`\`javascript
${code}
\`\`\`

### ui.html
\`\`\`html
${ui}
\`\`\`

## Installation Instructions

1. Create a new directory for your plugin
2. Save each file with the specified name
3. Open Figma Desktop
4. Go to Plugins → Development → Import plugin from manifest
5. Select the manifest.json file
6. Your codegen plugin is ready to use in Dev Mode!

## Usage

This plugin follows Figma's official Dev Mode codegen standards:
- Works in the Inspect panel's code section
- Supports codegen preferences
- Integrates with Figma's native code generation
- Compatible with Figma for VS Code`;

  return {
    content: [{
      type: "text",
      text: output
    }]
  };
}

// Helper functions

function sanitizeComponentName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
    .replace(/^[a-z]/, char => char.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '')
    || 'Component';
}

function generateCleanReactComponent(devData: FigmaDevData, componentName: string, styleType: string, includeProps: boolean): string {
  const imports = ["import React from 'react';"];
  
  if (styleType === "css-modules") {
    imports.push(`import styles from './${componentName}.module.css';`);
  }

  const propsInterface = includeProps ? `
interface ${componentName}Props {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}` : '';

  const propsParam = includeProps ? `{ className, style, children }: ${componentName}Props` : 'props';
  
  const classNameAttr = styleType === "css-modules" 
    ? `className={\`\${styles.${componentName.toLowerCase()}} \${className || ''}\`}`
    : 'className={className}';

  // Use native CSS if available, fallback to custom CSS, ensure it's a string
  const css = convertCSSObjectToString(devData.nativeCSS) || devData.css || '';
  const styleAttr = styleType === "inline" && css
    ? `style={{ ${convertCSSToInlineStyle(css)}, ...style }}`
    : includeProps ? 'style={style}' : '';

  return `${imports.join('\n')}
${propsInterface}

const ${componentName}: React.FC${includeProps ? `<${componentName}Props>` : ''} = (${propsParam}) => {
  return (
    <div ${classNameAttr}${styleAttr ? ` ${styleAttr}` : ''}>
      {children}
    </div>
  );
};

export default ${componentName};${styleType === "css-modules" ? `

/* ${componentName}.module.css */
.${componentName.toLowerCase()} {
  ${css || '/* Add styles here */'}
}` : ''}`;
}

function generateTailwindComponent(devData: FigmaDevData, componentName: string, useDesignTokens: boolean): string {
  const css = devData.nativeCSS || devData.css || '';
  const tailwindClasses = convertCSSToTailwind(css, useDesignTokens);
  
  return `import React from 'react';

interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
}

const ${componentName}: React.FC<${componentName}Props> = ({ className, children }) => {
  return (
    <div className={\`${tailwindClasses} \${className || ''}\`}>
      {children}
    </div>
  );
};

export default ${componentName};`;
}

function generateStyledComponentCode(devData: FigmaDevData, componentName: string, useTheme: boolean, exportType: string): string {
  const themeProps = useTheme ? '${props => props.theme}' : '';
  const css = devData.nativeCSS || devData.css || '';
  
  const component = `import React from 'react';
import styled${useTheme ? ', { ThemeProvider }' : ''} from 'styled-components';

const Styled${componentName} = styled.div\`
  ${css || '/* Add styles here */'}
  ${themeProps}
\`;

interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
}

const ${componentName}: React.FC<${componentName}Props> = ({ className, children }) => {
  return (
    <Styled${componentName} className={className}>
      {children}
    </Styled${componentName}>
  );
};

${exportType === 'named' ? `export { ${componentName} };` : 
  exportType === 'both' ? `export { ${componentName} };\nexport default ${componentName};` :
  `export default ${componentName};`}`;

  return component;
}

function convertCSSToTailwind(css: string | any, useDesignTokens: boolean): string {
  // Ensure css is a string
  const cssString = convertCSSObjectToString(css);
  if (!cssString) return 'block';

  const lines = cssString.split('\n').filter(line => line.trim());
  const classes: string[] = [];
  
  for (const line of lines) {
    const [property, value] = line.split(':').map(s => s.trim().replace(';', ''));
    if (!property || !value) continue;
    
    // Smart conversion based on design tokens
    if (property === 'display' && value === 'flex') classes.push('flex');
    else if (property === 'width') {
      if (value === '100%') classes.push('w-full');
      else if (value.endsWith('px')) classes.push(`w-[${value}]`);
    }
    else if (property === 'height') {
      if (value === '100%') classes.push('h-full');
      else if (value.endsWith('px')) classes.push(`h-[${value}]`);
    }
    else if (property === 'background-color') {
      // Use design tokens for common colors
      if (useDesignTokens) {
        if (value === '#ffffff') classes.push('bg-white');
        else if (value === '#000000') classes.push('bg-black');
        else classes.push(`bg-[${value}]`);
      } else {
        classes.push(`bg-[${value}]`);
      }
    }
    else if (property === 'color') {
      if (useDesignTokens) {
        if (value === '#ffffff') classes.push('text-white');
        else if (value === '#000000') classes.push('text-black');
        else classes.push(`text-[${value}]`);
      } else {
        classes.push(`text-[${value}]`);
      }
    }
    else if (property === 'border-radius') {
      if (value.endsWith('px')) {
        const px = parseFloat(value);
        if (px === 4) classes.push('rounded');
        else if (px === 8) classes.push('rounded-lg');
        else if (px === 16) classes.push('rounded-2xl');
        else if (value === '50%' || px >= 9999) classes.push('rounded-full');
        else classes.push(`rounded-[${value}]`);
      }
    }
    else if (property === 'padding') {
      if (value.endsWith('px')) {
        const px = parseFloat(value);
        if (px === 16) classes.push('p-4');
        else if (px === 8) classes.push('p-2');
        else classes.push(`p-[${value}]`);
      }
    }
  }
  
  return classes.join(' ') || 'block';
}

function convertCSSToInlineStyle(css: string | any): string {
  // Ensure css is a string
  const cssString = convertCSSObjectToString(css);
  if (!cssString) return '';

  const lines = cssString.split('\n').filter(line => line.trim());
  const styles: string[] = [];

  for (const line of lines) {
    const [property, value] = line.split(':').map(s => s.trim().replace(';', ''));
    if (property && value) {
      const camelProperty = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      styles.push(`${camelProperty}: '${value}'`);
    }
  }

  return styles.join(', ');
}

function generatePluginManifest(pluginName: string, languages: string[], includePreferences: boolean): string {
  const codegenLanguages = languages.map(lang => ({
    label: lang,
    value: lang.toLowerCase()
  }));

  const preferences = includePreferences ? [
    {
      itemType: "unit",
      scaledUnit: "Rem",
      defaultScaleFactor: 16,
      default: true,
      includedLanguages: languages.map(l => l.toLowerCase())
    },
    {
      itemType: "select",
      propertyName: "componentFormat",
      label: "Component Format",
      options: [
        { label: "Functional", value: "functional", isDefault: true },
        { label: "Arrow Function", value: "arrow" }
      ],
      includedLanguages: ["react"]
    }
  ] : [];

  return JSON.stringify({
    name: pluginName,
    id: `${pluginName.toLowerCase().replace(/\s+/g, '-')}-codegen`,
    api: "1.0.0",
    main: "code.js",
    editorType: ["dev"],
    capabilities: ["codegen", "vscode"],
    codegenLanguages,
    ...(includePreferences && { codegenPreferences: preferences })
  }, null, 2);
}

function generatePluginCode(languages: string[], _includePreferences: boolean): string {
  return `// Figma Dev Mode Codegen Plugin
// Follows official Figma codegen standards

if (figma.editorType === "dev" && figma.mode === "codegen") {
  figma.codegen.on("generate", ({ node }) => {
    const results = [];

    ${languages.map(lang => {
      if (lang === "React") {
        return `
    // React Component Generation
    if (figma.codegen.preferences.language === "react") {
      const componentName = sanitizeComponentName(node.name);
      results.push({
        title: "React Component",
        language: "TYPESCRIPT",
        code: generateReactComponent(node, componentName)
      });
    }`;
      } else if (lang === "CSS") {
        return `
    // CSS Generation
    if (figma.codegen.preferences.language === "css") {
      results.push({
        title: "CSS",
        language: "CSS",
        code: generateCSS(node)
      });
    }`;
      } else {
        return `
    // ${lang} Generation
    if (figma.codegen.preferences.language === "${lang.toLowerCase()}") {
      results.push({
        title: "${lang}",
        language: "${lang.toUpperCase()}",
        code: generate${lang}Code(node)
      });
    }`;
      }
    }).join('')}

    return results;
  });

  // Helper functions
  function sanitizeComponentName(name) {
    return name
      .replace(/[^a-zA-Z0-9\\s]/g, ' ')
      .split(/\\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
      .replace(/^[a-z]/, char => char.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, '')
      || 'Component';
  }

  function generateReactComponent(node, componentName) {
    return \`import React from 'react';

interface \${componentName}Props {
  className?: string;
  children?: React.ReactNode;
}

const \${componentName}: React.FC<\${componentName}Props> = ({ className, children }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export default \${componentName};\`;
  }

  function generateCSS(node) {
    // Use Figma's native CSS generation
    return node.getCSSAsync ? node.getCSSAsync() : \`/* CSS for \${node.name} */\`;
  }
}`;
}

function generatePluginUI(pluginName: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>${pluginName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 16px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
    }
    .info {
      color: #666;
      font-size: 14px;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${pluginName}</h1>
    <div class="info">
      This plugin generates code directly in the Inspect panel's code section.
      <br><br>
      Select any element in Dev Mode to see generated code.
    </div>
  </div>
</body>
</html>`;
}

// Helper function to generate CSS from Figma layout data
function generateCSSFromLayout(nodeData: any): string {
  const layout = nodeData.layout;
  if (!layout) return "";

  const css: string[] = [];

  // Dimensions
  if (layout.dimensions) {
    if (layout.dimensions.width) css.push(`width: ${layout.dimensions.width}px`);
    if (layout.dimensions.height) css.push(`height: ${layout.dimensions.height}px`);
  }

  // Position
  if (layout.position) {
    css.push(`position: absolute`);
    if (layout.position.x !== undefined) css.push(`left: ${layout.position.x}px`);
    if (layout.position.y !== undefined) css.push(`top: ${layout.position.y}px`);
  }

  // Background
  if (nodeData.styles?.background) {
    const bg = nodeData.styles.background;
    if (bg.color) {
      css.push(`background-color: ${bg.color}`);
    }
  }

  // Border radius
  if (nodeData.styles?.borderRadius) {
    css.push(`border-radius: ${nodeData.styles.borderRadius}px`);
  }

  // Display properties based on type
  if (nodeData.type === 'FRAME' || nodeData.type === 'COMPONENT') {
    css.push(`display: flex`);
    css.push(`flex-direction: column`);
  }

  return css.join(';\n  ') + (css.length > 0 ? ';' : '');
}