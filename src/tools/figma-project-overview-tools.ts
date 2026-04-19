import { z } from "zod";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { FigmaService } from "../services/figma.js";
import { getLatestDevData, getLatestProjectOverview } from "../plugin-integration.js";
import { Logger } from "../utils/logger.js";
import type { SimplifiedFill } from "../services/simplify-node-response.js";
import type { SimplifiedComponentDefinition } from "../utils/sanitization.js";
import type { ColorToken, FrameSummary } from "./shared/figma-types.js";

// Data structures for project overview
export interface ComponentInfo {
  id: string;
  name: string;
  description?: string;
  type: string;
  instances?: number;
}

export interface ComponentSetInfo {
  id: string;
  name: string;
  description?: string;
  variants: number;
}

export interface PageOverview {
  id: string;
  name: string;
  thumbnailUrl?: string;
  frameCount: number;
  frames: FrameSummary[];
}

interface ComponentAnalysisRow {
  id: string;
  name: string;
  description?: string;
  type: "COMPONENT" | "COMPONENT_SET";
  instances: number;
  hasVariants: boolean;
  variantCount?: number;
}

export interface PrototypeFlow {
  name: string;
  startFrame: string;
  connections: number;
  frames: string[];
}

export interface FigmaProjectOverview {
  // File metadata
  file: {
    key: string;
    name: string;
    lastModified: string;
    version?: string;
    thumbnailUrl: string;
    editorType?: string;
  };
  
  // Document structure
  structure: {
    pages: PageOverview[];
    totalElements: number;
    depth: number;
  };
  
  // Component library
  components: {
    components: Record<string, ComponentInfo>;
    componentSets: Record<string, ComponentSetInfo>;
    usage: {
      mostUsed: Array<{componentId: string; name: string; count: number}>;
      totalInstances: number;
    };
  };
  
  // Design system
  designSystem: {
    colors: ColorToken[];
    textStyles: Array<{name: string; id: string; properties: Record<string, unknown>}>;
    effects: Array<{name: string; id: string; type: string}>;
    variables: Record<string, unknown>;
  };
  
  // Prototypes
  prototypes?: {
    flows: PrototypeFlow[];
    totalConnections: number;
  };
  
  // Statistics
  stats: {
    totalPages: number;
    totalFrames: number;
    totalComponents: number;
    totalComponentSets: number;
    totalInstances: number;
    totalTextLayers: number;
    totalImages: number;
    uniqueStyles: number;
  };
}

// Zod schemas used for argument inference inside handler functions.
const projectOverviewArgsSchema = z.object({
  fileKey: z.string().describe("The Figma file key to analyze"),
  includePages: z.boolean().optional().default(true).describe("Include detailed page structure"),
  includeThumbnails: z.boolean().optional().default(false).describe("Include thumbnail URLs (requires additional API calls)"),
  includePrototypes: z.boolean().optional().default(true).describe("Include prototype flow analysis"),
  includeStats: z.boolean().optional().default(true).describe("Include usage statistics"),
  depth: z.number().optional().default(2).describe("How deep to traverse the node tree (1-3)"),
  outputFormat: z.enum(["structured", "summary", "visual"]).optional().default("structured").describe("Output format style"),
});

const pageStructureArgsSchema = z.object({
  fileKey: z.string().describe("The Figma file key"),
  pageNames: z.array(z.string()).optional().describe("Specific page names to analyze (empty = all pages)"),
  includeFrameDetails: z.boolean().optional().default(true).describe("Include detailed frame information"),
  maxDepth: z.number().optional().default(3).describe("Maximum depth to traverse"),
});

const analyzeComponentsArgsSchema = z.object({
  fileKey: z.string().describe("The Figma file key"),
  sortBy: z.enum(["usage", "name", "modified"]).optional().default("usage").describe("How to sort components"),
  includeVariants: z.boolean().optional().default(true).describe("Include component variants analysis"),
  limit: z.number().optional().default(50).describe("Maximum number of components to return"),
});

const pluginProjectOverviewArgsSchema = z.object({
  outputFormat: z.enum(["structured", "summary", "visual"]).optional().default("visual").describe("Output format style"),
});

