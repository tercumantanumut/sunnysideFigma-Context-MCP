import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FigmaService, type FigmaAuthOptions } from "./services/figma.js";
import type { SimplifiedDesign } from "./services/simplify-node-response.js";
import yaml from "js-yaml";
import { Logger } from "./utils/logger.js";
import { pluginTools, handlePluginTool } from "./tools/plugin-tools.js";
import { figmaDevTools, handleFigmaDevTool } from "./tools/figma-dev-tools.js";

const serverInfo = {
  name: "Figma MCP Server",
  version: process.env.NPM_PACKAGE_VERSION ?? "unknown",
};

type CreateServerOptions = {
  isHTTP?: boolean;
  outputFormat?: "yaml" | "json";
};

function createServer(
  authOptions: FigmaAuthOptions,
  { isHTTP = false, outputFormat = "yaml" }: CreateServerOptions = {},
) {
  const server = new McpServer(serverInfo);
  // const figmaService = new FigmaService(figmaApiKey);
  const figmaService = new FigmaService(authOptions);
  registerTools(server, figmaService, outputFormat);

  Logger.isHTTP = isHTTP;

  return server;
}

function registerTools(
  server: McpServer,
  figmaService: FigmaService,
  outputFormat: "yaml" | "json",
): void {
  // Register plugin tools first
  registerPluginTools(server);

  // Register Figma Dev Mode bridge tools
  registerFigmaDevTools(server);
  // Tool to get file information
  server.tool(
    "get_figma_data",
    "When the nodeId cannot be obtained, obtain the layout information about the entire Figma file",
    {
      fileKey: z
        .string()
        .describe(
          "The key of the Figma file to fetch, often found in a provided URL like figma.com/(file|design)/<fileKey>/...",
        ),
      nodeId: z
        .string()
        .optional()
        .describe(
          "The ID of the node to fetch, often found as URL parameter node-id=<nodeId>, always use if provided",
        ),
      depth: z
        .number()
        .optional()
        .describe(
          "OPTIONAL. Do NOT use unless explicitly requested by the user. Controls how many levels deep to traverse the node tree,",
        ),
    },
    async ({ fileKey, nodeId, depth }) => {
      try {
        Logger.log(
          `Fetching ${
            depth ? `${depth} layers deep` : "all layers"
          } of ${nodeId ? `node ${nodeId} from file` : `full file`} ${fileKey}`,
        );

        let file: SimplifiedDesign;
        if (nodeId) {
          file = await figmaService.getNode(fileKey, nodeId, depth);
        } else {
          file = await figmaService.getFile(fileKey, depth);
        }

        Logger.log(`Successfully fetched file: ${file.name}`);
        const { nodes, globalVars, ...metadata } = file;

        const result = {
          metadata,
          nodes,
          globalVars,
        };

        Logger.log(`Generating ${outputFormat.toUpperCase()} result from file`);
        const formattedResult =
          outputFormat === "json" ? JSON.stringify(result, null, 2) : yaml.dump(result);

        Logger.log("Sending result to client");
        return {
          content: [{ type: "text", text: formattedResult }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error(`Error fetching file ${fileKey}:`, message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error fetching file: ${message}` }],
        };
      }
    },
  );

  // TODO: Clean up all image download related code, particularly getImages in Figma service
  // Tool to download images
  server.tool(
    "download_figma_images",
    "Download SVG and PNG images used in a Figma file based on the IDs of image or icon nodes",
    {
      fileKey: z.string().describe("The key of the Figma file containing the node"),
      nodes: z
        .object({
          nodeId: z
            .string()
            .describe("The ID of the Figma image node to fetch, formatted as 1234:5678"),
          imageRef: z
            .string()
            .optional()
            .describe(
              "If a node has an imageRef fill, you must include this variable. Leave blank when downloading Vector SVG images.",
            ),
          fileName: z.string().describe("The local name for saving the fetched file"),
        })
        .array()
        .describe("The nodes to fetch as images"),
      pngScale: z
        .number()
        .positive()
        .optional()
        .default(2)
        .describe(
          "Export scale for PNG images. Optional, defaults to 2 if not specified. Affects PNG images only.",
        ),
      localPath: z
        .string()
        .describe(
          "The absolute path to the directory where images are stored in the project. If the directory does not exist, it will be created. The format of this path should respect the directory format of the operating system you are running on. Don't use any special character escaping in the path name either.",
        ),
      svgOptions: z
        .object({
          outlineText: z
            .boolean()
            .optional()
            .default(true)
            .describe("Whether to outline text in SVG exports. Default is true."),
          includeId: z
            .boolean()
            .optional()
            .default(false)
            .describe("Whether to include IDs in SVG exports. Default is false."),
          simplifyStroke: z
            .boolean()
            .optional()
            .default(true)
            .describe("Whether to simplify strokes in SVG exports. Default is true."),
        })
        .optional()
        .default({})
        .describe("Options for SVG export"),
    },
    async ({ fileKey, nodes, localPath, svgOptions, pngScale }) => {
      try {
        const imageFills = nodes.filter(({ imageRef }) => !!imageRef) as {
          nodeId: string;
          imageRef: string;
          fileName: string;
        }[];
        const fillDownloads = figmaService.getImageFills(fileKey, imageFills, localPath);
        const renderRequests = nodes
          .filter(({ imageRef }) => !imageRef)
          .map(({ nodeId, fileName }) => ({
            nodeId,
            fileName,
            fileType: fileName.endsWith(".svg") ? ("svg" as const) : ("png" as const),
          }));

        const renderDownloads = figmaService.getImages(
          fileKey,
          renderRequests,
          localPath,
          pngScale,
          svgOptions,
        );

        const downloads = await Promise.all([fillDownloads, renderDownloads]).then(([f, r]) => [
          ...f,
          ...r,
        ]);

        // If any download fails, return false
        const saveSuccess = !downloads.find((success) => !success);
        return {
          content: [
            {
              type: "text",
              text: saveSuccess
                ? `Success, ${downloads.length} images downloaded: ${downloads.join(", ")}`
                : "Failed",
            },
          ],
        };
      } catch (error) {
        Logger.error(`Error downloading images from file ${fileKey}:`, error);
        return {
          isError: true,
          content: [{ type: "text", text: `Error downloading images: ${error}` }],
        };
      }
    },
  );
}

function registerPluginTools(server: McpServer): void {
  // Register get_figma_dev_code tool
  server.tool(
    "get_figma_dev_code",
    "Get the latest CSS and React code extracted from Figma via the plugin. This provides actual dev-mode code generation.",
    {
      format: z
        .enum(["css", "react", "both", "json"])
        .optional()
        .default("both")
        .describe("Format of code to return")
    },
    async (args) => {
      try {
        return await handlePluginTool("get_figma_dev_code", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in get_figma_dev_code:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register get_figma_dev_history tool
  server.tool(
    "get_figma_dev_history",
    "Get the history of dev code extractions from the Figma plugin",
    {
      limit: z
        .number()
        .min(1)
        .max(10)
        .optional()
        .default(5)
        .describe("Maximum number of history items to return")
    },
    async (args) => {
      try {
        return await handlePluginTool("get_figma_dev_history", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in get_figma_dev_history:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register generate_component_from_figma tool
  server.tool(
    "generate_component_from_figma",
    "Generate a complete React component with styling from the latest Figma dev data",
    {
      componentName: z
        .string()
        .optional()
        .describe("Name for the generated component (optional, will use Figma node name if not provided)"),
      styleType: z
        .enum(["css-modules", "styled-components", "tailwind", "inline"])
        .optional()
        .default("css-modules")
        .describe("Type of styling to generate"),
      includeChildren: z
        .boolean()
        .optional()
        .default(true)
        .describe("Whether to include child components")
    },
    async (args) => {
      try {
        return await handlePluginTool("generate_component_from_figma", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in generate_component_from_figma:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register get_All_Layers_CSS tool
  server.tool(
    "get_All_Layers_CSS",
    "Get comprehensive CSS for all layers from the latest Figma extraction (like Figma's 'Copy all layers as CSS'). This provides pixel-perfect CSS for every element in the design.",
    {
      formatted: z
        .boolean()
        .optional()
        .default(true)
        .describe("Whether to return formatted CSS with comments")
    },
    async (args) => {
      try {
        return await handlePluginTool("get_All_Layers_CSS", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in get_All_Layers_CSS:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register get_Basic_CSS tool
  server.tool(
    "get_Basic_CSS",
    "Get basic CSS for the main selected element from the latest Figma extraction",
    {
      includeClassName: z
        .boolean()
        .optional()
        .default(true)
        .describe("Whether to include the CSS class name wrapper")
    },
    async (args) => {
      try {
        return await handlePluginTool("get_Basic_CSS", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in get_Basic_CSS:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register get_React tool
  server.tool(
    "get_React",
    "Get the complete React component structure from the latest Figma extraction with full component hierarchy",
    {
      includeCSS: z
        .boolean()
        .optional()
        .default(true)
        .describe("Whether to include the comprehensive CSS in the component"),
      componentFormat: z
        .enum(["functional", "class", "arrow"])
        .optional()
        .default("functional")
        .describe("React component format to use")
    },
    async (args) => {
      try {
        return await handlePluginTool("get_React", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in get_React:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register get_JSON tool
  server.tool(
    "get_JSON",
    "Get the raw JSON data from the latest Figma extraction with complete layout and styling information",
    {
      includeChildren: z
        .boolean()
        .optional()
        .default(true)
        .describe("Whether to include child elements data"),
      pretty: z
        .boolean()
        .optional()
        .default(true)
        .describe("Whether to format JSON with indentation")
    },
    async (args) => {
      try {
        return await handlePluginTool("get_JSON", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in get_JSON:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register get_UI_Screenshots tool
  server.tool(
    "get_UI_Screenshots",
    "Get information about UI screenshots and visual assets from the Figma extraction",
    {
      includeImageData: z
        .boolean()
        .optional()
        .default(false)
        .describe("Whether to include base64 image data (if available)")
    },
    async (args) => {
      try {
        return await handlePluginTool("get_UI_Screenshots", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in get_UI_Screenshots:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // 🎨 PICASSO-LEVEL: Register generate_typescript_component tool
  server.tool(
    "generate_typescript_component",
    "🎨 PICASSO-LEVEL: Generate production-ready TypeScript React component from Figma data with advanced features",
    {
      componentName: z
        .string()
        .optional()
        .describe("Custom name for the component (optional, will sanitize Figma name if not provided)"),
      styleType: z
        .enum(["css-modules", "styled-components", "tailwind", "inline"])
        .optional()
        .default("css-modules")
        .describe("Type of styling to generate"),
      componentFormat: z
        .enum(["functional", "class", "arrow"])
        .optional()
        .default("functional")
        .describe("React component format"),
      includeTypes: z
        .boolean()
        .optional()
        .default(true)
        .describe("Generate TypeScript interfaces and types"),
      includeTests: z
        .boolean()
        .optional()
        .default(true)
        .describe("Generate Jest test files"),
      includeStories: z
        .boolean()
        .optional()
        .default(true)
        .describe("Generate Storybook stories"),
      exportFormat: z
        .enum(["default", "named", "both"])
        .optional()
        .default("default")
        .describe("Export format for the component")
    },
    async (args) => {
      try {
        return await handlePluginTool("generate_typescript_component", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in generate_typescript_component:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // 🏗️ ARCHITECT: Register generate_project_structure tool
  server.tool(
    "generate_project_structure",
    "🏗️ ARCHITECT: Generate complete project structure with multiple components, tests, and configuration",
    {
      projectName: z
        .string()
        .optional()
        .default("figma-components")
        .describe("Name for the generated project"),
      styleType: z
        .enum(["css-modules", "styled-components", "tailwind", "inline"])
        .optional()
        .default("css-modules")
        .describe("Styling approach for all components"),
      includeConfig: z
        .boolean()
        .optional()
        .default(true)
        .describe("Include package.json, tsconfig.json, and other config files"),
      includeTests: z
        .boolean()
        .optional()
        .default(true)
        .describe("Include test files for all components"),
      includeStorybook: z
        .boolean()
        .optional()
        .default(true)
        .describe("Include Storybook configuration and stories")
    },
    async (args) => {
      try {
        return await handlePluginTool("generate_project_structure", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in generate_project_structure:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );
}

function registerFigmaDevTools(server: McpServer): void {
  // Register get_figma_dev_mode_code tool
  server.tool(
    "get_figma_dev_mode_code",
    "Get React + Tailwind code from Figma's official Dev Mode MCP Server. Works with current selection in Figma Desktop or specific node ID.",
    {
      nodeId: z
        .string()
        .optional()
        .describe("Optional Figma node ID. If not provided, uses current selection in Figma Desktop.")
    },
    async (args) => {
      try {
        return await handleFigmaDevTool("get_figma_dev_mode_code", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in get_figma_dev_mode_code:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register check_figma_dev_connection tool
  server.tool(
    "check_figma_dev_connection",
    "Check if Figma's Dev Mode MCP Server is running and connected",
    {},
    async (args) => {
      try {
        return await handleFigmaDevTool("check_figma_dev_connection", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in check_figma_dev_connection:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );
}

export { createServer };
