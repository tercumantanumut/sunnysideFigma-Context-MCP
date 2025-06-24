# Troubleshooting Guide

This guide covers common issues and their solutions when using the Figma Context MCP server.

## Common Issues

### Installation Issues

#### Node.js Version Compatibility
**Problem:** Server fails to start with Node.js version errors.

**Solution:**
```bash
# Check Node.js version
node --version

# Should be 18.0.0 or higher
# If not, update Node.js from https://nodejs.org/
```

#### Build Failures
**Problem:** `npm run build` fails with TypeScript errors.

**Solution:**
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild project
npm run build

# If still failing, check TypeScript version
npx tsc --version
```

#### Permission Errors
**Problem:** Cannot write to directories or access files.

**Solution:**
```bash
# On macOS/Linux
sudo chown -R $(whoami) /path/to/project

# On Windows (run as Administrator)
icacls "C:\path\to\project" /grant %USERNAME%:F /T
```

### Server Issues

#### Port Already in Use
**Problem:** `Error: listen EADDRINUSE: address already in use :::3333`

**Solution:**
```bash
# Find process using port 3333
lsof -i :3333  # macOS/Linux
netstat -ano | findstr :3333  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
PORT=3334 npm run start:http
```

#### EventSource Errors
**Problem:** `[INFO] Figma Dev Mode MCP Server not available: ReferenceError: EventSource is not defined`

**Status:** This is **EXPECTED** and **NORMAL** in Node.js environments.

**Explanation:**
- EventSource is a browser-only Web API, not available in Node.js
- This error appears during server startup but doesn't affect functionality
- All MCP tools work perfectly despite this warning
- Plugin integration works normally
- Only affects the optional Figma Dev Mode bridge feature

**Action:** No action needed - this is informational only. The server operates correctly.

#### API Key Issues
**Problem:** `Invalid API key` or `Unauthorized` errors.

**Solution:**
```bash
# Verify API key format
echo $FIGMA_API_KEY
# Should be: figd_...

# Test API key
curl -H "X-Figma-Token: $FIGMA_API_KEY" https://api.figma.com/v1/me