// Tool schemas
export const figmaProjectOverviewTools: Tool[] = [
  {
    name: "get_figma_project_overview",
    description:
      "Get comprehensive overview of entire Figma file including structure, components, design system, and statistics. Perfect for understanding the complete project context.",
    inputSchema: {
      type: "object",
      properties: {
        fileKey: { type: "string", description: "The Figma file key to analyze" },
        includePages: { type: "boolean", default: true, description: "Include detailed page structure" },
        includeThumbnails: { type: "boolean", default: false, description: "Include thumbnail URLs (requires additional API calls)" },
        includePrototypes: { type: "boolean", default: true, description: "Include prototype flow analysis" },
        includeStats: { type: "boolean", default: true, description: "Include usage statistics" },
        depth: { type: "number", default: 2, description: "How deep to traverse the node tree (1-3)" },
        outputFormat: { type: "string", enum: ["structured", "summary", "visual"], default: "structured", description: "Output format style" },
      },
      required: ["fileKey"],
    },
  },
  {
    name: "get_figma_page_structure",
    description: "Get detailed structure of specific pages in a Figma file with frame hierarchy",
    inputSchema: {
      type: "object",
      properties: {
        fileKey: { type: "string", description: "The Figma file key" },
        pageNames: { type: "array", items: { type: "string" }, description: "Specific page names to analyze (empty = all pages)" },
        includeFrameDetails: { type: "boolean", default: true, description: "Include detailed frame information" },
        maxDepth: { type: "number", default: 3, description: "Maximum depth to traverse" },
      },
      required: ["fileKey"],
    },
  },
  {
    name: "analyze_figma_components",
    description: "Analyze component library usage and organization in a Figma file",
    inputSchema: {
      type: "object",
      properties: {
        fileKey: { type: "string", description: "The Figma file key" },
        sortBy: { type: "string", enum: ["usage", "name", "modified"], default: "usage", description: "How to sort components" },
        includeVariants: { type: "boolean", default: true, description: "Include component variants analysis"  },
        limit: { type: "number", default: 50, description: "Maximum number of components to return" },
      },
      required: ["fileKey"],
    },
  },
  {
    name: "get_plugin_project_overview",
    description:
      "Get the project overview data directly from the Figma plugin scan. This provides the exact statistics shown in the plugin UI including all pages, frames, and instances.",
    inputSchema: {
      type: "object",
      properties: {
        outputFormat: { type: "string", enum: ["structured", "summary", "visual"], default: "visual", description: "Output format style" },
      },
    },
  },
];

