import { Logger } from './utils/logger.js';

export interface FigmaDevModeClient {
  isConnected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getCode(nodeId?: string): Promise<any>;
  getVariableDefs(nodeId?: string): Promise<any>;
  getAssets(nodeId?: string): Promise<any>;
}

// Check if EventSource is available (not available in Node.js by default)
const isEventSourceAvailable = typeof EventSource !== 'undefined';

class FigmaDevModeBridge implements FigmaDevModeClient {
  private baseUrl = 'http://127.0.0.1:3845';
  private sseUrl = 'http://127.0.0.1:3845/sse';
  public isConnected = false;
  private eventSource: any = null; // Use any to avoid TypeScript errors when EventSource is not available
  private messageId = 1;
  private pendingRequests = new Map<number, { resolve: Function; reject: Function }>();

  async connect(): Promise<void> {
    try {
      // Test if Figma Dev Mode server is running
      const response = await fetch(`${this.baseUrl}/health`).catch(() => null);

      if (!response || !response.ok) {
        // Only try SSE if EventSource is available
        if (isEventSourceAvailable) {
          await this.connectSSE();
        } else {
          // Silently fail - EventSource not available in Node.js environment
          throw new Error('EventSource not available in Node.js environment');
        }
      }

      this.isConnected = true;
      // Only log success in development mode
      if (process.env.NODE_ENV === 'development') {
        Logger.log('Connected to Figma Dev Mode MCP Server');
      }
    } catch (error) {
      // Silently handle the connection failure - this is expected in most cases
      this.isConnected = false;
    }
  }

  private async connectSSE(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Check if EventSource is available before using it
        if (!isEventSourceAvailable) {
          reject(new Error('EventSource not available in this environment'));
          return;
        }

        this.eventSource = new (globalThis as any).EventSource(this.sseUrl);

        this.eventSource.onopen = () => {
          if (process.env.NODE_ENV === 'development') {
            Logger.log('SSE connection to Figma Dev Mode established');
          }
          resolve();
        };

        this.eventSource.onmessage = (event: any) => {
          try {
            const data = JSON.parse(event.data);
            this.handleSSEMessage(data);
          } catch (error) {
            // Only log errors in development mode
            if (process.env.NODE_ENV === 'development') {
              Logger.error('Error parsing SSE message:', error);
            }
          }
        };

        this.eventSource.onerror = (error: any) => {
          // Only log errors in development mode
          if (process.env.NODE_ENV === 'development') {
            Logger.error('SSE connection error:', error);
          }
          reject(error);
        };

        // Timeout after 5 seconds
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('SSE connection timeout'));
          }
        }, 5000);

      } catch (error) {
        reject(error);
      }
    });
  }

  private handleSSEMessage(data: any): void {
    if (data.id && this.pendingRequests.has(data.id)) {
      const { resolve, reject } = this.pendingRequests.get(data.id)!;
      this.pendingRequests.delete(data.id);
      
      if (data.error) {
        reject(new Error(data.error.message || 'Figma Dev Mode error'));
      } else {
        resolve(data.result);
      }
    }
  }

  private async sendMCPRequest(method: string, params: any = {}): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Not connected to Figma Dev Mode MCP Server');
    }

    const id = this.messageId++;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      
      // For SSE, we need to send via POST to a message endpoint
      fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      }).catch(reject);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  async getCode(nodeId?: string, format?: string): Promise<any> {
    try {
      const args: any = {};
      if (nodeId) args.node_id = nodeId;
      if (format) args.format = format;
      
      return await this.sendMCPRequest('tools/call', {
        name: 'get_code',
        arguments: args
      });
    } catch (error) {
      Logger.error('Error getting code from Figma Dev Mode:', error);
      throw error;
    }
  }

  async getVariableDefs(nodeId?: string): Promise<any> {
    try {
      return await this.sendMCPRequest('tools/call', {
        name: 'get_variable_defs',
        arguments: nodeId ? { node_id: nodeId } : {}
      });
    } catch (error) {
      Logger.error('Error getting variable definitions from Figma Dev Mode:', error);
      throw error;
    }
  }

  async getAssets(nodeId?: string): Promise<any> {
    try {
      return await this.sendMCPRequest('tools/call', {
        name: 'get_assets',
        arguments: nodeId ? { node_id: nodeId } : {}
      });
    } catch (error) {
      Logger.error('Error getting assets from Figma Dev Mode:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
    this.pendingRequests.clear();
    Logger.log('Disconnected from Figma Dev Mode MCP Server');
  }
}

// Singleton instance
export const figmaDevBridge = new FigmaDevModeBridge();

// Auto-connect on module load (silently)
figmaDevBridge.connect().catch(() => {
  // Silently handle connection failure - this is expected in most cases
  // Only log in development mode
  if (process.env.NODE_ENV === 'development') {
    Logger.log('Figma Dev Mode MCP Server not available - continuing without it');
  }
});
