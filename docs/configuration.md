# Configuration Guide

This guide covers all configuration options for the Figma Context MCP server.

## Environment Configuration

### Required Environment Variables

#### FIGMA_API_KEY
Your Figma API key for accessing Figma's REST API.

```env
FIGMA_API_KEY=figd_your_api_key_here
```

**How to get:**
1. Log into Figma
2. Go to Settings → Account → Personal Access Tokens
3. Generate new token
4. Copy the token (starts with `figd_`)

### Optional Environment Variables

#### PORT
Port number for the HTTP server (default: 3333).

```env
PORT=3333
```

#### OUTPUT_FORMAT
Default output format for API responses (default: json).

```env
OUTPUT_FORMAT=json
# Options: json, yaml
```

#### LOG_LEVEL
Logging level for server output (default: info).

```env
LOG_LEVEL=info
# Options: error, warn, info, debug
```

#### CORS_ORIGIN
CORS origin for browser requests (default: *).

```env
CORS_ORIGIN=http://localhost:3000
# Or multiple origins: http://localhost:3000,http://localhost:3001
```

#### RATE_LIMIT_WINDOW
Rate limiting window in minutes (default: 15).

```env
RATE_LIMIT_WINDOW=15
```

#### RATE_LIMIT_MAX
Maximum requests per window (default: 100).

```env
RATE_LIMIT_MAX=100
```

## Server Configuration

### HTTP Server Options

#### Basic Configuration
```bash
# Start development server (HTTP + Plugin Integration)
npm run dev

# Start with custom port
PORT=4000 npm run dev

# Start with debug logging
LOG_LEVEL=debug npm run dev
```

#### Advanced Configuration
```bash
# Environment-specific configuration
NODE_ENV=production npm run dev
```

### MCP Server Options

#### CLI Mode (for AI Agent Integration)
```bash
# Start MCP CLI server
npm run start:cli

# With environment variables
FIGMA_API_KEY=your_key npm run start:cli
```

#### Available Commands
- `npm run dev` - Start development server (HTTP + Plugin Integration)
- `npm run start:cli` - Start MCP CLI server (AI Agent Integration)
- `npm run build` - Build the project
- `npm test` - Run tests
- `npm run lint` - Check code style

## AI Agent Configuration

### Augment Configuration

#### Mac Configuration (Recommended)
Add to your Augment MCP configuration file:

```json
{
  "mcpServers": {
    "Framelink Figma MCP": {
      "command": "node",
      "args": [
        "/Users/umuttan/Documents/MCPs/sunnysideFigma-Context-MCP-main/dist/cli.js",
        "--stdio"
      ],
      "env": {
        "FIGMA_API_KEY": "figd_YOUR_FIGMA_API_KEY_HERE",
      }
    }
  }
}
```

#### Alternative Mac Configuration (using npm)
```json
{
  "mcpServers": {
    "Framelink Figma MCP": {
      "command": "npm",
      "args": ["run", "start:cli"],
      "cwd": "/Users/umuttan/Documents/MCPs/sunnysideFigma-Context-MCP-main",
      "env": {
        "FIGMA_API_KEY": "figd_YOUR_FIGMA_API_KEY_HERE",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Claude Desktop Configuration

#### Mac Configuration (Recommended)
Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "figma-mcp": {
      "command": "node",
      "args": [
        "/Users/umuttan/Documents/MCPs/sunnysideFigma-Context-MCP-main/dist/cli.js",
        "--stdio"
      ],
      "env": {
        "FIGMA_API_KEY": "figd_YOUR_FIGMA_API_KEY_HERE"
      }
    }
  }
}
```

#### Alternative Mac Configuration (using npm)
```json
{
  "mcpServers": {
    "figma-mcp": {
      "command": "npm",
      "args": ["run", "start:cli"],
      "cwd": "/Users/umuttan/Documents/MCPs/sunnysideFigma-Context-MCP-main",
      "env": {
        "FIGMA_API_KEY": "figd_YOUR_FIGMA_API_KEY_HERE"
      }
    }
  }
}
```

### Custom AI Agent Configuration

#### Mac Configuration (Recommended)
For other AI agents supporting MCP:

```json
{
  "name": "Figma Context MCP",
  "command": "node",
  "args": [
    "/Users/umuttan/Documents/MCPs/sunnysideFigma-Context-MCP-main/dist/cli.js",
    "--stdio"
  ],
  "env": {
    "FIGMA_API_KEY": "figd_YOUR_FIGMA_API_KEY_HERE"
  },
  "timeout": 30000,
  "retries": 3
}
```

#### Alternative Mac Configuration (using npm)
```json
{
  "name": "Figma Context MCP",
  "command": "npm",
  "args": ["run", "start:cli"],
  "cwd": "/Users/umuttan/Documents/MCPs/sunnysideFigma-Context-MCP-main",
  "env": {
    "FIGMA_API_KEY": "figd_YOUR_FIGMA_API_KEY_HERE"
  },
  "timeout": 30000,
  "retries": 3
}
```