// Handler functions
export async function handleProjectOverviewTool(
  toolName: string,
  args: any,
  figmaService: FigmaService
): Promise<any> {
  switch (toolName) {
    case "get_figma_project_overview":
      return await getProjectOverview(args, figmaService);
    case "get_figma_page_structure":
      return await getPageStructure(args, figmaService);
    case "analyze_figma_components":
      return await analyzeComponents(args, figmaService);
    case "get_plugin_project_overview":
      return await getPluginProjectOverview(args);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

async function getProjectOverview(
  args: z.infer<typeof projectOverviewArgsSchema>,
  figmaService: FigmaService
): Promise<any> {
  try {
    const { fileKey, includePages, includeThumbnails, includePrototypes, includeStats, depth, outputFormat } = args;
    
    Logger.important(`Fetching project overview for file ${fileKey}`);
    
    // First check if we have recent project overview from plugin
    const pluginProjectData = getLatestProjectOverview();
    const hasPluginData = pluginProjectData && pluginProjectData.file?.key === fileKey;
    
    if (hasPluginData) {
      Logger.log(`Using plugin project overview data for file ${fileKey}`);
    }
    
    // Also check for dev data (for backward compatibility)
    const pluginData = getLatestDevData();
    
    // Fetch file data from Figma API
    const fileData = await figmaService.getFile(fileKey, depth);
    
    // Build project overview, preferring plugin data when available
    const overview: FigmaProjectOverview = {
      file: {
        key: fileKey,
        name: hasPluginData ? pluginProjectData.file.name : fileData.name,
        lastModified: hasPluginData ? pluginProjectData.file.lastModified : fileData.lastModified,
        thumbnailUrl: fileData.thumbnailUrl,
        editorType: hasPluginData ? pluginProjectData.file.editorType : (pluginData?.fileKey === fileKey ? "dev" : undefined)
      },
      structure: {
        pages: hasPluginData ? pluginProjectData.structure.pages : [],
        totalElements: hasPluginData ? pluginProjectData.structure.totalElements : 0,
        depth: depth
      },
      components: {
        components: hasPluginData && pluginProjectData.components ? pluginProjectData.components.components : (fileData.components || {}),
        componentSets: hasPluginData && pluginProjectData.components ? pluginProjectData.components.componentSets : (fileData.componentSets || {}),
        usage: {
          mostUsed: hasPluginData && pluginProjectData.components ? pluginProjectData.components.usage.mostUsed : [],
          totalInstances: hasPluginData && pluginProjectData.components ? pluginProjectData.components.usage.totalInstances : 0
        }
      },
      designSystem: {
        colors: hasPluginData && pluginProjectData.designSystem ? pluginProjectData.designSystem.colors : [],
        textStyles: hasPluginData && pluginProjectData.designSystem ? pluginProjectData.designSystem.textStyles : [],
        effects: hasPluginData && pluginProjectData.designSystem ? pluginProjectData.designSystem.effects : [],
        variables: hasPluginData && pluginProjectData.designSystem ? pluginProjectData.designSystem.variables : (fileData.globalVars?.styles || {})
      },
      stats: {
        totalPages: hasPluginData ? pluginProjectData.stats.totalPages : 0,
        totalFrames: hasPluginData ? pluginProjectData.stats.totalFrames : 0,
        totalComponents: hasPluginData ? pluginProjectData.stats.totalComponents : Object.keys(fileData.components || {}).length,
        totalComponentSets: hasPluginData ? pluginProjectData.stats.totalComponentSets : Object.keys(fileData.componentSets || {}).length,
        totalInstances: hasPluginData ? pluginProjectData.stats.totalInstances : 0,
        totalTextLayers: hasPluginData ? pluginProjectData.stats.totalTextLayers : 0,
        totalImages: hasPluginData ? pluginProjectData.stats.totalImages : 0,
        uniqueStyles: hasPluginData ? pluginProjectData.stats.uniqueStyles : Object.keys(fileData.globalVars?.styles || {}).length
      }
    };
    
    // Process pages if requested and not already available from plugin
    if (includePages && !hasPluginData && fileData.nodes) {
      const pageOverviews = processPages(fileData.nodes, includeThumbnails);
      overview.structure.pages = pageOverviews;
      overview.stats.totalPages = pageOverviews.length;
      overview.stats.totalFrames = pageOverviews.reduce((sum, page) => sum + page.frameCount, 0);
    }
    
    // Count total elements and analyze component usage (only if no plugin data)
    if (!hasPluginData && fileData.nodes) {
      const analysis = analyzeNodeTree(fileData.nodes);
      overview.structure.totalElements = analysis.totalElements;
      overview.stats.totalInstances = analysis.totalInstances;
      overview.stats.totalTextLayers = analysis.totalTextLayers;
      overview.stats.totalImages = analysis.totalImages;
      
      // Calculate most used components
      const componentUsage = analysis.componentUsage;
      const sortedUsage = Object.entries(componentUsage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([id, count]) => ({
          componentId: id,
          name: fileData.components?.[id]?.name || id,
          count
        }));
      overview.components.usage.mostUsed = sortedUsage;
      overview.components.usage.totalInstances = analysis.totalInstances;
    }
    
    // Extract design system information
    if (fileData.globalVars?.styles) {
      const styles = fileData.globalVars.styles;
      for (const [id, style] of Object.entries(styles)) {
        if (Array.isArray(style)) {
          // This is a fill style (color)
          const value = fillToHex(style[0]);
          if (value) {
            overview.designSystem.colors.push({
              id,
              name: `Color ${id}`,
              value,
            });
          }
        } else if (typeof style === "object" && style !== null && "fontFamily" in style) {
          // This is a text style
          overview.designSystem.textStyles.push({
            name: `Text Style ${id}`,
            id,
            properties: style as Record<string, unknown>,
          });
        }
      }
    }
    
    // Format output based on requested format
    let formattedOutput: string;
    switch (outputFormat) {
      case "summary":
        formattedOutput = formatProjectSummary(overview);
        break;
      case "visual":
        formattedOutput = formatVisualOverview(overview);
        break;
      case "structured":
      default:
        formattedOutput = JSON.stringify(overview, null, 2);
        break;
    }
    
    Logger.log(`Project overview generated for ${fileData.name}`);
    
    return {
      content: [{ type: "text", text: formattedOutput }]
    };
    
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    Logger.error(`Error getting project overview:`, message);
    return {
      isError: true,
      content: [{ type: "text", text: `Error: ${message}` }]
    };
  }
}

async function getPageStructure(
  args: z.infer<typeof pageStructureArgsSchema>,
  figmaService: FigmaService
): Promise<any> {
  try {
    const { fileKey, pageNames, includeFrameDetails, maxDepth } = args;
    
    Logger.log(`Fetching page structure for file ${fileKey}`);
    
    const fileData = await figmaService.getFile(fileKey, maxDepth);
    
    let pagesToProcess = fileData.nodes || [];
    
    // Filter pages if specific names provided
    if (pageNames && pageNames.length > 0) {
      pagesToProcess = pagesToProcess.filter(node => 
        node.type === "CANVAS" && pageNames.includes(node.name)
      );
    }
    
    const pageStructures = pagesToProcess
      .filter(node => node.type === "CANVAS")
      .map(page => processPageStructure(page, includeFrameDetails, maxDepth));
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify({
          fileKey,
          fileName: fileData.name,
          pages: pageStructures,
          totalPages: pageStructures.length
        }, null, 2)
      }]
    };
    
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    Logger.error(`Error getting page structure:`, message);
    return {
      isError: true,
      content: [{ type: "text", text: `Error: ${message}` }]
    };
  }
}

