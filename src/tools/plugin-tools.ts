import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { FigmaDevData } from "../plugin-integration.js";
import { ComponentGenerator } from "../transformers/component-generator.js";
import { TypeScriptGenerator } from "../transformers/typescript-generator.js";

// Note: Using fetch which is available in Node.js 18+

export const pluginTools: Tool[] = [
  {
    name: "get_figma_dev_code",
    description: "Get the latest CSS and React code extracted from Figma via the plugin. This provides actual dev-mode code generation.",
    inputSchema: {
      type: "object",
      properties: {
        format: {
          type: "string",
          enum: ["css", "react", "both", "json"],
          description: "Format of code to return",
          default: "both"
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "generate_typescript_component",
    description: "🎨 PICASSO-LEVEL: Generate production-ready TypeScript React component from Figma data with advanced features",
    inputSchema: {
      type: "object",
      properties: {
        componentName: {
          type: "string",
          description: "Custom name for the component (optional, will sanitize Figma name if not provided)"
        },
        styleType: {
          type: "string",
          enum: ["css-modules", "styled-components", "tailwind", "inline"],
          default: "css-modules",
          description: "Type of styling to generate"
        },
        componentFormat: {
          type: "string",
          enum: ["functional", "class", "arrow"],
          default: "functional",
          description: "React component format"
        },
        includeTypes: {
          type: "boolean",
          default: true,
          description: "Generate TypeScript interfaces and types"
        },
        includeTests: {
          type: "boolean",
          default: true,
          description: "Generate Jest test files"
        },
        includeStories: {
          type: "boolean",
          default: true,
          description: "Generate Storybook stories"
        },
        exportFormat: {
          type: "string",
          enum: ["default", "named", "both"],
          default: "default",
          description: "Export format for the component"
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "generate_project_structure",
    description: "🏗️ ARCHITECT: Generate complete project structure with multiple components, tests, and configuration",
    inputSchema: {
      type: "object",
      properties: {
        projectName: {
          type: "string",
          default: "figma-components",
          description: "Name for the generated project"
        },
        styleType: {
          type: "string",
          enum: ["css-modules", "styled-components", "tailwind", "inline"],
          default: "css-modules",
          description: "Styling approach for all components"
        },
        includeConfig: {
          type: "boolean",
          default: true,
          description: "Include package.json, tsconfig.json, and other config files"
        },
        includeTests: {
          type: "boolean",
          default: true,
          description: "Include test files for all components"
        },
        includeStorybook: {
          type: "boolean",
          default: true,
          description: "Include Storybook configuration and stories"
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "get_All_Layers_CSS",
    description: "Get comprehensive CSS for all layers from the latest Figma extraction (like Figma's 'Copy all layers as CSS'). This provides pixel-perfect CSS for every element in the design.",
    inputSchema: {
      type: "object",
      properties: {
        formatted: {
          type: "boolean",
          description: "Whether to return formatted CSS with comments",
          default: true
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "get_Basic_CSS",
    description: "Get basic CSS for the main selected element from the latest Figma extraction",
    inputSchema: {
      type: "object",
      properties: {
        includeClassName: {
          type: "boolean",
          description: "Whether to include the CSS class name wrapper",
          default: true
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "get_React",
    description: "Get the complete React component structure from the latest Figma extraction with full component hierarchy",
    inputSchema: {
      type: "object",
      properties: {
        includeCSS: {
          type: "boolean",
          description: "Whether to include the comprehensive CSS in the component",
          default: true
        },
        componentFormat: {
          type: "string",
          enum: ["functional", "class", "arrow"],
          description: "React component format to use",
          default: "functional"
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "get_JSON",
    description: "Get the raw JSON data from the latest Figma extraction with complete layout and styling information",
    inputSchema: {
      type: "object",
      properties: {
        includeChildren: {
          type: "boolean",
          description: "Whether to include child elements data",
          default: true
        },
        pretty: {
          type: "boolean",
          description: "Whether to format JSON with indentation",
          default: true
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "get_UI_Screenshots",
    description: "Get information about UI screenshots and visual assets from the Figma extraction",
    inputSchema: {
      type: "object",
      properties: {
        includeImageData: {
          type: "boolean",
          description: "Whether to include base64 image data (if available)",
          default: false
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "get_figma_dev_history",
    description: "Get the history of dev code extractions from the Figma plugin",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of history items to return",
          default: 5,
          minimum: 1,
          maximum: 10
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "generate_component_from_figma",
    description: "Generate a complete React component with styling from the latest Figma dev data",
    inputSchema: {
      type: "object",
      properties: {
        componentName: {
          type: "string",
          description: "Name for the generated component (optional, will use Figma node name if not provided)"
        },
        styleType: {
          type: "string",
          enum: ["css-modules", "styled-components", "tailwind", "inline"],
          description: "Type of styling to generate",
          default: "css-modules"
        },
        includeChildren: {
          type: "boolean",
          description: "Whether to include child components",
          default: true
        }
      },
      additionalProperties: false
    }
  }
];

export async function handlePluginTool(name: string, args: any): Promise<any> {
  switch (name) {
    case "get_figma_dev_code":
      return await getFigmaDevCode(args);

    case "get_All_Layers_CSS":
      return await getAllLayersCSS(args);

    case "get_Basic_CSS":
      return await getBasicCSS(args);

    case "get_React":
      return await getReact(args);

    case "get_JSON":
      return await getJSON(args);

    case "get_UI_Screenshots":
      return await getUIScreenshots(args);

    case "get_figma_dev_history":
      return await getFigmaDevHistory(args);

    case "generate_component_from_figma":
      return await generateComponentFromFigma(args);

    case "generate_typescript_component":
      return await generateTypeScriptComponent(args);

    case "generate_project_structure":
      return await generateProjectStructure(args);

    default:
      throw new Error(`Unknown plugin tool: ${name}`);
  }
}

async function getFigmaDevCode(args: { format?: string }): Promise<any> {
  try {
    // Fetch from HTTP server (where Figma plugin sends data)
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
    const format = args.format || "both";
    let content = "";

    switch (format) {
      case "css":
        if (devData.allLayersCSS) {
          content = `/* All Layers CSS for ${devData.name} */\n${devData.allLayersCSS}`;
        } else {
          content = `/* CSS for ${devData.name} */\n.${devData.name.toLowerCase().replace(/\s+/g, '-')} {\n  ${devData.css}\n}`;
        }
        break;

      case "react":
        content = devData.react;
        break;

      case "json":
        content = JSON.stringify(devData, null, 2);
        break;

      case "both":
      default:
        const cssContent = devData.allLayersCSS || `/* CSS */\n.${devData.name.toLowerCase().replace(/\s+/g, '-')} {\n  ${devData.css}\n}`;
        content = `${cssContent}\n\n/* React Component */\n${devData.react}`;
        break;
    }

    return {
      content: [{
        type: "text",
        text: content
      }]
    };

  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error fetching dev data: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

async function getAllLayersCSS(args: { formatted?: boolean }): Promise<any> {
  try {
    // Try to fetch from HTTP endpoint first (for when running in STDIO mode)
    const formatted = args.formatted !== false;
    const response = await fetch(`http://localhost:3333/plugin/all-layers-css?formatted=${formatted}`);

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return {
          content: [{
            type: "text",
            text: data.content
          }]
        };
      }
    }
  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error fetching all layers CSS data: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }

  return {
    isError: true,
    content: [{
      type: "text",
      text: "Unable to fetch all layers CSS data from server"
    }]
  };
}

async function getBasicCSS(args: { includeClassName?: boolean }): Promise<any> {
  try {
    // Fetch from HTTP server (where Figma plugin sends data)
    const includeClassName = args.includeClassName !== false;
    const response = await fetch(`http://localhost:3333/plugin/basic-css?includeClassName=${includeClassName}`);

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return {
          content: [{
            type: "text",
            text: data.content
          }]
        };
      } else {
        return {
          isError: true,
          content: [{
            type: "text",
            text: data.message || "No basic CSS available"
          }]
        };
      }
    }
  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error fetching basic CSS data: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }

  return {
    isError: true,
    content: [{
      type: "text",
      text: "Unable to fetch basic CSS data from server"
    }]
  };
}

async function getReact(args: { includeCSS?: boolean; componentFormat?: string }): Promise<any> {
  try {
    // Fetch from HTTP server (where Figma plugin sends data)
    const includeCSS = args.includeCSS !== false;
    const response = await fetch(`http://localhost:3333/plugin/react?includeCSS=${includeCSS}`);

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return {
          content: [{
            type: "text",
            text: data.content
          }]
        };
      } else {
        return {
          isError: true,
          content: [{
            type: "text",
            text: data.message || "No React component available"
          }]
        };
      }
    }
  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error fetching React component: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }

  return {
    isError: true,
    content: [{
      type: "text",
      text: "Unable to fetch React component from server"
    }]
  };
}

async function getJSON(args: { includeChildren?: boolean; pretty?: boolean }): Promise<any> {
  try {
    // Fetch from HTTP server (where Figma plugin sends data)
    const includeChildren = args.includeChildren !== false;
    const pretty = args.pretty !== false;
    const response = await fetch(`http://localhost:3333/plugin/json?includeChildren=${includeChildren}&pretty=${pretty}`);

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return {
          content: [{
            type: "text",
            text: data.content
          }]
        };
      } else {
        return {
          isError: true,
          content: [{
            type: "text",
            text: data.message || "No JSON data available"
          }]
        };
      }
    }
  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error fetching JSON data: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }

  return {
    isError: true,
    content: [{
      type: "text",
      text: "Unable to fetch JSON data from server"
    }]
  };
}

async function getUIScreenshots(args: { includeImageData?: boolean }): Promise<any> {
  try {
    // Fetch from HTTP server (where Figma plugin sends data)
    const response = await fetch(`http://localhost:3333/plugin/ui-info`);

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return {
          content: [{
            type: "text",
            text: data.content
          }]
        };
      } else {
        return {
          isError: true,
          content: [{
            type: "text",
            text: data.message || "No UI information available"
          }]
        };
      }
    }
  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error fetching UI information: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }

  return {
    isError: true,
    content: [{
      type: "text",
      text: "Unable to fetch UI information from server"
    }]
  };
}

async function getFigmaDevHistory(args: { limit?: number }): Promise<any> {
  try {
    // Fetch from HTTP server (where Figma plugin sends data)
    const response = await fetch(`http://localhost:3333/plugin/dev-data-history`);

    if (!response.ok) {
      return {
        content: [{
          type: "text",
          text: "No dev data history available."
        }]
      };
    }

    const result = await response.json();
    if (!result.success || !result.data) {
      return {
        content: [{
          type: "text",
          text: "No dev data history available."
        }]
      };
    }

    const history = result.data;
    const limit = Math.min(args.limit || 5, 10);
    const limitedHistory = history.slice(0, limit);

    if (limitedHistory.length === 0) {
      return {
        content: [{
          type: "text",
          text: "No dev data history available."
        }]
      };
    }

    const historyText = limitedHistory.map((item: any, index: number) => {
      return `${index + 1}. ${item.name} (${item.type})\n   ID: ${item.id}\n   Layout: ${item.layout.width}x${item.layout.height}`;
    }).join('\n\n');

    return {
      content: [{
        type: "text",
        text: `Dev Data History (${limitedHistory.length} items):\n\n${historyText}`
      }]
    };

  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error fetching dev data history: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

async function generateComponentFromFigma(args: {
  componentName?: string;
  styleType?: string;
  includeChildren?: boolean
}): Promise<any> {
  try {
    // Fetch from HTTP server (where Figma plugin sends data)
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
    if (!result.success) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: result.message || "Failed to fetch dev data"
        }]
      };
    }

    const devData = result.data;

    const componentName = args.componentName || toPascalCase(devData.name);
  const styleType = args.styleType || "css-modules";
  const includeChildren = args.includeChildren !== false;

  let component = "";
  let styles = "";

  switch (styleType) {
    case "styled-components":
      component = generateStyledComponent(devData, componentName, includeChildren);
      break;
    
    case "tailwind":
      component = generateTailwindComponent(devData, componentName, includeChildren);
      break;
    
    case "inline":
      component = generateInlineStyledComponent(devData, componentName, includeChildren);
      break;
    
    case "css-modules":
    default:
      const result = generateCSSModuleComponent(devData, componentName, includeChildren);
      component = result.component;
      styles = result.styles;
      break;
  }

  let output = component;
  if (styles) {
    output += `\n\n/* ${componentName}.module.css */\n${styles}`;
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
        text: `Error generating component: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

/**
 * 🎨 PICASSO-LEVEL: Generate production-ready TypeScript React component
 */
async function generateTypeScriptComponent(args: {
  componentName?: string;
  styleType?: string;
  componentFormat?: string;
  includeTypes?: boolean;
  includeTests?: boolean;
  includeStories?: boolean;
  exportFormat?: string;
}): Promise<any> {
  try {
    // Fetch from HTTP server (where Figma plugin sends data)
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

    // Create component generator with options
    const generator = new ComponentGenerator({
      styleType: args.styleType as any || 'css-modules',
      componentFormat: args.componentFormat as any || 'functional',
      includeTypes: args.includeTypes !== false,
      includeProps: true,
      includeChildren: true,
      exportFormat: args.exportFormat as any || 'default',
      addComments: true
    });

    // Generate the component
    const generated = generator.generateComponent(devData, {
      styleType: args.styleType as any,
      componentFormat: args.componentFormat as any,
      includeTypes: args.includeTypes,
      exportFormat: args.exportFormat as any
    });

    // Build output with all files
    let output = `// 🎨 PICASSO-LEVEL TypeScript React Component Generated from Figma\n\n`;

    // Component file
    output += `/* ${generated.name}.tsx */\n${generated.files.component}\n\n`;

    // Types file
    if (generated.files.types) {
      output += `/* ${generated.name}.types.ts */\n${generated.files.types}\n\n`;
    }

    // Styles file
    if (generated.files.styles) {
      const styleExt = args.styleType === 'css-modules' ? 'module.css' :
                      args.styleType === 'styled-components' ? 'ts' : 'css';
      output += `/* ${generated.name}.${styleExt} */\n${generated.files.styles}\n\n`;
    }

    // Index file
    output += `/* index.ts */\n${generated.files.index}\n\n`;

    // Test file (if requested)
    if (args.includeTests !== false && generated.files.test) {
      output += `/* ${generated.name}.test.tsx */\n${generated.files.test}\n\n`;
    }

    // Storybook file (if requested)
    if (args.includeStories !== false && generated.files.stories) {
      output += `/* ${generated.name}.stories.tsx */\n${generated.files.stories}\n\n`;
    }

    // Add metadata
    output += `/* 📊 Component Metadata */\n/*
Original Figma Name: ${generated.metadata.originalName}
Component Type: ${generated.metadata.type}
Has Children: ${generated.metadata.hasChildren}
Is Interactive: ${generated.metadata.isInteractive}
Style Type: ${generated.metadata.styleType}
Generated: ${new Date().toISOString()}
*/`;

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
        text: `Error generating TypeScript component: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

/**
 * 🏗️ ARCHITECT: Generate complete project structure
 */
async function generateProjectStructure(args: {
  projectName?: string;
  styleType?: string;
  includeConfig?: boolean;
  includeTests?: boolean;
  includeStorybook?: boolean;
}): Promise<any> {
  try {
    // Fetch from HTTP server (where Figma plugin sends data)
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

    // Create component generator
    const generator = new ComponentGenerator({
      styleType: args.styleType as any || 'css-modules',
      componentFormat: 'functional',
      includeTypes: true,
      includeProps: true,
      includeChildren: true,
      exportFormat: 'default',
      addComments: true
    });

    // Generate project structure (treating single component as array)
    const project = generator.generateProject([devData], {
      styleType: args.styleType as any
    });

    // Build comprehensive output
    let output = `# 🏗️ COMPLETE PROJECT STRUCTURE\n\n`;
    output += `Project: ${args.projectName || 'figma-components'}\n`;
    output += `Generated: ${new Date().toISOString()}\n`;
    output += `Components: ${project.components.length}\n\n`;

    // Show file structure
    output += `## 📁 File Structure\n\`\`\`\n`;
    Object.keys(project.structure).sort().forEach(path => {
      output += `${path}\n`;
    });
    output += `\`\`\`\n\n`;

    // Show each file content
    output += `## 📄 File Contents\n\n`;
    Object.entries(project.structure).forEach(([path, content]) => {
      output += `### ${path}\n\`\`\`typescript\n${content}\n\`\`\`\n\n`;
    });

    // Add configuration files if requested
    if (args.includeConfig !== false) {
      if (project.packageJson) {
        output += `### package.json\n\`\`\`json\n${JSON.stringify(project.packageJson, null, 2)}\n\`\`\`\n\n`;
      }

      if (project.tsConfig) {
        output += `### tsconfig.json\n\`\`\`json\n${JSON.stringify(project.tsConfig, null, 2)}\n\`\`\`\n\n`;
      }
    }

    // Add component metadata
    output += `## 📊 Component Analysis\n\n`;
    project.components.forEach(comp => {
      output += `### ${comp.name}\n`;
      output += `- **Original Name**: ${comp.metadata.originalName}\n`;
      output += `- **Type**: ${comp.metadata.type}\n`;
      output += `- **Has Children**: ${comp.metadata.hasChildren}\n`;
      output += `- **Interactive**: ${comp.metadata.isInteractive}\n`;
      output += `- **Style Type**: ${comp.metadata.styleType}\n\n`;
    });

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
        text: `Error generating project structure: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

function generateCSSModuleComponent(data: FigmaDevData, componentName: string, includeChildren: boolean): { component: string; styles: string } {
  const className = componentName.toLowerCase();
  
  let jsx = `<div className={styles.${className}}>`;
  
  if (data.type === 'TEXT') {
    jsx += `\n    {/* Add text content here */}`;
  }
  
  if (includeChildren && data.children.length > 0) {
    jsx += `\n    {/* Child components */}`;
    data.children.forEach(child => {
      jsx += `\n    <div className={styles.${child.name.toLowerCase().replace(/\s+/g, '')}}></div>`;
    });
  }
  
  jsx += `\n  </div>`;

  const component = `import React from 'react';
import styles from './${componentName}.module.css';

interface ${componentName}Props {
  // Add props here
}

const ${componentName}: React.FC<${componentName}Props> = () => {
  return (
    ${jsx}
  );
};

export default ${componentName};`;

  let styles = `.${className} {\n  ${data.css}\n}`;
  
  if (includeChildren && data.children.length > 0) {
    data.children.forEach(child => {
      const childClass = child.name.toLowerCase().replace(/\s+/g, '');
      styles += `\n\n.${childClass} {\n  ${child.css}\n}`;
    });
  }

  return { component, styles };
}

function generateStyledComponent(data: FigmaDevData, componentName: string, includeChildren: boolean): string {
  const styledName = `Styled${componentName}`;
  
  let component = `import React from 'react';
import styled from 'styled-components';

const ${styledName} = styled.div\`
  ${data.css.replace(/;/g, ';')}
\`;

interface ${componentName}Props {
  // Add props here
}

const ${componentName}: React.FC<${componentName}Props> = () => {
  return (
    <${styledName}>
      {/* Add content here */}
    </${styledName}>
  );
};

export default ${componentName};`;

  return component;
}

function generateTailwindComponent(data: FigmaDevData, componentName: string, includeChildren: boolean): string {
  // Convert CSS to Tailwind classes (simplified)
  const tailwindClasses = convertCSSToTailwind(data.css);
  
  return `import React from 'react';

interface ${componentName}Props {
  // Add props here
}

const ${componentName}: React.FC<${componentName}Props> = () => {
  return (
    <div className="${tailwindClasses}">
      {/* Add content here */}
    </div>
  );
};

export default ${componentName};`;
}

function generateInlineStyledComponent(data: FigmaDevData, componentName: string, includeChildren: boolean): string {
  const styleObject = convertCSSToStyleObject(data.css);
  
  return `import React from 'react';

interface ${componentName}Props {
  // Add props here
}

const ${componentName}: React.FC<${componentName}Props> = () => {
  const styles = ${styleObject};

  return (
    <div style={styles}>
      {/* Add content here */}
    </div>
  );
};

export default ${componentName};`;
}

function toPascalCase(str: string): string {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
    return word.toUpperCase();
  }).replace(/\s+/g, '');
}

function convertCSSToTailwind(css: string): string {
  const classes: string[] = [];
  const lines = css.split('\n').map(line => line.trim()).filter(Boolean);

  for (const line of lines) {
    const [property, value] = line.split(':').map(s => s.trim().replace(';', ''));
    if (!property || !value) continue;

    switch (property) {
      // Display
      case 'display':
        if (value === 'flex') classes.push('flex');
        else if (value === 'block') classes.push('block');
        else if (value === 'inline') classes.push('inline');
        else if (value === 'inline-block') classes.push('inline-block');
        else if (value === 'grid') classes.push('grid');
        else if (value === 'none') classes.push('hidden');
        break;

      // Flexbox
      case 'flex-direction':
        if (value === 'row') classes.push('flex-row');
        else if (value === 'column') classes.push('flex-col');
        else if (value === 'row-reverse') classes.push('flex-row-reverse');
        else if (value === 'column-reverse') classes.push('flex-col-reverse');
        break;

      case 'justify-content':
        if (value === 'flex-start') classes.push('justify-start');
        else if (value === 'flex-end') classes.push('justify-end');
        else if (value === 'center') classes.push('justify-center');
        else if (value === 'space-between') classes.push('justify-between');
        else if (value === 'space-around') classes.push('justify-around');
        else if (value === 'space-evenly') classes.push('justify-evenly');
        break;

      case 'align-items':
        if (value === 'flex-start') classes.push('items-start');
        else if (value === 'flex-end') classes.push('items-end');
        else if (value === 'center') classes.push('items-center');
        else if (value === 'baseline') classes.push('items-baseline');
        else if (value === 'stretch') classes.push('items-stretch');
        break;

      case 'gap':
        const gapValue = parseFloat(value);
        if (gapValue === 4) classes.push('gap-1');
        else if (gapValue === 8) classes.push('gap-2');
        else if (gapValue === 12) classes.push('gap-3');
        else if (gapValue === 16) classes.push('gap-4');
        else if (gapValue === 20) classes.push('gap-5');
        else if (gapValue === 24) classes.push('gap-6');
        else if (gapValue === 32) classes.push('gap-8');
        else classes.push(`gap-[${value}]`);
        break;

      // Dimensions
      case 'width':
        if (value === '100%') classes.push('w-full');
        else if (value === '50%') classes.push('w-1/2');
        else if (value === '33.333333%') classes.push('w-1/3');
        else if (value === '25%') classes.push('w-1/4');
        else if (value === 'auto') classes.push('w-auto');
        else if (value.endsWith('px')) {
          const px = parseFloat(value);
          if (px === 16) classes.push('w-4');
          else if (px === 24) classes.push('w-6');
          else if (px === 32) classes.push('w-8');
          else if (px === 48) classes.push('w-12');
          else if (px === 64) classes.push('w-16');
          else classes.push(`w-[${value}]`);
        }
        break;

      case 'height':
        if (value === '100%') classes.push('h-full');
        else if (value === '50%') classes.push('h-1/2');
        else if (value === 'auto') classes.push('h-auto');
        else if (value.endsWith('px')) {
          const px = parseFloat(value);
          if (px === 16) classes.push('h-4');
          else if (px === 24) classes.push('h-6');
          else if (px === 32) classes.push('h-8');
          else if (px === 48) classes.push('h-12');
          else if (px === 64) classes.push('h-16');
          else classes.push(`h-[${value}]`);
        }
        break;

      // Padding
      case 'padding':
        const paddingValue = parseFloat(value);
        if (paddingValue === 4) classes.push('p-1');
        else if (paddingValue === 8) classes.push('p-2');
        else if (paddingValue === 12) classes.push('p-3');
        else if (paddingValue === 16) classes.push('p-4');
        else if (paddingValue === 20) classes.push('p-5');
        else if (paddingValue === 24) classes.push('p-6');
        else classes.push(`p-[${value}]`);
        break;

      case 'padding-top':
        const ptValue = parseFloat(value);
        if (ptValue === 4) classes.push('pt-1');
        else if (ptValue === 8) classes.push('pt-2');
        else if (ptValue === 12) classes.push('pt-3');
        else if (ptValue === 16) classes.push('pt-4');
        else classes.push(`pt-[${value}]`);
        break;

      case 'padding-right':
        const prValue = parseFloat(value);
        if (prValue === 4) classes.push('pr-1');
        else if (prValue === 8) classes.push('pr-2');
        else if (prValue === 12) classes.push('pr-3');
        else if (prValue === 16) classes.push('pr-4');
        else classes.push(`pr-[${value}]`);
        break;

      case 'padding-bottom':
        const pbValue = parseFloat(value);
        if (pbValue === 4) classes.push('pb-1');
        else if (pbValue === 8) classes.push('pb-2');
        else if (pbValue === 12) classes.push('pb-3');
        else if (pbValue === 16) classes.push('pb-4');
        else classes.push(`pb-[${value}]`);
        break;

      case 'padding-left':
        const plValue = parseFloat(value);
        if (plValue === 4) classes.push('pl-1');
        else if (plValue === 8) classes.push('pl-2');
        else if (plValue === 12) classes.push('pl-3');
        else if (plValue === 16) classes.push('pl-4');
        else classes.push(`pl-[${value}]`);
        break;

      // Margin
      case 'margin':
        const marginValue = parseFloat(value);
        if (marginValue === 0) classes.push('m-0');
        else if (marginValue === 4) classes.push('m-1');
        else if (marginValue === 8) classes.push('m-2');
        else if (marginValue === 12) classes.push('m-3');
        else if (marginValue === 16) classes.push('m-4');
        else if (value === 'auto') classes.push('m-auto');
        else classes.push(`m-[${value}]`);
        break;

      // Background
      case 'background-color':
        if (value === '#ffffff' || value === 'white') classes.push('bg-white');
        else if (value === '#000000' || value === 'black') classes.push('bg-black');
        else if (value === 'transparent') classes.push('bg-transparent');
        else if (value.startsWith('#')) {
          // Convert hex to Tailwind color if it matches common colors
          const colorMap: Record<string, string> = {
            '#ef4444': 'bg-red-500',
            '#f97316': 'bg-orange-500',
            '#eab308': 'bg-yellow-500',
            '#22c55e': 'bg-green-500',
            '#3b82f6': 'bg-blue-500',
            '#8b5cf6': 'bg-violet-500',
            '#ec4899': 'bg-pink-500',
            '#6b7280': 'bg-gray-500',
          };
          classes.push(colorMap[value.toLowerCase()] || `bg-[${value}]`);
        }
        break;

      // Text
      case 'color':
        if (value === '#ffffff' || value === 'white') classes.push('text-white');
        else if (value === '#000000' || value === 'black') classes.push('text-black');
        else if (value.startsWith('#')) {
          const colorMap: Record<string, string> = {
            '#ef4444': 'text-red-500',
            '#f97316': 'text-orange-500',
            '#eab308': 'text-yellow-500',
            '#22c55e': 'text-green-500',
            '#3b82f6': 'text-blue-500',
            '#8b5cf6': 'text-violet-500',
            '#ec4899': 'text-pink-500',
            '#6b7280': 'text-gray-500',
          };
          classes.push(colorMap[value.toLowerCase()] || `text-[${value}]`);
        }
        break;

      case 'font-size':
        const fontSize = parseFloat(value);
        if (fontSize === 12) classes.push('text-xs');
        else if (fontSize === 14) classes.push('text-sm');
        else if (fontSize === 16) classes.push('text-base');
        else if (fontSize === 18) classes.push('text-lg');
        else if (fontSize === 20) classes.push('text-xl');
        else if (fontSize === 24) classes.push('text-2xl');
        else if (fontSize === 30) classes.push('text-3xl');
        else if (fontSize === 36) classes.push('text-4xl');
        else classes.push(`text-[${value}]`);
        break;

      case 'font-weight':
        if (value === '300') classes.push('font-light');
        else if (value === '400') classes.push('font-normal');
        else if (value === '500') classes.push('font-medium');
        else if (value === '600') classes.push('font-semibold');
        else if (value === '700') classes.push('font-bold');
        else if (value === '800') classes.push('font-extrabold');
        else if (value === '900') classes.push('font-black');
        break;

      case 'text-align':
        if (value === 'left') classes.push('text-left');
        else if (value === 'center') classes.push('text-center');
        else if (value === 'right') classes.push('text-right');
        else if (value === 'justify') classes.push('text-justify');
        break;

      // Border
      case 'border-radius':
        const borderRadius = parseFloat(value);
        if (borderRadius === 0) classes.push('rounded-none');
        else if (borderRadius === 2) classes.push('rounded-sm');
        else if (borderRadius === 4) classes.push('rounded');
        else if (borderRadius === 6) classes.push('rounded-md');
        else if (borderRadius === 8) classes.push('rounded-lg');
        else if (borderRadius === 12) classes.push('rounded-xl');
        else if (borderRadius === 16) classes.push('rounded-2xl');
        else if (value === '50%' || borderRadius >= 9999) classes.push('rounded-full');
        else classes.push(`rounded-[${value}]`);
        break;

      case 'border':
        if (value.includes('1px solid')) {
          const color = value.split('solid')[1]?.trim();
          if (color === '#000000' || color === 'black') classes.push('border border-black');
          else if (color === '#ffffff' || color === 'white') classes.push('border border-white');
          else if (color === '#6b7280') classes.push('border border-gray-500');
          else classes.push(`border border-[${color}]`);
        }
        break;

      // Position
      case 'position':
        if (value === 'relative') classes.push('relative');
        else if (value === 'absolute') classes.push('absolute');
        else if (value === 'fixed') classes.push('fixed');
        else if (value === 'sticky') classes.push('sticky');
        break;

      // Opacity
      case 'opacity':
        const opacity = parseFloat(value);
        if (opacity === 0) classes.push('opacity-0');
        else if (opacity === 0.25) classes.push('opacity-25');
        else if (opacity === 0.5) classes.push('opacity-50');
        else if (opacity === 0.75) classes.push('opacity-75');
        else if (opacity === 1) classes.push('opacity-100');
        else classes.push(`opacity-[${Math.round(opacity * 100)}]`);
        break;
    }
  }

  return classes.join(' ') || 'block';
}

function convertCSSToStyleObject(css: string): string {
  const lines = css.split('\n').filter(line => line.trim());
  const styleProps = lines.map(line => {
    const [prop, value] = line.split(':').map(s => s.trim());
    if (prop && value) {
      const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      return `    ${camelProp}: '${value.replace(';', '')}'`;
    }
    return '';
  }).filter(Boolean);
  
  return `{\n${styleProps.join(',\n')}\n  }`;
}
