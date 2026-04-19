import type { Tool } from "@modelcontextprotocol/sdk/types.js";

// Note: Using fetch which is available in Node.js 18+

export const pluginTools: Tool[] = [
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
  }
];

export async function handlePluginTool(name: string, args: any): Promise<any> {
  switch (name) {
    case "get_All_Layers_CSS":
      return await getAllLayersCSS(args);

    case "get_Basic_CSS":
      return await getBasicCSS(args);

    case "get_JSON":
      return await getJSON(args);

    case "get_figma_dev_history":
      return await getFigmaDevHistory(args);

    default:
      throw new Error(`Unknown plugin tool: ${name}`);
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