async function analyzeComponents(
  args: z.infer<typeof analyzeComponentsArgsSchema>,
  figmaService: FigmaService
): Promise<any> {
  try {
    const { fileKey, sortBy, includeVariants, limit } = args;
    
    Logger.log(`Analyzing components for file ${fileKey}`);
    
    const fileData = await figmaService.getFile(fileKey, 1);
    
    // Analyze component usage
    const componentAnalysis: ComponentAnalysisRow[] = [];
    const components = fileData.components || {};
    const componentSets = fileData.componentSets || {};

    // Count component instances
    const instanceCounts: Record<string, number> = {};
    if (fileData.nodes) {
      countComponentInstances(fileData.nodes, instanceCounts);
    }

    // Process regular components
    for (const [id, component] of Object.entries(components)) {
      componentAnalysis.push({
        id,
        name: component.name,
        type: "COMPONENT",
        instances: instanceCounts[id] || 0,
        hasVariants: false,
      });
    }

    // Process component sets if requested
    if (includeVariants) {
      for (const [id, componentSet] of Object.entries(componentSets)) {
        // Variants are no longer attached to the component set; derive the
        // count from the components that reference this set via componentSetId.
        const variantCount = Object.values(components).filter(
          (c: SimplifiedComponentDefinition) => c.componentSetId === id,
        ).length;
        componentAnalysis.push({
          id,
          name: componentSet.name,
          description: componentSet.description,
          type: "COMPONENT_SET",
          instances: instanceCounts[id] || 0,
          hasVariants: true,
          variantCount,
        });
      }
    }
    
    // Sort components
    componentAnalysis.sort((a, b) => {
      switch (sortBy) {
        case "usage":
          return b.instances - a.instances;
        case "name":
          return a.name.localeCompare(b.name);
        case "modified":
          // Would need modification date from API
          return 0;
        default:
          return 0;
      }
    });
    
    // Apply limit
    const limitedAnalysis = componentAnalysis.slice(0, limit);
    
    const result = {
      fileKey,
      fileName: fileData.name,
      totalComponents: Object.keys(components).length,
      totalComponentSets: Object.keys(componentSets).length,
      analyzed: limitedAnalysis.length,
      sortedBy: sortBy,
      components: limitedAnalysis
    };
    
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
    
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    Logger.error(`Error analyzing components:`, message);
    return {
      isError: true,
      content: [{ type: "text", text: `Error: ${message}` }]
    };
  }
}

