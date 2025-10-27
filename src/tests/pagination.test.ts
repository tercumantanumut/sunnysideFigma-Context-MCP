import { describe, it, expect } from "@jest/globals";
import {
  estimateTokenCount,
  paginateNodes,
  wouldExceedTokenLimit,
  getPaginationSummary,
} from "~/utils/pagination.js";
import type { SimplifiedNode } from "~/services/simplify-node-response.js";

describe("Pagination Utils", () => {
  // Create sample nodes for testing
  const createSampleNodes = (count: number): SimplifiedNode[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `node-${i}`,
      name: `Node ${i}`,
      type: i % 10 === 0 ? "CANVAS" : "FRAME",
      boundingBox: {
        x: 0,
        y: i * 100,
        width: 375,
        height: 812,
      },
      fills: "color-fill",
      layout: "auto-layout",
    }));
  };

  describe("estimateTokenCount", () => {
    it("should estimate token count for objects", () => {
      const smallObj = { name: "test", value: 123 };
      const tokens = estimateTokenCount(smallObj);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(50); // Small object should be < 50 tokens
    });

    it("should handle different formats", () => {
      const obj = { data: Array(10).fill({ key: "value" }) };
      const yamlTokens = estimateTokenCount(obj, "yaml");
      const jsonTokens = estimateTokenCount(obj, "json");
      expect(yamlTokens).toBeGreaterThan(0);
      expect(jsonTokens).toBeGreaterThan(0);
    });
  });

  describe("wouldExceedTokenLimit", () => {
    it("should detect when data exceeds token limit", () => {
      // Create a large object that would exceed limit
      const largeData = {
        nodes: createSampleNodes(1000),
        metadata: { file: "test" },
        globalVars: { styles: {} },
      };
      
      expect(wouldExceedTokenLimit(largeData)).toBe(true);
    });

    it("should return false for small data", () => {
      const smallData = {
        nodes: createSampleNodes(5),
        metadata: { file: "test" },
        globalVars: { styles: {} },
      };
      
      expect(wouldExceedTokenLimit(smallData)).toBe(false);
    });
  });

  describe("paginateNodes", () => {
    const metadata = { name: "Test File", lastModified: "2024-01-01" };
    const globalVars = { styles: {} };

    it("should paginate nodes by count", () => {
      const nodes = createSampleNodes(50);
      const result = paginateNodes(nodes, metadata, globalVars, {
        page: 1,
        pageSize: 10,
        mode: "by-nodes",
      });

      expect(result.nodes).toHaveLength(10);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.totalPages).toBe(5);
      expect(result.pagination.totalNodes).toBe(50);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it("should handle page navigation", () => {
      const nodes = createSampleNodes(30);
      const result = paginateNodes(nodes, metadata, globalVars, {
        page: 2,
        pageSize: 10,
        mode: "by-nodes",
      });

      expect(result.nodes).toHaveLength(10);
      expect(result.nodes[0].id).toBe("node-10");
      expect(result.pagination.currentPage).toBe(2);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it("should handle last page correctly", () => {
      const nodes = createSampleNodes(25);
      const result = paginateNodes(nodes, metadata, globalVars, {
        page: 3,
        pageSize: 10,
        mode: "by-nodes",
      });

      expect(result.nodes).toHaveLength(5);
      expect(result.pagination.currentPage).toBe(3);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it("should paginate by pages (CANVAS nodes)", () => {
      const nodes = createSampleNodes(50); // Creates 5 CANVAS nodes
      const result = paginateNodes(nodes, metadata, globalVars, {
        page: 1,
        mode: "by-pages",
      });

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].type).toBe("CANVAS");
      expect(result.pagination.totalPages).toBe(5);
    });

    it("should include navigation hints", () => {
      const nodes = createSampleNodes(30);
      const result = paginateNodes(nodes, metadata, globalVars, {
        page: 2,
        pageSize: 10,
        mode: "by-nodes",
      });

      expect(result.navigationHint).toContain("Page 2 of 3");
      expect(result.navigationHint).toContain("Next page: Call get_figma_data with page=3");
      expect(result.navigationHint).toContain("Previous page: Call get_figma_data with page=1");
    });

    it("should auto-calculate page size when not provided", () => {
      const nodes = createSampleNodes(100);
      const result = paginateNodes(nodes, metadata, globalVars, {
        page: 1,
        mode: "by-nodes",
      });

      expect(result.pagination.nodesPerPage).toBeGreaterThan(0);
      expect(result.pagination.totalPages).toBeGreaterThan(1);
    });
  });

  describe("getPaginationSummary", () => {
    it("should provide summary for by-pages mode", () => {
      const nodes = createSampleNodes(50); // 5 CANVAS nodes
      const summary = getPaginationSummary(nodes, "by-pages");
      expect(summary).toContain("5 pages");
    });

    it("should provide summary for by-nodes mode", () => {
      const nodes = createSampleNodes(200);
      const summary = getPaginationSummary(nodes, "by-nodes");
      expect(summary).toContain("200 nodes");
      expect(summary).toContain("pages");
    });
  });
});