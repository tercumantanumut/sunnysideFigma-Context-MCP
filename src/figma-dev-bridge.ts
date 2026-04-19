import { Logger } from './utils/logger.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

/**
 * Bridge to Figma Desktop's official Dev Mode MCP Server.
 *
 * Transport: MCP Streamable HTTP at http://127.0.0.1:3845/mcp
 *   (Figma's modern endpoint; the legacy SSE /sse endpoint still exists but
 *    requires an EventSource polyfill in Node.js which is not bundled here.)
 *
 * Docs: https://help.figma.com/hc/en-us/articles/32132100833559
 *       https://developers.figma.com/docs/figma-mcp-server/local-server-installation/
 */

export interface FigmaDevModeClient {
  isConnected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getCode(nodeId?: string, format?: string): Promise<any>;
  getVariableDefs(nodeId?: string): Promise<any>;
  getAssets(nodeId?: string): Promise<any>;
}

const FIGMA_MCP_URL = new URL(
  process.env.FIGMA_DEV_MCP_URL || 'http://127.0.0.1:3845/mcp',
);

const CONNECT_TIMEOUT_MS = 5_000;
const CALL_TIMEOUT_MS = 30_000;

class FigmaDevModeBridge implements FigmaDevModeClient {
  public isConnected = false;

  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | null = null;
  private connecting: Promise<void> | null = null;

  async connect(): Promise<void> {
    // Coalesce concurrent connect attempts.
    if (this.isConnected) return;
    if (this.connecting) return this.connecting;

    this.connecting = this.doConnect().finally(() => {
      this.connecting = null;
    });
    return this.connecting;
  }

  private async doConnect(): Promise<void> {
    try {
      // Fast-path probe: is anything listening on 3845/mcp? This avoids hanging
      // the MCP SDK handshake when Figma Desktop isn't running at all.
      const controller = new AbortController();
      const probeTimer = setTimeout(() => controller.abort(), 1_500);
      let probeOk = false;
      try {
        const probe = await fetch(FIGMA_MCP_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
          },
          body: '{}',
          signal: controller.signal,
        });
        // Any HTTP response (even 400/405) means the MCP server is present;
        // a network error / abort means it isn't.
        probeOk = probe.status < 600;
      } catch {
        probeOk = false;
      } finally {
        clearTimeout(probeTimer);
      }

      if (!probeOk) {
        this.isConnected = false;
        return;
      }

      this.transport = new StreamableHTTPClientTransport(FIGMA_MCP_URL);
      this.client = new Client(
        {
          name: 'sunnyside-figma-context-mcp',
          version: '0.4.2',
        },
        {
          capabilities: {},
        },
      );

      const connectPromise = this.client.connect(this.transport);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Figma Dev Mode handshake timeout')),
          CONNECT_TIMEOUT_MS,
        ),
      );
      await Promise.race([connectPromise, timeoutPromise]);

      this.isConnected = true;
      if (process.env.NODE_ENV === 'development') {
        Logger.log('Connected to Figma Dev Mode MCP Server (Streamable HTTP)');
      }
    } catch (error) {
      this.isConnected = false;
      await this.safeTeardown();
      if (process.env.NODE_ENV === 'development') {
        Logger.log(
          'Figma Dev Mode connect failed:',
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  private async safeTeardown(): Promise<void> {
    try {
      await this.client?.close();
    } catch {
      /* ignore */
    }
    try {
      await this.transport?.close();
    } catch {
      /* ignore */
    }
    this.client = null;
    this.transport = null;
  }

  private async callTool(name: string, args: Record<string, unknown>): Promise<any> {
    if (!this.isConnected || !this.client) {
      // Attempt a lazy reconnect in case Figma Desktop was (re)started.
      await this.connect();
      if (!this.isConnected || !this.client) {
        throw new Error('Not connected to Figma Dev Mode MCP Server');
      }
    }

    const callPromise = this.client.callTool({ name, arguments: args });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Figma Dev Mode "${name}" timeout`)),
        CALL_TIMEOUT_MS,
      ),
    );

    const result: any = await Promise.race([callPromise, timeoutPromise]);

    // The MCP SDK returns a CallToolResult. If the server reported an error
    // surface it as an exception so upstream tools can handle it uniformly.
    if (result?.isError) {
      const text = Array.isArray(result.content)
        ? result.content.map((c: any) => c?.text).filter(Boolean).join('\n')
        : '';
      throw new Error(text || `Figma Dev Mode "${name}" returned an error`);
    }

    return result;
  }

  async getCode(nodeId?: string, format?: string): Promise<any> {
    const args: Record<string, unknown> = {};
    if (nodeId) args.node_id = nodeId;
    if (format) args.format = format;

    try {
      // Prefer Figma's modern tool name; fall back to legacy.
      try {
        return await this.callTool('get_code', args);
      } catch (firstErr) {
        const msg = firstErr instanceof Error ? firstErr.message : '';
        if (/Unknown tool|not found|-32601/.test(msg)) {
          return await this.callTool('get_design_context', args);
        }
        throw firstErr;
      }
    } catch (error) {
      Logger.error('Error getting code from Figma Dev Mode:', error);
      throw error;
    }
  }

  async getVariableDefs(nodeId?: string): Promise<any> {
    const args: Record<string, unknown> = nodeId ? { node_id: nodeId } : {};
    try {
      return await this.callTool('get_variable_defs', args);
    } catch (error) {
      Logger.error(
        'Error getting variable definitions from Figma Dev Mode:',
        error,
      );
      throw error;
    }
  }

  async getAssets(nodeId?: string): Promise<any> {
    const args: Record<string, unknown> = nodeId ? { node_id: nodeId } : {};
    try {
      // `get_assets` was Sunnyside's original name; Figma's official tool is
      // `get_image`. Try both for forward/backward compatibility.
      try {
        return await this.callTool('get_image', args);
      } catch (firstErr) {
        const msg = firstErr instanceof Error ? firstErr.message : '';
        if (/Unknown tool|not found|-32601/.test(msg)) {
          return await this.callTool('get_assets', args);
        }
        throw firstErr;
      }
    } catch (error) {
      Logger.error('Error getting assets from Figma Dev Mode:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.safeTeardown();
    this.isConnected = false;
    if (process.env.NODE_ENV === 'development') {
      Logger.log('Disconnected from Figma Dev Mode MCP Server');
    }
  }
}

// Singleton instance
export const figmaDevBridge = new FigmaDevModeBridge();

// Auto-connect on module load (silently). Failures here are expected when
// Figma Desktop isn't running; callers can retry via check_figma_dev_connection.
figmaDevBridge.connect().catch(() => {
  if (process.env.NODE_ENV === 'development') {
    Logger.log(
      'Figma Dev Mode MCP Server not available - continuing without it',
    );
  }
});