// Helper functions
function processPages(nodes: any[], includeThumbnails: boolean): PageOverview[] {
  const pages: PageOverview[] = [];
  
  for (const node of nodes) {
    if (node.type === "CANVAS") {
      const frames: FrameSummary[] = (node.children || [])
        .filter((child: any) => child.type === "FRAME" || child.type === "COMPONENT" || child.type === "INSTANCE")
        .map((frame: any): FrameSummary => ({
          id: frame.id,
          name: frame.name,
          type: frame.type,
          childCount: frame.children?.length || 0,
          hasPrototype: !!frame.transitionNodeID,
          width: frame.boundingBox?.width,
          height: frame.boundingBox?.height,
        }));
      
      pages.push({
        id: node.id,
        name: node.name,
        thumbnailUrl: includeThumbnails ? node.thumbnailUrl : undefined,
        frameCount: frames.length,
        frames: frames
      });
    }
  }
  
  return pages;
}

function analyzeNodeTree(nodes: any[]): {
  totalElements: number;
  totalInstances: number;
  totalTextLayers: number;
  totalImages: number;
  componentUsage: Record<string, number>;
} {
  let totalElements = 0;
  let totalInstances = 0;
  let totalTextLayers = 0;
  let totalImages = 0;
  const componentUsage: Record<string, number> = {};
  
  function traverse(node: any) {
    totalElements++;
    
    if (node.type === "INSTANCE" && node.componentId) {
      totalInstances++;
      componentUsage[node.componentId] = (componentUsage[node.componentId] || 0) + 1;
    }
    
    if (node.type === "TEXT") {
      totalTextLayers++;
    }
    
    if (node.fills && Array.isArray(node.fills)) {
      for (const fill of node.fills) {
        if (fill.type === "IMAGE") {
          totalImages++;
        }
      }
    }
    
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }
  
  for (const node of nodes) {
    traverse(node);
  }
  
  return {
    totalElements,
    totalInstances,
    totalTextLayers,
    totalImages,
    componentUsage
  };
}

function processPageStructure(page: any, includeDetails: boolean, maxDepth: number): any {
  const structure: any = {
    id: page.id,
    name: page.name,
    type: page.type,
    childCount: page.children?.length || 0
  };
  
  if (includeDetails && page.children) {
    structure.frames = page.children
      .filter((child: any) => child.type === "FRAME" || child.type === "COMPONENT")
      .map((frame: any) => ({
        id: frame.id,
        name: frame.name,
        type: frame.type,
        width: frame.boundingBox?.width,
        height: frame.boundingBox?.height,
        childCount: frame.children?.length || 0,
        hasAutoLayout: !!frame.layoutMode,
        hasPrototype: !!frame.transitionNodeID
      }));
  }
  
  return structure;
}

function countComponentInstances(nodes: any[], counts: Record<string, number>): void {
  function traverse(node: any) {
    if (node.type === "INSTANCE" && node.componentId) {
      counts[node.componentId] = (counts[node.componentId] || 0) + 1;
    }
    
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }
  
  for (const node of nodes) {
    traverse(node);
  }
}

function formatProjectSummary(overview: FigmaProjectOverview): string {
  return `# Figma Project Overview: ${overview.file.name}

## File Information
- Key: ${overview.file.key}
- Last Modified: ${overview.file.lastModified}
- Thumbnail: ${overview.file.thumbnailUrl}

## Structure
- Pages: ${overview.stats.totalPages}
- Frames: ${overview.stats.totalFrames}
- Total Elements: ${overview.structure.totalElements}

## Component Library
- Components: ${overview.stats.totalComponents}
- Component Sets: ${overview.stats.totalComponentSets}
- Total Instances: ${overview.stats.totalInstances}

### Most Used Components
${overview.components.usage.mostUsed.map(c => `- ${c.name}: ${c.count} instances`).join('\n')}

## Design System
- Colors: ${overview.designSystem.colors.length}
- Text Styles: ${overview.designSystem.textStyles.length}
- Effects: ${overview.designSystem.effects.length}
- Variables: ${Object.keys(overview.designSystem.variables).length}

## Content Statistics
- Text Layers: ${overview.stats.totalTextLayers}
- Images: ${overview.stats.totalImages}
- Unique Styles: ${overview.stats.uniqueStyles}

## Pages
${overview.structure.pages.map(page => `
### ${page.name}
- Frames: ${page.frameCount}
- Top frames: ${page.frames.slice(0, 5).map(f => f.name).join(', ')}${page.frames.length > 5 ? '...' : ''}
`).join('\n')}`;
}

