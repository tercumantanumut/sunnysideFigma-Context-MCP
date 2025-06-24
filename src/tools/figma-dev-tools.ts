import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { figmaDevBridge } from "../figma-dev-bridge.js";
import { Logger } from "../utils/logger.js";

export const figmaDevTools: Tool[] = [
  {
    name: "get_figma_dev_code",
    description: "Get React + Tailwind code from Figma's official Dev Mode MCP Server. Works with current selection in Figma Desktop or specific node ID.",
    inputSchema: {
      type: "object",
      properties: {
        nodeId: {
          type: "string",
          description: "Optional Figma node ID. If not provided, uses current selection in Figma Desktop.",
          optional: true
        },
        format: {
          type: "string",
          description: "Output format: 'react', 'css', 'both'. Default is 'both'.",
          enum: ["react", "css", "both"],
          optional: true
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "get_figma_variable_definitions", 
    description: "Get design variables and tokens from Figma's Dev Mode (colors, spacing, typography, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        nodeId: {
          type: "string", 
          description: "Optional Figma node ID. If not provided, uses current selection in Figma Desktop.",
          optional: true
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "get_figma_assets",
    description: "Get image and SVG assets from Figma's Dev Mode with localhost URLs for direct use",
    inputSchema: {
      type: "object",
      properties: {
        nodeId: {
          type: "string",
          description: "Optional Figma node ID. If not provided, uses current selection in Figma Desktop.", 
          optional: true
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "check_figma_dev_connection",
    description: "Check if Figma's Dev Mode MCP Server is running and connected",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  }
];

export async function handleFigmaDevTool(name: string, args: any): Promise<any> {
  switch (name) {
    case "get_figma_dev_code":
      return await getFigmaDevCode(args);
    
    case "get_figma_variable_definitions":
      return await getFigmaVariableDefinitions(args);
    
    case "get_figma_assets":
      return await getFigmaAssets(args);
    
    case "check_figma_dev_connection":
      return await checkFigmaDevConnection();
    
    default:
      throw new Error(`Unknown Figma Dev tool: ${name}`);
  }
}

async function getFigmaDevCode(args: { nodeId?: string; format?: string }): Promise<any> {
  try {
    if (!figmaDevBridge.isConnected) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: "Figma Dev Mode MCP Server is not connected. Please:\n1. Open Figma Desktop App\n2. Go to Figma menu → Preferences → Enable Dev Mode MCP Server\n3. Make sure you have a design file open\n4. Try again"
        }]
      };
    }

    const format = args.format || 'both';
    const result = await figmaDevBridge.getCode(args.nodeId, format);
    
    // Handle different response formats
    let output = '';
    
    if (result && typeof result === 'object') {
      if (format === 'both') {
        const css = result.css || result.nativeCSS || 'No CSS available';
        const react = result.react || result.component || 'No React component available';
        
        output = `/* CSS (native Figma getCSSAsync()) */\n${css}\n\n/* React Component */\n${react}`;
      } else if (format === 'css') {
        output = result.css || result.nativeCSS || 'No CSS available';
      } else if (format === 'react') {
        output = result.react || result.component || 'No React component available';
      }
    } else if (typeof result === 'string') {
      output = result;
    } else {
      output = `Raw result:\n${JSON.stringify(result, null, 2)}`;
    }
    
    return {
      content: [{
        type: "text",
        text: output
      }]
    };
    
  } catch (error) {
    Logger.error('Error in getFigmaDevCode:', error);
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error getting code from Figma Dev Mode: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

async function getFigmaVariableDefinitions(args: { nodeId?: string }): Promise<any> {
  try {
    if (!figmaDevBridge.isConnected) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: "Figma Dev Mode MCP Server is not connected. Please enable it in Figma Desktop App."
        }]
      };
    }

    const result = await figmaDevBridge.getVariableDefs(args.nodeId);
    
    return {
      content: [{
        type: "text", 
        text: `Figma Design Variables:\n\n${JSON.stringify(result, null, 2)}`
      }]
    };
    
  } catch (error) {
    Logger.error('Error in getFigmaVariableDefinitions:', error);
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error getting variables from Figma Dev Mode: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

async function getFigmaAssets(args: { nodeId?: string }): Promise<any> {
  try {
    if (!figmaDevBridge.isConnected) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: "Figma Dev Mode MCP Server is not connected. Please enable it in Figma Desktop App."
        }]
      };
    }

    const result = await figmaDevBridge.getAssets(args.nodeId);
    
    return {
      content: [{
        type: "text",
        text: `Figma Assets:\n\n${JSON.stringify(result, null, 2)}\n\nNote: Use localhost URLs directly in your code - do not create placeholders!`
      }]
    };
    
  } catch (error) {
    Logger.error('Error in getFigmaAssets:', error);
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error getting assets from Figma Dev Mode: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

async function checkFigmaDevConnection(): Promise<any> {
  try {
    // Try to reconnect if not connected
    if (!figmaDevBridge.isConnected) {
      await figmaDevBridge.connect();
    }
    
    const status = figmaDevBridge.isConnected ? 'Connected' : 'Disconnected';
    const message = figmaDevBridge.isConnected 
      ? 'Figma Dev Mode MCP Server is connected and ready!'
      : 'Figma Dev Mode MCP Server is not available. Make sure:\n1. Figma Desktop App is running\n2. Dev Mode MCP Server is enabled in Preferences\n3. You have a design file open';
    
    return {
      content: [{
        type: "text",
        text: `Status: ${status}\n\n${message}`
      }]
    };
    
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Connection check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}