# Generate new key if needed
# https://www.figma.com/developers/api#access-tokens
```

### Plugin Issues

#### Plugin Not Loading
**Problem:** Figma plugin doesn't appear or fails to load.

**Solution:**
1. **Check Figma Desktop Version**
   ```bash
   # Ensure Figma Desktop is updated to latest version
   # Restart Figma after updating
   ```

2. **Verify Plugin Files**
   ```bash
   # Check files exist
   ls figma-dev-plugin/
   # Should show: manifest.json, code.js, ui.html
   ```

3. **Reinstall Plugin**
   - Remove plugin from Figma
   - Restart Figma Desktop
   - Import plugin again from manifest.json

#### Plugin Connection Failed
**Problem:** Plugin shows "Disconnected" status.

**Solution:**
1. **Check Server Status**
   ```bash
   # Start development server first
   npm run dev

   # Then test health endpoint
   curl http://localhost:3333/health
   # Should return: {"status": "healthy"}
   ```

2. **Verify Server is Running**
   ```bash
   # Check if development server is running
   # You should see: [INFO] HTTP server listening on port 3333

   # Check .env file
   cat .env
   # PORT should match server configuration
   ```

3. **Firewall Settings**
   - Allow port 3333 through firewall
   - Check antivirus software blocking connections

#### No Data Extracted
**Problem:** Plugin runs but no data is extracted.

**Solution:**
1. **Select Element First**
   - Ensure an element is selected in Figma
   - Plugin only extracts selected elements

2. **Check Element Type**
   - Some element types may not be supported
   - Try with basic shapes or components

3. **Verify Plugin Permissions**
   - Check plugin has necessary permissions
   - Restart Figma if permissions changed

### MCP Integration Issues

#### Tools Not Available
**Problem:** AI agent reports "No tools available" or tools not found.

**Solution:**
1. **Test MCP Server**
   ```bash
   # Test STDIO mode
   echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node ./dist/cli.js --figma-api-key=YOUR_KEY --stdio
   ```

2. **Check AI Agent Configuration**
   ```json
   // Verify configuration format
   {
     "mcpServers": {
       "Framelink Figma MCP": {
         "command": "node",
         "args": [
           "/absolute/path/to/dist/cli.js",
           "--figma-api-key=YOUR_KEY",
           "--stdio"
         ]
       }
     }
   }
   ```

3. **Path Issues**
   - Use absolute paths in configuration
   - Verify file exists at specified path
   - Check file permissions

#### Tool Execution Errors
**Problem:** Tools return errors when executed.

**Solution:**
1. **Check Prerequisites**
   ```bash
   # Ensure server is running
   curl http://localhost:3333/health
   
   # Verify plugin has extracted data
   curl http://localhost:3333/plugin/latest-dev-data
   ```

2. **Validate Parameters**
   - Check required parameters are provided
   - Verify parameter formats match documentation
   - Use correct data types

3. **Debug Mode**
   ```bash
   # Run server with debug logging
   DEBUG=* node ./dist/cli.js --figma-api-key=YOUR_KEY --stdio
   ```

### Data Extraction Issues

#### Empty or Invalid Data
**Problem:** Extracted data is empty or malformed.

**Solution:**
1. **Element Selection**
   - Ensure element is properly selected
   - Try with different element types
   - Check element has visible properties

2. **Plugin State**
   - Refresh plugin interface
   - Restart Figma if needed
   - Clear plugin cache

3. **Server State**
   ```bash
   # Restart server
   npm run start:http
   
   # Clear any cached data
   rm -f figma-data.json
   ```

#### Incomplete CSS
**Problem:** Generated CSS is missing properties or incorrect.

**Solution:**
1. **Check Element Properties**
   - Verify element has fills, strokes, effects
   - Ensure properties are visible in Figma

2. **Try Different Extraction Methods**
   ```javascript
   // Try native CSS
   get_figma_css({ format: "formatted" })
   
   // Try comprehensive extraction
   get_All_Layers_CSS({ formatted: true })
   ```

3. **Update Plugin**
   - Ensure plugin is latest version
   - Check for Figma API changes

### Performance Issues

#### Slow Response Times
**Problem:** Tools take too long to respond.

**Solution:**
1. **Reduce Scan Depth**
   ```javascript
   extract_design_tokens({
     scanDepth: 2  // Reduce from default 3
   })
   ```

2. **Limit File Patterns**
   ```javascript
   build_dependency_graph({
     filePatterns: ["**/*.{ts,tsx}"]  // Reduce file types
   })
   ```

3. **Server Resources**
   - Ensure adequate RAM available
   - Close unnecessary applications
   - Consider server hardware upgrade

#### Memory Issues
**Problem:** Server crashes with out-of-memory errors.

**Solution:**
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 ./dist/cli.js --figma-api-key=YOUR_KEY --stdio

# Or set environment variable
export NODE_OPTIONS="--max-old-space-size=4096"
```

## Diagnostic Commands

### Health Checks
```bash
# Server health
curl http://localhost:3333/health

# Plugin data availability
curl http://localhost:3333/plugin/latest-dev-data

# MCP tool list
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node ./dist/cli.js --figma-api-key=YOUR_KEY --stdio
```

### Log Analysis
```bash
# Enable debug logging
DEBUG=figma-mcp:* npm run start:http

# Check server logs
tail -f server.log

# Monitor network requests
curl -v http://localhost:3333/health
```

### System Information
```bash
# Node.js version
node --version

# NPM version
npm --version

# Project dependencies
npm list

# System resources
top  # macOS/Linux
tasklist  # Windows
```

## Getting Help

### Before Asking for Help
1. Check this troubleshooting guide
2. Review relevant documentation
3. Test with minimal example
4. Gather diagnostic information

### Information to Include
- Operating system and version
- Node.js version
- Error messages (full text)
- Steps to reproduce
- Expected vs actual behavior
- Configuration files (sanitized)

### Support Channels
- GitHub Issues - Bug reports and feature requests
- Documentation - Comprehensive guides and examples
- Community Forums - User discussions and help

### Creating Bug Reports
1. Use issue template
2. Include minimal reproduction case
3. Provide system information
4. Attach relevant logs
5. Describe expected behavior

## Prevention Tips

### Regular Maintenance
- Keep dependencies updated
- Monitor server logs
- Test after Figma updates
- Backup configurations

### Best Practices
- Use version control for configurations
- Document custom workflows
- Test changes in development first
- Monitor system resources

### Monitoring
- Set up health check monitoring
- Track performance metrics
- Monitor error rates
- Review logs regularly

## Next Steps

If you're still experiencing issues:
1. Review [Installation Guide](installation.md)
2. Check [API Reference](api/README.md)
3. Try [Basic Examples](examples/basic-workflows.md)
4. Contact support with diagnostic information
