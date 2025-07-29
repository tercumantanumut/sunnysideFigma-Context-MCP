import fs from "fs";
import { parseFigmaResponse, type SimplifiedDesign } from "./simplify-node-response.js";
import type {
  GetImagesResponse,
  GetFileResponse,
  GetFileNodesResponse,
  GetImageFillsResponse,
} from "@figma/rest-api-spec";
import { downloadFigmaImage } from "~/utils/common.js";
import { Logger } from "~/utils/logger.js";
import { fetchWithRetry } from "~/utils/fetch-with-retry.js";
import yaml from "js-yaml";

export type FigmaAuthOptions = {
  figmaApiKey: string;
  figmaOAuthToken: string;
  useOAuth: boolean;
};

type FetchImageParams = {
  /**
   * The Node in Figma that will either be rendered or have its background image downloaded
   */
  nodeId: string;
  /**
   * The local file name to save the image
   */
  fileName: string;
  /**
   * The file mimetype for the image
   */
  fileType: "png" | "svg";
};

type FetchImageFillParams = Omit<FetchImageParams, "fileType"> & {
  /**
   * Required to grab the background image when an image is used as a fill
   */
  imageRef: string;
};

export class FigmaService {
  private readonly apiKey: string;
  private readonly oauthToken: string;
  private readonly useOAuth: boolean;
  private readonly baseUrl = "https://api.figma.com/v1";

  constructor({ figmaApiKey, figmaOAuthToken, useOAuth }: FigmaAuthOptions) {
    this.apiKey = figmaApiKey || "";
    this.oauthToken = figmaOAuthToken || "";
    this.useOAuth = !!useOAuth && !!this.oauthToken;
  }

