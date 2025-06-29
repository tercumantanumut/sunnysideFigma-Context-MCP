import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { FigmaDevData } from "../plugin-integration.js";
import { ComponentGenerator } from "../transformers/component-generator.js";

// Note: Using fetch which is available in Node.js 18+

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
        const css = convertCSSObjectToString(devData.nativeCSS) || devData.css;
        const cssSource = devData.nativeCSS ? "native Figma getCSSAsync()" : "fallback generator";
        if (devData.allLayersCSS) {
          content = `/* All Layers CSS for ${devData.name} (${cssSource}) */\n${devData.allLayersCSS}`;
        } else {
          content = `/* CSS for ${devData.name} (${cssSource}) */\n.${devData.name.toLowerCase().replace(/\s+/g, '-')} {\n  ${css}\n}`;
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
        const mainCSS = convertCSSObjectToString(devData.nativeCSS) || devData.css;
        const source = devData.nativeCSS ? "native Figma getCSSAsync()" : "fallback generator";
        const cssContent = devData.allLayersCSS || `/* CSS (${source}) */\n.${devData.name.toLowerCase().replace(/\s+/g, '-')} {\n  ${mainCSS}\n}`;
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
            text: data.content || "No React component content available"
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
    } else {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `HTTP server returned status ${response.status}. Make sure the Figma plugin HTTP server is running on localhost:3333`
        }]
      };
    }
  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error fetching React component: ${error instanceof Error ? error.message : 'Unknown error'}. Make sure the Figma plugin HTTP server is running on localhost:3333`
      }]
    };
  }
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
            text: data.content || "No JSON data content available"
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
    } else {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `HTTP server returned status ${response.status}. Make sure the Figma plugin HTTP server is running on localhost:3333`
        }]
      };
    }
  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error fetching JSON data: ${error instanceof Error ? error.message : 'Unknown error'}. Make sure the Figma plugin HTTP server is running on localhost:3333`
      }]
    };
  }
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

    const response_data = await response.json();
    if (!response_data.success) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: response_data.message || "Failed to fetch dev data"
        }]
      };
    }

    const devData = response_data.data;

    const generator = new ComponentGenerator();
    const generated = generator.generateCleanComponent(devData, {
      styleType: args.styleType as any || 'css-modules',
      componentName: args.componentName,
      includeChildren: args.includeChildren !== false
    });

    let output = generated.component;
    if (generated.styles) {
      const styleExt = args.styleType === 'css-modules' ? 'module.css' : 'css';
      const componentName = args.componentName || toPascalCase(devData.name);
      output += `\n\n/* ${componentName}.${styleExt} */\n${generated.styles}`;
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




function toPascalCase(str: string): string {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
    return word.toUpperCase();
  }).replace(/\s+/g, '');
}