## Plugin Configuration

### Figma Plugin Settings

The plugin configuration is in `figma-dev-plugin/manifest.json`:

```json
{
  "name": "Figma Context MCP",
  "id": "figma-context-mcp",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "editorType": ["figma"],
  "networkAccess": {
    "allowedDomains": ["localhost:3333"]
  }
}
```

### Plugin Server Connection

The plugin connects to the server using these settings (in `code.js`):

```javascript
const SERVER_URL = 'http://localhost:3333';
const ENDPOINTS = {
  devData: '/plugin/dev-data',
  health: '/health'
};
```

To change the server URL, modify the `SERVER_URL` constant and rebuild the plugin.

## Advanced Configuration

### Configuration File

Create a `config.json` file for advanced settings:

```json
{
  "server": {
    "port": 3333,
    "host": "localhost",
    "cors": {
      "origin": "*",
      "credentials": true
    }
  },
  "figma": {
    "apiKey": "figd_your_key_here",
    "rateLimit": {
      "requests": 100,
      "window": 60000
    }
  },
  "mcp": {
    "timeout": 30000,
    "maxRetries": 3
  },
  "logging": {
    "level": "info",
    "format": "json",
    "file": "./logs/server.log"
  },
  "cache": {
    "enabled": true,
    "ttl": 300000,
    "maxSize": 100
  }
}
```

### Database Configuration

For persistent storage (optional):

```json
{
  "database": {
    "type": "sqlite",
    "path": "./data/figma-mcp.db",
    "options": {
      "synchronous": "NORMAL",
      "journal_mode": "WAL"
    }
  }
}
```

### Redis Configuration

For caching and session storage (optional):

```json
{
  "redis": {
    "host": "localhost",
    "port": 6379,
    "password": "your-redis-password",
    "db": 0
  }
}
```

## Security Configuration

### API Key Security

**Environment Variables (Recommended):**
```env
FIGMA_API_KEY=figd_your_key_here
```

**Configuration File:**
```json
{
  "figma": {
    "apiKey": "${FIGMA_API_KEY}"
  }
}
```

**Command Line (Development Only):**
```bash
node ./dist/cli.js --figma-api-key=figd_your_key_here --stdio
```

### HTTPS Configuration

For production deployments:

```json
{
  "server": {
    "https": {
      "enabled": true,
      "key": "./certs/private-key.pem",
      "cert": "./certs/certificate.pem"
    }
  }
}
```

### Authentication Configuration

For API authentication:

```json
{
  "auth": {
    "enabled": true,
    "type": "bearer",
    "secret": "your-jwt-secret",
    "expiresIn": "24h"
  }
}
```

## Performance Configuration

### Caching Settings

```json
{
  "cache": {
    "enabled": true,
    "type": "memory",
    "ttl": 300000,
    "maxSize": 100,
    "compression": true
  }
}
```

### Rate Limiting

```json
{
  "rateLimit": {
    "windowMs": 900000,
    "max": 100,
    "message": "Too many requests",
    "standardHeaders": true,
    "legacyHeaders": false
  }
}
```

### Connection Pooling

```json
{
  "http": {
    "keepAlive": true,
    "maxSockets": 50,
    "timeout": 30000
  }
}
```

## Development Configuration

### Development Environment

```env
NODE_ENV=development
LOG_LEVEL=debug
FIGMA_API_KEY=figd_your_dev_key
PORT=3333
```

### Testing Configuration

```env
NODE_ENV=test
LOG_LEVEL=error
FIGMA_API_KEY=figd_your_test_key
PORT=3334
```

### Production Configuration

```env
NODE_ENV=production
LOG_LEVEL=warn
FIGMA_API_KEY=figd_your_prod_key
PORT=3333
HTTPS_ENABLED=true
```

## Validation

### Configuration Validation

The server validates configuration on startup:

```bash
# Validate configuration
node ./dist/cli.js --validate-config

# Test configuration
node ./dist/cli.js --test-config
```

### Health Checks

```bash
# Server health
curl http://localhost:3333/health

# Configuration status
curl http://localhost:3333/config/status
```

## Troubleshooting Configuration

### Common Issues

#### Invalid API Key
```
Error: Invalid Figma API key format
Solution: Ensure key starts with 'figd_'
```

#### Port Already in Use
```
Error: EADDRINUSE: address already in use :::3333
Solution: Change PORT or kill existing process
```

#### Permission Denied
```
Error: EACCES: permission denied
Solution: Check file permissions and user access
```

### Debug Configuration

```bash
# Enable debug logging
DEBUG=figma-mcp:* npm run start:http

# Verbose configuration output
node ./dist/cli.js --verbose --figma-api-key=KEY --stdio
```

## Next Steps

- [Installation Guide](installation.md) - Complete setup
- [Troubleshooting](troubleshooting.md) - Common issues
- [API Reference](api/README.md) - Technical details
- [Examples](examples/README.md) - Usage examples