function formatVisualOverview(overview: FigmaProjectOverview): string {
  let visual = `🎨 ${overview.file.name}\n`;
  visual += `${'─'.repeat(40)}\n\n`;
  
  visual += `📊 Quick Stats\n`;
  visual += `├─ 📄 Pages: ${overview.stats.totalPages}\n`;
  visual += `├─ 🖼️  Frames: ${overview.stats.totalFrames}\n`;
  visual += `├─ 🧩 Components: ${overview.stats.totalComponents}\n`;
  visual += `├─ 📦 Instances: ${overview.stats.totalInstances}\n`;
  visual += `└─ 🎨 Styles: ${overview.stats.uniqueStyles}\n\n`;
  
  visual += `📂 Page Structure\n`;
  overview.structure.pages.forEach((page, i) => {
    const isLast = i === overview.structure.pages.length - 1;
    visual += `${isLast ? '└─' : '├─'} 📄 ${page.name} (${page.frameCount} frames)\n`;
    
    page.frames.slice(0, 3).forEach((frame, j) => {
      const isFrameLast = j === Math.min(2, page.frames.length - 1);
      visual += `${isLast ? '   ' : '│  '}${isFrameLast ? '└─' : '├─'} 🖼️  ${frame.name}\n`;
    });
    
    if (page.frames.length > 3) {
      visual += `${isLast ? '   ' : '│  '}└─ ... ${page.frames.length - 3} more\n`;
    }
  });
  
  visual += `\n🏆 Top Components\n`;
  overview.components.usage.mostUsed.slice(0, 5).forEach((comp, i) => {
    const isLast = i === Math.min(4, overview.components.usage.mostUsed.length - 1);
    visual += `${isLast ? '└─' : '├─'} ${comp.name} (${comp.count}x)\n`;
  });
  
  return visual;
}

async function getPluginProjectOverview(
  args: z.infer<typeof pluginProjectOverviewArgsSchema>
): Promise<any> {
  try {
    const { outputFormat } = args;

    Logger.log(`Getting plugin project overview`);

    // Fetch from HTTP server (where Figma plugin sends data) - same approach as working tools
    const response = await fetch(`http://localhost:3333/plugin/latest-project-overview`);

    if (!response.ok) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: "No project overview available from plugin. Please scan a project in Figma first using the 'Scan Entire Project' button."
        }]
      };
    }

    const result = await response.json();
    if (!result.success || !result.data) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: "No project overview available from plugin. Please scan a project in Figma first using the 'Scan Entire Project' button."
        }]
      };
    }

    const projectData = result.data;
    
    // Format output based on requested format
    let formattedOutput: string;
    switch (outputFormat) {
      case "summary":
        formattedOutput = formatProjectSummary(projectData);
        break;
      case "visual":
        formattedOutput = formatVisualOverview(projectData);
        break;
      case "structured":
      default:
        formattedOutput = JSON.stringify(projectData, null, 2);
        break;
    }
    
    Logger.log(`Plugin project overview retrieved successfully`);
    
    return {
      content: [{ type: "text", text: formattedOutput }]
    };
    
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    Logger.error(`Error getting plugin project overview:`, message);
    return {
      isError: true,
      content: [{ type: "text", text: `Error: ${message}` }]
    };
  }
}

/**
 * Reduce a SimplifiedFill (object variant or template-literal color string) to
 * a CSS color string. Returns null when no usable color is available.
 */
function fillToHex(fill: SimplifiedFill | undefined): string | null {
  if (!fill) return null;
  if (typeof fill === "string") {
    // Already a CSS color literal (e.g. `#aabbcc` or `rgba(...)`).
    return fill;
  }
  if (fill.hex) return fill.hex;
  if (fill.rgba) return fill.rgba;
  return null;
}