# API Reference

This section provides comprehensive technical documentation for the Figma Context MCP server APIs.

## API Overview

The Figma Context MCP server provides three main API interfaces:

1. **HTTP API** - REST endpoints for direct server communication
2. **MCP Protocol** - Model Context Protocol for AI agent integration
3. **Plugin API** - Communication interface for Figma plugin

## API Categories

### [HTTP API](http-api.md)
REST endpoints for server communication and data access.

**Base URL:** `http://localhost:3333`

**Endpoints:**
- `GET /health` - Server health check
- `GET /plugin/latest-dev-data` - Latest extracted design data
- `GET /plugin/dev-data-history` - Extraction history
- `GET /plugin/all-layers-css` - Comprehensive CSS
- `GET /plugin/react` - React component generation
- `POST /plugin/dev-data` - Submit design data

### [MCP Protocol](mcp-protocol.md)
Model Context Protocol specifications for AI agent integration.

**Protocol:** JSON-RPC 2.0 over STDIO

**Tool Categories:**
- Code Generation Tools (8 tools)
- Design System Tools (6 tools)
- Asset Management Tools (2 tools)
- Data Analysis Tools (3 tools)
- Integration Tools (3 tools)

### [Plugin API](plugin-api.md)
Communication interface between Figma plugin and server.

**Communication:** HTTP POST requests

**Data Flow:**
- Plugin extracts design data from Figma
- Data sent to server via HTTP API
- Server processes and stores data
- MCP tools access processed data

## Authentication

### Figma API Key
Required for accessing Figma's REST API and some advanced features.

```bash
# Environment variable
FIGMA_API_KEY=figd_your_api_key_here

# Command line parameter
--figma-api-key=figd_your_api_key_here
```

### Server Authentication
Currently, the server runs without authentication for local development. For production deployments, consider implementing:
- API key authentication
- OAuth integration
- IP whitelisting
- Rate limiting

## Data Formats

### Design Data Structure
```typescript
interface FigmaDevData {
  id: string;                    // Figma node ID
  name: string;                  // Element name
  type: string;                  // Element type (RECTANGLE, TEXT, etc.)
  css: string;                   // Custom CSS
  nativeCSS: string;             // Figma native CSS
  layout: LayoutData;            // Position and dimensions
  styling: StylingData;          // Fills, strokes, effects
  children?: FigmaDevData[];     // Child elements
  designTokens?: DesignTokens;   // Extracted tokens
  exportData?: ExportData;       // Export settings
}
```

### Layout Data
```typescript
interface LayoutData {
  x: number;                     // X position
  y: number;                     // Y position
  width: number;                 // Element width
  height: number;                // Element height
  padding?: PaddingData;         // Padding values
}
```

### Styling Data
```typescript
interface StylingData {
  fills: Fill[];                 // Background fills
  strokes: Stroke[];             // Border strokes
  effects: Effect[];             // Shadows, blurs
  cornerRadius?: number;         // Border radius
  opacity: number;               // Element opacity
  blendMode: string;             // Blend mode
}
```

### Design Tokens
```typescript
interface DesignTokens {
  colors: Record<string, ColorToken>;
  spacing: Record<string, SpacingToken>;
  typography: Record<string, TypographyToken>;
  effects: Record<string, EffectToken>;
}
```

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": {
    // Additional error information
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### MCP Tool Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "Tool output content"
    }
  ]
}
```

### MCP Error Response
```json
{
  "isError": true,
  "content": [
    {
      "type": "text",
      "text": "Error description"
    }
  ]
}
```

## Rate Limiting

### HTTP API Limits
- 100 requests per minute per IP
- 1000 requests per hour per IP
- Burst limit: 10 requests per second

### Figma API Limits
- Follows Figma's API rate limits
- Typically 100 requests per minute
- Automatic retry with exponential backoff

### MCP Protocol Limits
- No built-in rate limiting
- Depends on AI agent implementation
- Consider implementing client-side throttling

## Error Codes

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

### Custom Error Codes
- `FIGMA_API_ERROR` - Figma API request failed
- `INVALID_NODE_ID` - Invalid Figma node ID format
- `NO_DATA_AVAILABLE` - No design data extracted
- `PLUGIN_NOT_CONNECTED` - Plugin not connected
- `TOKEN_NOT_FOUND` - Design token not found
- `MIGRATION_FAILED` - Code migration failed

## SDK and Libraries

### JavaScript/TypeScript
```typescript
// HTTP API client
import { FigmaMCPClient } from 'figma-mcp-client';

const client = new FigmaMCPClient({
  baseURL: 'http://localhost:3333',
  apiKey: 'your-figma-api-key'
});

// Get latest design data
const data = await client.getLatestDevData();

// Generate React component
const component = await client.generateReactComponent({
  componentName: 'Button',
  styleType: 'tailwind'
});
```

### Python
```python
# MCP client
from figma_mcp import FigmaMCPClient

client = FigmaMCPClient(
    command=['node', '/path/to/cli.js', '--figma-api-key=KEY', '--stdio']
)

# Use tools
result = client.call_tool('get_react_component', {
    'componentName': 'Button',
    'styleType': 'css-modules'
})
```

## Webhooks

### Plugin Data Updates
```http
POST /webhooks/plugin-data
Content-Type: application/json

{
  "event": "data_extracted",
  "data": {
    // Figma design data
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Design Token Changes
```http
POST /webhooks/token-change
Content-Type: application/json

{
  "event": "token_changed",
  "tokenId": "color-primary-500",
  "oldValue": "#3b82f6",
  "newValue": "#2563eb",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## OpenAPI Specification

The complete OpenAPI specification is available at:
- Development: `http://localhost:3333/api-docs`
- Documentation: [openapi.yaml](openapi.yaml)

## GraphQL Schema

For advanced querying capabilities, a GraphQL endpoint is available:
- Endpoint: `http://localhost:3333/graphql`
- Schema: [schema.graphql](schema.graphql)
- Playground: `http://localhost:3333/graphql-playground`

## Testing

### API Testing
```bash
# Health check
curl http://localhost:3333/health

# Get design data
curl http://localhost:3333/plugin/latest-dev-data

# Test with authentication
curl -H "X-Figma-Token: your-key" http://localhost:3333/api/files/file-key
```

### MCP Testing
```bash
# List available tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node ./dist/cli.js --stdio

# Call specific tool
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_react_component","arguments":{}}}' | node ./dist/cli.js --stdio
```

## Performance

### Optimization Tips
- Use appropriate cache headers
- Implement request compression
- Optimize database queries
- Use connection pooling
- Implement proper indexing

### Monitoring
- Response time metrics
- Error rate tracking
- Resource utilization
- API usage analytics

## Security

### Best Practices
- Validate all input parameters
- Sanitize file paths
- Implement rate limiting
- Use HTTPS in production
- Secure API key storage

### Vulnerability Reporting
Report security issues to: security@figma-mcp.dev

## Next Steps

- [HTTP API Documentation](http-api.md) - REST endpoint details
- [MCP Protocol Documentation](mcp-protocol.md) - Tool specifications
- [Plugin API Documentation](plugin-api.md) - Plugin communication
- [Examples](../examples/README.md) - Practical usage examples
