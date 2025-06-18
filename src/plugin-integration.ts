import express from 'express';
import cors from 'cors';
import { Logger } from './utils/logger.js';

export interface FigmaDevData {
  id: string;
  name: string;
  type: string;
  css: string;
  allLayersCSS?: string;
  react: string;
  layout: {
    x: number;
    y: number;
    width: number;
    height: number;
    layoutMode?: string;
    itemSpacing?: number;
    padding?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
  };
  styling: {
    fills?: any[];
    strokes?: any[];
    cornerRadius?: number;
    opacity?: number;
    blendMode?: string;
    effects?: any[];
  };
  children: FigmaDevData[];
}

// Store received dev data for MCP access
let latestDevData: FigmaDevData | null = null;
const devDataHistory: FigmaDevData[] = [];

export function setupPluginIntegration(app: express.Application): void {
  // Enable CORS for plugin requests
  app.use('/plugin', cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, plugins, or curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'https://www.figma.com',
        'https://figma.com',
        'http://localhost:3333',
        'http://127.0.0.1:3333'
      ];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, true); // Allow all origins for development
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));

  // Endpoint to receive dev data from Figma plugin (with increased payload limit)
  app.post('/plugin/figma-dev-data', express.json({ limit: '50mb' }), (req, res) => {
    try {
      const devData: FigmaDevData = req.body;
      
      Logger.log('Received dev data from Figma plugin:', {
        id: devData.id,
        name: devData.name,
        type: devData.type
      });

      // Store the latest data
      latestDevData = devData;
      
      // Add to history (keep last 10)
      devDataHistory.unshift(devData);
      if (devDataHistory.length > 10) {
        devDataHistory.pop();
      }

      res.json({
        success: true,
        message: 'Dev data received successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      Logger.error('Error processing dev data:', error);
      res.status(400).json({
        success: false,
        error: 'Invalid dev data format'
      });
    }
  });

  // Endpoint to get latest dev data (for MCP tools)
  app.get('/plugin/latest-dev-data', (req, res) => {
    if (!latestDevData) {
      res.status(404).json({
        success: false,
        message: 'No dev data available'
      });
      return;
    }

    res.json({
      success: true,
      data: latestDevData,
      timestamp: new Date().toISOString()
    });
  });

  // Endpoint to get dev data history
  app.get('/plugin/dev-data-history', (req, res) => {
    res.json({
      success: true,
      data: devDataHistory,
      count: devDataHistory.length
    });
  });

  // Health check endpoint
  app.get('/plugin/health', (req, res) => {
    res.json({
      success: true,
      status: 'Plugin integration active',
      hasLatestData: !!latestDevData,
      historyCount: devDataHistory.length
    });
  });

  // Tool endpoints for direct HTTP access
  app.get('/plugin/all-layers-css', (req, res) => {
    if (!latestDevData) {
      res.status(404).json({ success: false, message: 'No dev data available' });
      return;
    }

    if (!latestDevData.allLayersCSS) {
      res.status(404).json({ success: false, message: 'No comprehensive CSS available' });
      return;
    }

    const formatted = req.query.formatted !== 'false';
    const content = formatted
      ? `/* Comprehensive CSS for all layers - ${latestDevData.name} */\n\n${latestDevData.allLayersCSS}`
      : latestDevData.allLayersCSS;

    res.json({ success: true, content });
  });

  app.get('/plugin/basic-css', (req, res) => {
    if (!latestDevData) {
      res.status(404).json({ success: false, message: 'No dev data available' });
      return;
    }

    const includeClassName = req.query.includeClassName !== 'false';
    let content = "";

    if (includeClassName) {
      const className = latestDevData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      content = `.${className} {\n  ${latestDevData.css}\n}`;
    } else {
      content = latestDevData.css;
    }

    res.json({ success: true, content });
  });

  app.get('/plugin/react', (req, res) => {
    if (!latestDevData) {
      res.status(404).json({ success: false, message: 'No dev data available' });
      return;
    }

    const includeCSS = req.query.includeCSS !== 'false';
    let content = latestDevData.react;

    if (!includeCSS && content.includes('const styles = `')) {
      content = content.split('const styles = `')[0].trim();
      content = content.replace(/\n\nexport default.*$/, '');
      content += '\n\nexport default ' + latestDevData.name.replace(/[^a-zA-Z0-9]/g, '') + ';';
    }

    res.json({ success: true, content });
  });

  app.get('/plugin/json', (req, res) => {
    if (!latestDevData) {
      res.status(404).json({ success: false, message: 'No dev data available' });
      return;
    }

    const includeChildren = req.query.includeChildren !== 'false';
    const pretty = req.query.pretty !== 'false';
    let data = { ...latestDevData };

    if (!includeChildren) {
      data.children = [];
    }

    const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    res.json({ success: true, content });
  });

  app.get('/plugin/ui-info', (req, res) => {
    if (!latestDevData) {
      res.status(404).json({ success: false, message: 'No dev data available' });
      return;
    }

    const includeImageData = req.query.includeImageData === 'true';

    let content = `UI Component Information for: ${latestDevData.name}

Type: ${latestDevData.type}
Dimensions: ${latestDevData.layout?.width || 'unknown'}x${latestDevData.layout?.height || 'unknown'}
Children: ${latestDevData.children?.length || 0} child elements

Layout Data:
${JSON.stringify(latestDevData.layout, null, 2)}

Styling Data:
${JSON.stringify(latestDevData.styling, null, 2)}`;

    if (includeImageData) {
      content += `

Image Information:
- Component ID: ${latestDevData.id}
- Figma URL: https://www.figma.com/design/W8A0ZKTPi04qt97CGuYIwA/Mobile-UI-kit--Community-?node-id=${latestDevData.id.replace(':', '-')}
- Export Formats Available: PNG (1x, 2x, 3x), SVG, PDF
- Recommended for Screenshots: Use download_figma_images tool with PNG format
- Asset Extraction: Available via MCP download_figma_images tool

Image Fills Detected:
${JSON.stringify(latestDevData.styling?.fills?.filter(fill => fill.type === 'IMAGE') || [], null, 2)}

Background Images:
${latestDevData.allLayersCSS?.includes('background: url(') ? 'Background images detected in CSS' : 'No background images detected'}`;
    } else {
      content += `

Note: Set includeImageData=true to get detailed image information and export options.
Use download_figma_images tool for actual asset extraction.`;
    }

    res.json({ success: true, content });
  });

  Logger.log('Plugin integration endpoints configured');
}

// Export functions for MCP tools to access
export function getLatestDevData(): FigmaDevData | null {
  return latestDevData;
}

export function getDevDataHistory(): FigmaDevData[] {
  return [...devDataHistory];
}

export function clearDevData(): void {
  latestDevData = null;
  devDataHistory.length = 0;
  Logger.log('Dev data cleared');
}