  private async request<T>(endpoint: string): Promise<T> {
    try {
      Logger.log(`Calling ${this.baseUrl}${endpoint}`);

      // Set auth headers based on authentication method
      const headers: Record<string, string> = {};

      if (this.useOAuth) {
        // Use OAuth token with Authorization: Bearer header
        Logger.log("Using OAuth Bearer token for authentication");
        headers["Authorization"] = `Bearer ${this.oauthToken}`;
      } else {
        // Use Personal Access Token with X-Figma-Token header
        Logger.log("Using Personal Access Token for authentication");
        headers["X-Figma-Token"] = this.apiKey;
      }

      return await fetchWithRetry<T>(`${this.baseUrl}${endpoint}`, {
        headers,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to make request to Figma API: ${error.message}`);
      }
      throw new Error(`Failed to make request to Figma API: ${error}`);
    }
  }

  async getImageFills(
    fileKey: string,
    nodes: FetchImageFillParams[],
    localPath: string,
  ): Promise<string[]> {
    if (nodes.length === 0) return [];

    let promises: Promise<string>[] = [];
    const endpoint = `/files/${fileKey}/images`;
    const file = await this.request<GetImageFillsResponse>(endpoint);
    const { images = {} } = file.meta;
    promises = nodes.map(async ({ imageRef, fileName }) => {
      const imageUrl = images[imageRef];
      if (!imageUrl) {
        return "";
      }
      return downloadFigmaImage(fileName, localPath, imageUrl);
    });
    return Promise.all(promises);
  }

  async getImages(
    fileKey: string,
    nodes: FetchImageParams[],
    localPath: string,
    pngScale: number,
    svgOptions: {
      outlineText: boolean;
      includeId: boolean;
      simplifyStroke: boolean;
    },
  ): Promise<string[]> {
    const pngIds = nodes.filter(({ fileType }) => fileType === "png").map(({ nodeId }) => nodeId);
    const pngFiles =
      pngIds.length > 0
        ? this.request<GetImagesResponse>(
            `/images/${fileKey}?ids=${pngIds.join(",")}&format=png&scale=${pngScale}`,
          ).then(({ images = {} }) => images)
        : ({} as GetImagesResponse["images"]);

    const svgIds = nodes.filter(({ fileType }) => fileType === "svg").map(({ nodeId }) => nodeId);
    const svgParams = [
      `ids=${svgIds.join(",")}`,
      "format=svg",
      `svg_outline_text=${svgOptions.outlineText}`,
      `svg_include_id=${svgOptions.includeId}`,
      `svg_simplify_stroke=${svgOptions.simplifyStroke}`,
    ].join("&");

    const svgFiles =
      svgIds.length > 0
        ? this.request<GetImagesResponse>(`/images/${fileKey}?${svgParams}`).then(
            ({ images = {} }) => images,
          )
        : ({} as GetImagesResponse["images"]);

    const files = await Promise.all([pngFiles, svgFiles]).then(([f, l]) => ({ ...f, ...l }));

    const downloads = nodes
      .map(({ nodeId, fileName }) => {
        const imageUrl = files[nodeId];
        if (imageUrl) {
          return downloadFigmaImage(fileName, localPath, imageUrl);
        }
        return false;
      })
      .filter((url) => !!url);

    return Promise.all(downloads);
  }

  async getFile(fileKey: string, depth?: number | null): Promise<SimplifiedDesign> {
    try {
      const endpoint = `/files/${fileKey}${depth ? `?depth=${depth}` : ""}`;
      Logger.log(`Retrieving Figma file: ${fileKey} (depth: ${depth ?? "default"})`);
      const response = await this.request<GetFileResponse>(endpoint);
      Logger.log("Got response");
      const simplifiedResponse = parseFigmaResponse(response);
      writeLogs("figma-raw.yml", response);
      writeLogs("figma-simplified.yml", simplifiedResponse);
      return simplifiedResponse;
    } catch (e) {
      console.error("Failed to get file:", e);
      throw e;
    }
  }

  async getNode(fileKey: string, nodeId: string, depth?: number | null): Promise<SimplifiedDesign> {
    const endpoint = `/files/${fileKey}/nodes?ids=${nodeId}${depth ? `&depth=${depth}` : ""}`;
    const response = await this.request<GetFileNodesResponse>(endpoint);
    Logger.log("Got response from getNode, now parsing.");
    writeLogs("figma-raw.yml", response);
    const simplifiedResponse = parseFigmaResponse(response);
    writeLogs("figma-simplified.yml", simplifiedResponse);
    return simplifiedResponse;
  }

  // New methods for project overview functionality
  async getFileStructure(fileKey: string, depth: number = 2): Promise<any> {
    try {
      Logger.log(`Getting file structure for ${fileKey} with depth ${depth}`);
      const fileData = await this.getFile(fileKey, depth);
      
      // Extract hierarchical structure
      const structure = {
        name: fileData.name,
        pages: this.extractPageStructure(fileData.nodes || []),
        components: Object.keys(fileData.components || {}).length,
        componentSets: Object.keys(fileData.componentSets || {}).length,
        totalNodes: this.countTotalNodes(fileData.nodes || [])
      };
      
      return structure;
    } catch (error) {
      Logger.error("Error getting file structure:", error);
      throw error;
    }
  }

  async getProjectMetadata(fileKey: string): Promise<any> {
    try {
      Logger.log(`Getting project metadata for ${fileKey}`);
      const endpoint = `/files/${fileKey}?depth=1`;
      const response = await this.request<GetFileResponse>(endpoint);
      
      return {
        name: response.name,
        lastModified: response.lastModified,
        version: response.version,
        thumbnailUrl: response.thumbnailUrl,
        editorType: response.editorType,
        role: response.role
      };
    } catch (error) {
      Logger.error("Error getting project metadata:", error);
      throw error;
    }
  }

  async getComponentLibrary(fileKey: string): Promise<any> {
    try {
      Logger.log(`Getting component library for ${fileKey}`);
      const fileData = await this.getFile(fileKey, 1);
      
      const components = fileData.components || {};
      const componentSets = fileData.componentSets || {};
      
      // Count instances
      const instanceCounts: Record<string, number> = {};
      this.countComponentInstances(fileData.nodes || [], instanceCounts);
      
      // Build component library data
      const library = {
        components: Object.entries(components).map(([id, comp]) => ({
          id,
          name: comp.name,
          description: '', // SimplifiedComponentDefinition doesn't have description
          instances: instanceCounts[id] || 0
        })),
        componentSets: Object.entries(componentSets).map(([id, set]) => ({
          id,
          name: set.name,
          description: set.description || '',
          variantCount: 0 // SimplifiedComponentSetDefinition doesn't have children
        }))
      };
      
      return library;
    } catch (error) {
      Logger.error("Error getting component library:", error);
      throw error;
    }
  }

  async generatePageThumbnails(fileKey: string, pageIds: string[]): Promise<Record<string, string>> {
    try {
      Logger.log(`Generating thumbnails for ${pageIds.length} pages`);
      const endpoint = `/images/${fileKey}?ids=${pageIds.join(",")}&format=png&scale=0.5`;
      const response = await this.request<GetImagesResponse>(endpoint);
      
      const images = response.images || {};
      // Convert any null values to empty strings
      const result: Record<string, string> = {};
      for (const [key, value] of Object.entries(images)) {
        result[key] = value || '';
      }
      return result;
    } catch (error) {
      Logger.error("Error generating page thumbnails:", error);
      throw error;
    }
  }

  // Helper methods
  private extractPageStructure(nodes: any[]): any[] {
    return nodes
      .filter(node => node.type === "CANVAS")
      .map(page => ({
        id: page.id,
        name: page.name,
        frames: (page.children || [])
          .filter((child: any) => child.type === "FRAME" || child.type === "COMPONENT")
          .map((frame: any) => ({
            id: frame.id,
            name: frame.name,
            type: frame.type,
            childCount: frame.children?.length || 0
          }))
      }));
  }

  private countTotalNodes(nodes: any[]): number {
    let count = 0;
    
    function traverse(node: any) {
      count++;
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(traverse);
      }
    }
    
    nodes.forEach(traverse);
    return count;
  }

  private countComponentInstances(nodes: any[], counts: Record<string, number>): void {
    function traverse(node: any) {
      if (node.type === "INSTANCE" && node.componentId) {
        counts[node.componentId] = (counts[node.componentId] || 0) + 1;
      }
      
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(traverse);
      }
    }
    
    nodes.forEach(traverse);
  }
}

function writeLogs(name: string, value: any) {
  try {
    if (process.env.NODE_ENV !== "development") return;

    const logsDir = "logs";

    try {
      fs.accessSync(process.cwd(), fs.constants.W_OK);
    } catch (error) {
      Logger.log("Failed to write logs:", error);
      return;
    }

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }
    fs.writeFileSync(`${logsDir}/${name}`, yaml.dump(value));
  } catch (error) {
    console.debug("Failed to write logs:", error);
  }
}
