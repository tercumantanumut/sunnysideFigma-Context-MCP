// Figma Context MCP - Dev Mode Plugin
// Proper Dev Mode integration with codegen capabilities

// Check supported editor types
const supportedEditors = ["dev", "figma", "figjam", "slides"];
if (supportedEditors.includes(figma.editorType)) {
  console.log(`🎨 Figma Context MCP Plugin loaded in ${figma.editorType} mode`);
  
  // If we're in codegen mode, set up code generation
  if (figma.mode === "codegen") {
    setupCodegenMode();
  } else {
    // Regular inspection mode
    setupInspectionMode();
  }
} else {
  // Unsupported editor type
  figma.notify(`This plugin supports: ${supportedEditors.join(", ")}. Current: ${figma.editorType}`);
  figma.closePlugin();
}

function setupCodegenMode() {
  console.log('🚀 Setting up codegen mode');
  
  // Register the main codegen callback
  figma.codegen.on("generate", async ({ node }) => {
    const results = [];
    
    try {
      // Get current language preference
      const preferences = figma.codegen.preferences || {};
      const language = preferences.language || 'react';
      
      console.log(`Generating code for ${node.name} in ${language} format`);
      
      // Extract data from the selected node
      const nodeData = await extractNodeData(node);
      
      // Generate code based on selected language
      switch (language) {
        case 'react':
          results.push({
            title: "React Component",
            language: "TYPESCRIPT",
            code: await generateReactComponent(node, nodeData, preferences)
          });
          break;
          
        case 'css':
          results.push({
            title: "CSS",
            language: "CSS", 
            code: await generateCSS(node, nodeData, preferences)
          });
          break;
          
        case 'tailwind':
          results.push({
            title: "Tailwind Component",
            language: "TYPESCRIPT",
            code: await generateTailwindComponent(node, nodeData, preferences)
          });
          break;
          
        case 'styled-components':
          results.push({
            title: "Styled Components",
            language: "TYPESCRIPT",
            code: await generateStyledComponent(node, nodeData, preferences)
          });
          break;
          
        default:
          results.push({
            title: "React Component",
            language: "TYPESCRIPT",
            code: await generateReactComponent(node, nodeData, preferences)
          });
      }
      
      // Also send data to MCP server for advanced processing
      try {
        await sendToMCPServer(nodeData);
      } catch (error) {
        console.warn('MCP server not available:', error);
      }
      
    } catch (error) {
      console.error('Error generating code:', error);
      results.push({
        title: "Error",
        language: "PLAINTEXT",
        code: `// Error generating code: ${error.message}`
      });
    }
    
    return results;
  });
  
  // Handle preference changes
  figma.codegen.on("preferenceschange", ({ propertyName }) => {
    if (propertyName === "moreSettings") {
      // Open settings UI
      figma.showUI(__html__, { 
        width: 400, 
        height: 500,
        themeColors: true,
        title: "MCP Server Settings"
      });
    }
  });
}

function setupInspectionMode() {
  console.log('🔍 Setting up inspection mode');
  
  // Show plugin UI for inspection
  figma.showUI(__html__, { 
    width: 400, 
    height: 600,
    themeColors: true 
  });
  
  // Listen for selection changes
  figma.on('selectionchange', async () => {
    const selection = figma.currentPage.selection;
    
    if (selection.length === 1) {
      const node = selection[0];
      const nodeData = await extractNodeData(node);
      
      // Send updated data to UI only
      figma.ui.postMessage({
        type: 'selection-changed',
        data: nodeData
      });
      
      // Don't auto-send to MCP server on selection change
      // Only send when user explicitly clicks extract button
    }
  });
  
  // Handle UI messages
  figma.ui.onmessage = async (msg) => {
    if (msg.type === 'scan-project') {
      try {
        figma.ui.postMessage({
          type: 'scanning-project',
          message: 'Scanning entire project...'
        });
        
        const projectData = await scanEntireProject();
        
        // Send to MCP server
        await sendProjectOverviewToMCP(projectData);
        
        figma.ui.postMessage({
          type: 'project-scanned',
          data: projectData
        });
        
      } catch (error) {
        console.error('Error scanning project:', error);
        figma.ui.postMessage({
          type: 'error',
          message: error.message
        });
      }
    }
    
    if (msg.type === 'extract-dev-code') {
      const selection = figma.currentPage.selection;
      
      if (selection.length === 0) {
        figma.ui.postMessage({
          type: 'error',
          message: 'Please select a node to extract code from'
        });
        return;
      }
      
      try {
        const node = selection[0];
        const nodeData = await extractNodeData(node);
        
        figma.ui.postMessage({
          type: 'dev-data-extracted',
          data: nodeData
        });
        
        await sendToMCPServer(nodeData);
        
        figma.ui.postMessage({
          type: 'success',
          message: 'Data sent to MCP server successfully'
        });
        
      } catch (error) {
        console.error('Error extracting dev data:', error);
        figma.ui.postMessage({
          type: 'error',
          message: error.message
        });
      }
    }
    
    if (msg.type === 'extract-assets') {
      const selection = figma.currentPage.selection;
      
      if (selection.length === 0) {
        figma.ui.postMessage({
          type: 'error',
          message: 'Please select a node to extract assets from'
        });
        return;
      }
      
      try {
        const node = selection[0];
        
        // Check if node can export assets
        const canExport = ['COMPONENT', 'INSTANCE', 'FRAME', 'RECTANGLE', 'ELLIPSE', 'VECTOR', 'GROUP'].includes(node.type);
        
        if (!canExport) {
          figma.ui.postMessage({
            type: 'error',
            message: 'Selected node type cannot export assets'
          });
          return;
        }
        
        figma.ui.postMessage({
          type: 'assets-extracting',
          message: 'Extracting assets...'
        });
        
        const assets = await extractNodeAssets(node);
        
        figma.ui.postMessage({
          type: 'assets-extracted',
          data: {
            nodeId: node.id,
            nodeName: node.name,
            assets: assets
          }
        });
        
      } catch (error) {
        console.error('Error extracting assets:', error);
        figma.ui.postMessage({
          type: 'error',
          message: error.message
        });
      }
    }
  };
}

// Utility function to convert CSS object to string
function convertCSSObjectToString(cssObj) {
  if (typeof cssObj === 'string') {
    return cssObj;
  }

  if (typeof cssObj === 'object' && cssObj !== null) {
    return Object.entries(cssObj)
      .map(([property, value]) => `${property}: ${value};`)
      .join('\n  ');
  }

  return '';
}

// Generate comprehensive CSS for all layers (like Figma's "Copy all layers as CSS")
async function generateAllLayersCSS(node, depth = 0) {
  let allCSS = [];
  const indent = '  '.repeat(depth);

  try {
    // Generate CSS for current node
    let nodeCSS = '';
    const className = sanitizeClassName(node.name);

    if (node.getCSSAsync) {
      const rawCSS = await node.getCSSAsync();
      nodeCSS = convertCSSObjectToString(rawCSS);
    } else {
      nodeCSS = generateCustomCSS(node);
    }

    if (nodeCSS.trim()) {
      const comment = `/* ${node.type}: ${node.name} */`;
      const cssRule = `.${className} {\n  ${nodeCSS}\n}`;
      allCSS.push(`${comment}\n${cssRule}`);
    }

    // Recursively process children (limit depth to avoid performance issues)
    if (node.children && node.children.length > 0 && depth < 5) {
      for (const child of node.children) {
        const childCSS = await generateAllLayersCSS(child, depth + 1);
        if (childCSS.trim()) {
          allCSS.push(childCSS);
        }
      }
    }

  } catch (error) {
    console.warn(`Error generating CSS for ${node.name}:`, error);
  }

  return allCSS.join('\n\n');
}

// Helper function to sanitize class names
function sanitizeClassName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    || 'figma-element'; // Fallback name
}

// Separate function for heavy asset extraction
async function extractNodeAssets(node) {
  const assets = [];
  
  try {
    console.log('🎨 Starting asset extraction for:', node.name);
    
    // Export PNG at multiple scales
    const pngScales = [1, 2];  // Reduced to 2 scales to improve performance
    for (const scale of pngScales) {
      try {
        const pngData = await node.exportAsync({ 
          format: 'PNG', 
          constraint: { type: 'SCALE', value: scale } 
        });
        
        assets.push({
          format: 'PNG',
          scale: scale,
          data: pngData,
          size: pngData.length,
          filename: `${sanitizeFileName(node.name)}-${scale}x.png`,
          dataUrl: `data:image/png;base64,${arrayBufferToBase64(pngData)}`
        });
      } catch (scaleError) {
        console.warn(`Could not export PNG at ${scale}x:`, scaleError);
      }
    }

    // Export SVG (just default version for performance)
    try {
      const svgData = await node.exportAsync({ format: 'SVG' });
      
      assets.push({
        format: 'SVG',
        variant: 'default',
        data: svgData,
        size: svgData.length,
        filename: `${sanitizeFileName(node.name)}.svg`,
        dataUrl: `data:image/svg+xml;base64,${arrayBufferToBase64(svgData)}`
      });
    } catch (svgError) {
      console.warn('Could not export SVG:', svgError);
    }

    console.log('✅ Asset extraction complete:', assets.length, 'assets');
    return assets;
    
  } catch (error) {
    console.error('❌ Error extracting assets:', error);
    return [];
  }
}

// Enhanced data extraction using native Figma APIs
async function extractNodeData(node) {
  const data = {
    id: node.id,
    name: node.name,
    type: node.type,
    css: '',
    nativeCSS: '',
    layout: {},
    styling: {},
    children: [],
    designTokens: {},
    exportData: null,
    // Add file context information (requires enablePrivatePluginApi: true)
    fileKey: figma.fileKey || null,
    fileName: figma.root ? figma.root.name : null,
    pageId: figma.currentPage ? figma.currentPage.id : null,
    pageName: figma.currentPage ? figma.currentPage.name : null
  };

  try {
    // Use native getCSSAsync if available (Figma's official CSS generation)
    if (node.getCSSAsync) {
      const rawCSS = await node.getCSSAsync();
      data.nativeCSS = convertCSSObjectToString(rawCSS);
      console.log('✅ Using native Figma CSS generation');
    } else {
      // Fallback to custom CSS generation
      data.css = generateCustomCSS(node);
      console.log('⚠️ Using fallback CSS generation');
    }

    // Generate comprehensive CSS for all layers (like Figma's "Copy all layers as CSS")
    data.allLayersCSS = await generateAllLayersCSS(node);
    console.log('✅ Generated comprehensive CSS for all layers');
    
    // Extract layout data
    data.layout = extractLayoutData(node);
    
    // Extract styling data  
    data.styling = extractStylingData(node);
    
    // Extract design tokens if available
    data.designTokens = await extractDesignTokens(node);
    
    // Only include basic asset metadata on selection, not full export
    if (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'FRAME' || 
        node.type === 'RECTANGLE' || node.type === 'ELLIPSE' || node.type === 'VECTOR' || 
        node.type === 'GROUP') {
      
      data.exportData = {
        canExport: true,
        metadata: {
          nodeType: node.type,
          dimensions: { width: node.width, height: node.height },
          hasImageFills: false,
          hasVectorContent: false
        }
      };

      // Quick checks without heavy operations
      if (node.fills && Array.isArray(node.fills)) {
        data.exportData.metadata.hasImageFills = node.fills.some(fill => fill.type === 'IMAGE');
      }

      data.exportData.metadata.hasVectorContent = node.type === 'VECTOR' || 
        (node.children && node.children.some && node.children.some(child => child.type === 'VECTOR'));
    }
    
    // Recursively extract children with depth and count control
    if ('children' in node && node.children && node.children.length > 0) {
      const maxDepth = 3; // Reduced max depth for large frames
      const maxChildren = 20; // Limit number of children to process
      const currentDepth = arguments[1] || 0;
      
      if (currentDepth < maxDepth) {
        const childrenToProcess = Math.min(node.children.length, maxChildren);
        
        for (let i = 0; i < childrenToProcess; i++) {
          try {
            data.children.push(await extractNodeData(node.children[i], currentDepth + 1));
          } catch (childError) {
            console.warn('Error extracting child node:', childError);
            // Add placeholder for failed child
            data.children.push({
              id: node.children[i].id || 'unknown',
              name: node.children[i].name || 'Failed to extract',
              type: node.children[i].type || 'UNKNOWN',
              error: 'Failed to extract child data'
            });
          }
        }
        
        // Add info about truncated children
        if (node.children.length > maxChildren) {
          data.children.push({
            id: 'truncated-info',
            name: `[${node.children.length - maxChildren} more children not extracted]`,
            type: 'INFO',
            truncated: true
          });
        }
      } else {
        // Add info about depth limit
        data.children.push({
          id: 'depth-limit-info',
          name: `[${node.children.length} children at max depth]`,
          type: 'INFO',
          depthLimited: true
        });
      }
    }
    
  } catch (error) {
    console.error('Error in extractNodeData:', error);
    data.css = `/* Error: ${error.message} */`;
  }
  
  return data;
}

// Generate React component with preferences
async function generateReactComponent(node, nodeData, preferences) {
  const componentName = sanitizeComponentName(node.name);
  const format = preferences.componentFormat || 'functional';
  const styleApproach = preferences.styleApproach || 'css-modules';
  const unitType = preferences.unit || 'px';
  
  let css = nodeData.nativeCSS || nodeData.css || '';
  
  // Convert to rem if preference is set
  if (unitType === 'rem' && preferences.scaleFactor) {
    css = convertPxToRem(css, preferences.scaleFactor);
  }
  
  let component = '';
  
  if (format === 'arrow') {
    component = `import React from 'react';

interface ${componentName}Props {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const ${componentName} = ({ className, style, children }: ${componentName}Props) => {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
};

export default ${componentName};`;
  } else {
    component = `import React from 'react';

interface ${componentName}Props {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const ${componentName}: React.FC<${componentName}Props> = ({ className, style, children }) => {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
};

export default ${componentName};`;
  }
  
  if (styleApproach === 'css-modules') {
    component += `\n\n/* ${componentName}.module.css */\n.${componentName.toLowerCase()} {\n  ${css}\n}`;
  }
  
  return component;
}

// Generate clean CSS
async function generateCSS(node, nodeData, preferences) {
  let css = nodeData.nativeCSS || nodeData.css || '';
  const unitType = preferences.unit || 'px';
  
  // Convert to rem if preference is set
  if (unitType === 'rem' && preferences.scaleFactor) {
    css = convertPxToRem(css, preferences.scaleFactor);
  }
  
  const className = sanitizeComponentName(node.name).toLowerCase();
  
  return `.${className} {
  ${css}
}`;
}

// Generate Tailwind component
async function generateTailwindComponent(node, nodeData, preferences) {
  const componentName = sanitizeComponentName(node.name);
  const tailwindClasses = convertCSSToTailwind(nodeData.nativeCSS || nodeData.css || '');
  
  return `import React from 'react';

interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
}

const ${componentName}: React.FC<${componentName}Props> = ({ className, children }) => {
  return (
    <div className={\`${tailwindClasses} \${className || ''}\`}>
      {children}
    </div>
  );
};

export default ${componentName};`;
}

// Generate styled-components
async function generateStyledComponent(node, nodeData, preferences) {
  const componentName = sanitizeComponentName(node.name);
  let css = nodeData.nativeCSS || nodeData.css || '';
  const unitType = preferences.unit || 'px';
  
  // Convert to rem if preference is set
  if (unitType === 'rem' && preferences.scaleFactor) {
    css = convertPxToRem(css, preferences.scaleFactor);
  }
  
  return `import React from 'react';
import styled from 'styled-components';

const Styled${componentName} = styled.div\`
  ${css}
\`;

interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
}

const ${componentName}: React.FC<${componentName}Props> = ({ className, children }) => {
  return (
    <Styled${componentName} className={className}>
      {children}
    </Styled${componentName}>
  );
};

export default ${componentName};`;
}

// Helper functions
function sanitizeComponentName(name) {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
    .replace(/^[a-z]/, char => char.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '')
    || 'Component';
}

function convertPxToRem(css, scaleFactor) {
  return css.replace(/(\d+(?:\.\d+)?)px/g, (match, pixels) => {
    const rem = parseFloat(pixels) / scaleFactor;
    return `${rem}rem`;
  });
}

function convertCSSToTailwind(css) {
  // Ensure css is a string
  if (typeof css !== 'string') {
    css = convertCSSObjectToString(css);
  }

  if (!css) return 'block';

  const lines = css.split('\n').filter(line => line.trim());
  const classes = [];

  for (const line of lines) {
    const [property, value] = line.split(':').map(s => s.trim().replace(';', ''));
    if (!property || !value) continue;

    if (property === 'display' && value === 'flex') classes.push('flex');
    else if (property === 'width') {
      if (value === '100%') classes.push('w-full');
      else if (value.endsWith('px')) classes.push(`w-[${value}]`);
    }
    else if (property === 'height') {
      if (value === '100%') classes.push('h-full');
      else if (value.endsWith('px')) classes.push(`h-[${value}]`);
    }
    else if (property === 'background' || property === 'background-color') {
      if (value.startsWith('#')) classes.push(`bg-[${value}]`);
      else if (value.includes('url(')) classes.push('bg-cover bg-center');
    }
    else if (property === 'color') classes.push(`text-[${value}]`);
    else if (property === 'border-radius' && value.endsWith('px')) classes.push(`rounded-[${value}]`);
    else if (property === 'padding' && value.endsWith('px')) classes.push(`p-[${value}]`);
    else if (property === 'margin' && value.endsWith('px')) classes.push(`m-[${value}]`);
    else if (property === 'transform' && value.includes('rotate')) {
      const rotateMatch = value.match(/rotate\(([^)]+)\)/);
      if (rotateMatch) classes.push(`rotate-[${rotateMatch[1]}]`);
    }
    else if (property === 'box-shadow') classes.push('shadow-lg');
    else if (property === 'flex-shrink' && value === '0') classes.push('shrink-0');
  }

  return classes.join(' ') || 'block';
}

// Extract design tokens
async function extractDesignTokens(node) {
  const tokens = {
    colors: {},
    spacing: {},
    typography: {},
    effects: {}
  };
  
  try {
    // Extract color tokens from fills
    if (node.fills && Array.isArray(node.fills)) {
      node.fills.forEach((fill, index) => {
        if (fill.type === 'SOLID' && fill.color) {
          const { r, g, b } = fill.color;
          const hex = rgbToHex({ r, g, b });
          tokens.colors[`fill-${index}`] = {
            value: hex,
            opacity: fill.opacity || 1
          };
        }
      });
    }
    
    // Extract spacing from layout
    if (node.paddingTop !== undefined) tokens.spacing.paddingTop = node.paddingTop;
    if (node.paddingRight !== undefined) tokens.spacing.paddingRight = node.paddingRight;
    if (node.paddingBottom !== undefined) tokens.spacing.paddingBottom = node.paddingBottom;
    if (node.paddingLeft !== undefined) tokens.spacing.paddingLeft = node.paddingLeft;
    if (node.itemSpacing !== undefined) tokens.spacing.gap = node.itemSpacing;
    
    // Extract typography tokens
    if (node.type === 'TEXT') {
      if (node.fontSize) tokens.typography.fontSize = node.fontSize;
      if (node.fontName) tokens.typography.fontFamily = node.fontName.family;
      if (node.lineHeight) tokens.typography.lineHeight = node.lineHeight;
      if (node.letterSpacing) tokens.typography.letterSpacing = node.letterSpacing;
    }
    
    // Extract effect tokens
    if (node.effects && Array.isArray(node.effects)) {
      node.effects.forEach((effect, index) => {
        tokens.effects[`effect-${index}`] = Object.assign({
          type: effect.type,
          visible: effect.visible
        }, effect);
      });
    }
    
  } catch (error) {
    console.warn('Error extracting design tokens:', error);
  }
  
  return tokens;
}

// Custom CSS generation (fallback)
function generateCustomCSS(node) {
  const css = [];
  
  try {
    // Position
    if (node.parent && node.parent.type !== 'PAGE') {
      css.push('position: absolute;');
      if (node.x !== undefined) css.push(`left: ${node.x}px;`);
      if (node.y !== undefined) css.push(`top: ${node.y}px;`);
    }
    
    // Dimensions
    if (node.width !== undefined) css.push(`width: ${node.width}px;`);
    if (node.height !== undefined) css.push(`height: ${node.height}px;`);
    
    // Background
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.type === 'SOLID' && fill.color) {
        const color = rgbToHex(fill.color, fill.opacity);
        css.push(`background: ${color};`);
      }
    }
    
    // Border
    if (node.strokes && node.strokes.length > 0) {
      const stroke = node.strokes[0];
      if (stroke.type === 'SOLID' && stroke.color) {
        const strokeWidth = node.strokeWeight || 1;
        const strokeColor = rgbToHex(stroke.color, stroke.opacity);
        css.push(`border: ${strokeWidth}px solid ${strokeColor};`);
      }
    }
    
    // Border radius
    if (node.cornerRadius !== undefined) {
      css.push(`border-radius: ${node.cornerRadius}px;`);
    }
    
    return css.join('\n  ');
    
  } catch (error) {
    return `/* Error generating CSS: ${error.message} */`;
  }
}

function extractLayoutData(node) {
  return {
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    layoutMode: node.layoutMode,
    itemSpacing: node.itemSpacing,
    padding: {
      top: node.paddingTop,
      right: node.paddingRight,
      bottom: node.paddingBottom,
      left: node.paddingLeft
    }
  };
}

function extractStylingData(node) {
  return {
    fills: serializeProperty(node.fills),
    strokes: serializeProperty(node.strokes),
    cornerRadius: node.cornerRadius,
    opacity: node.opacity,
    blendMode: serializeProperty(node.blendMode),
    effects: serializeProperty(node.effects)
  };
}

function rgbToHex(rgb, opacity = 1) {
  try {
    const r = Math.round((rgb.r || 0) * 255);
    const g = Math.round((rgb.g || 0) * 255);
    const b = Math.round((rgb.b || 0) * 255);
    
    if (opacity < 1) {
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch (error) {
    return '#000000';
  }
}

function serializeProperty(prop) {
  if (prop === undefined || prop === null) return null;
  
  if (typeof prop === 'symbol') return prop.toString();
  if (typeof prop === 'function') return '[Function]';
  
  if (Array.isArray(prop)) {
    return prop.map(item => serializeProperty(item));
  }
  
  if (typeof prop === 'object' && prop !== null) {
    const safe = {};
    for (const key in prop) {
      try {
        const value = prop[key];
        if (typeof value === 'symbol') {
          safe[key] = value.toString();
        } else if (typeof value === 'function') {
          safe[key] = '[Function]';
        } else {
          safe[key] = serializeProperty(value);
        }
      } catch (error) {
        safe[key] = '[Unserializable]';
      }
    }
    return safe;
  }
  
  try {
    return JSON.parse(JSON.stringify(prop));
  } catch (error) {
    return String(prop);
  }
}

// Helper functions for asset processing
function sanitizeFileName(name) {
  return name
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 50) // Limit length
    || 'asset';
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Sanitize data for postMessage serialization with depth control
function sanitizeForSerialization(data, maxDepth = 10, currentDepth = 0, seen = new WeakSet()) {
  // Prevent infinite recursion and circular references
  if (currentDepth >= maxDepth) {
    return '[Max Depth Reached]';
  }
  
  if (data === null || data === undefined) {
    return data;
  }
  
  // Handle primitive types
  if (typeof data === 'symbol') {
    return data.toString();
  }
  
  if (typeof data === 'function') {
    return '[Function]';
  }
  
  if (typeof data === 'bigint') {
    return data.toString();
  }
  
  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }
  
  // Handle objects and arrays
  if (typeof data === 'object' && data !== null) {
    // Check for circular references
    if (seen.has(data)) {
      return '[Circular Reference]';
    }
    seen.add(data);
    
    try {
      if (Array.isArray(data)) {
        // Limit array size for large arrays
        const maxArrayLength = 100;
        const result = [];
        const length = Math.min(data.length, maxArrayLength);
        
        for (let i = 0; i < length; i++) {
          try {
            result[i] = sanitizeForSerialization(data[i], maxDepth, currentDepth + 1, seen);
          } catch (error) {
            result[i] = '[Array Item Error]';
          }
        }
        
        if (data.length > maxArrayLength) {
          result.push(`[... ${data.length - maxArrayLength} more items]`);
        }
        
        return result;
      }
      
      // Handle objects
      const safe = {};
      const keys = Object.keys(data);
      const maxKeys = 50; // Limit number of keys for very large objects
      
      for (let i = 0; i < Math.min(keys.length, maxKeys); i++) {
        const key = keys[i];
        try {
          const value = data[key];
          
          // Skip known problematic properties
          if (key === 'parent' || key === 'children' || key === '__proto__' || key === 'constructor') {
            if (key === 'children' && Array.isArray(value)) {
              // Include children but with limited depth
              safe[key] = sanitizeForSerialization(value, Math.min(maxDepth, 3), currentDepth + 1, seen);
            } else {
              safe[key] = `[${typeof value}]`;
            }
            continue;
          }
          
          // Handle different value types
          if (typeof value === 'symbol') {
            safe[key] = value.toString();
          } else if (typeof value === 'function') {
            safe[key] = '[Function]';
          } else if (typeof value === 'object' && value !== null) {
            // Recursively sanitize objects with depth control
            safe[key] = sanitizeForSerialization(value, maxDepth, currentDepth + 1, seen);
          } else {
            safe[key] = value;
          }
        } catch (error) {
          safe[key] = '[Property Error]';
        }
      }
      
      if (keys.length > maxKeys) {
        safe['[truncated]'] = `${keys.length - maxKeys} more properties`;
      }
      
      return safe;
      
    } finally {
      seen.delete(data);
    }
  }
  
  // Fallback for any other types
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    return String(data);
  }
}

// Send data to MCP server with asset URLs
async function sendToMCPServer(data) {
  try {
    // Clean the data to remove any non-serializable properties
    const cleanData = sanitizeForSerialization(data);
    
    // Prepare data with asset metadata for MCP
    const mcpData = Object.assign({}, cleanData, {
      assets: cleanData.exportData && cleanData.exportData.assets ? 
        cleanData.exportData.assets.map(function(asset) {
          return {
            format: asset.format,
            scale: asset.scale,
            variant: asset.variant,
            filename: asset.filename,
            size: asset.size,
            url: 'http://localhost:3333/plugin/assets/' + cleanData.id + '/' + asset.filename,
            dataUrl: asset.dataUrl // For immediate use
          };
        }) : []
    });

    // Send asset data to server for URL hosting
    if (cleanData.exportData && cleanData.exportData.assets && cleanData.exportData.assets.length > 0) {
      await sendAssetsToServer(cleanData.id, cleanData.exportData.assets);
    }

    // Final safety check - ensure data is actually serializable
    let serializedData;
    try {
      serializedData = JSON.parse(JSON.stringify(mcpData));
    } catch (serializationError) {
      console.warn('Final serialization failed, using fallback:', serializationError);
      // Ultra-safe fallback - extract only essential data
      serializedData = {
        id: mcpData.id || 'unknown',
        name: mcpData.name || 'Unknown Node',
        type: mcpData.type || 'UNKNOWN',
        css: mcpData.css || mcpData.nativeCSS || '',
        layout: mcpData.layout || {},
        error: 'Large dataset - using simplified extraction'
      };
    }
    
    const response = await fetch('http://localhost:3333/plugin/figma-dev-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(serializedData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown error from MCP server');
    }
    
    console.log('✅ Data and assets sent to MCP server successfully');
    return result;
    
  } catch (error) {
    console.error('❌ Error sending to MCP server:', error);
    throw error;
  }
}

// Send assets to server for URL hosting
async function sendAssetsToServer(nodeId, assets) {
  try {
    const response = await fetch(`http://localhost:3333/plugin/assets/${nodeId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ assets })
    });
    
    if (!response.ok) {
      console.warn('Failed to send assets to server for URL hosting');
    }
  } catch (error) {
    console.warn('Failed to send assets to server:', error);
  }
}

// Project Overview Functions
async function scanEntireProject() {
  console.log('🔍 Starting full project scan...');
  
  const projectData = {
    file: {
      key: figma.fileKey || null,
      name: figma.root ? figma.root.name : 'Untitled',
      lastModified: new Date().toISOString(),
      version: figma.root ? figma.root.version : null,
      thumbnailUrl: null,
      editorType: figma.editorType
    },
    structure: {
      pages: [],
      totalElements: 0,
      depth: 3
    },
    components: {
      components: {},
      componentSets: {},
      usage: {
        mostUsed: [],
        totalInstances: 0
      }
    },
    designSystem: {
      colors: [],
      textStyles: [],
      effects: [],
      variables: {}
    },
    stats: {
      totalPages: 0,
      totalFrames: 0,
      totalComponents: 0,
      totalComponentSets: 0,
      totalInstances: 0,
      totalTextLayers: 0,
      totalImages: 0,
      uniqueStyles: 0
    }
  };
  
  try {
    // Load all pages first
    await figma.loadAllPagesAsync();
    
    // Get all pages
    const pages = figma.root.children;
    projectData.stats.totalPages = pages.length;
    
    // Process each page
    for (const page of pages) {
      console.log(`📄 Processing page: ${page.name}`);
      
      // Ensure page is loaded
      await page.loadAsync();
      
      const pageData = await processPage(page);
      projectData.structure.pages.push(pageData);
      
      // Update stats
      projectData.stats.totalFrames += pageData.frameCount;
      projectData.structure.totalElements += pageData.totalElements;
    }
    
    // Find all components and component sets
    await findAllComponents(figma.root, projectData);
    
    // Extract design system information
    await extractDesignSystem(projectData);
    
    // Count component usage
    await countComponentUsage(figma.root, projectData);
    
    console.log('✅ Project scan complete:', projectData);
    return projectData;
    
  } catch (error) {
    console.error('❌ Error scanning project:', error);
    throw error;
  }
}

async function processPage(page) {
  const pageData = {
    id: page.id,
    name: page.name,
    thumbnailUrl: null,
    frameCount: 0,
    frames: [],
    totalElements: 0
  };
  
  // Ensure page is loaded before accessing children
  if (!page.children) {
    await page.loadAsync();
  }
  
  // Process all frames in the page
  for (const node of page.children) {
    if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') {
      pageData.frameCount++;
      
      const frameInfo = {
        id: node.id,
        name: node.name,
        type: node.type,
        childrenCount: node.children ? node.children.length : 0,
        hasPrototype: node.reactions && node.reactions.length > 0,
        width: Math.round(node.width),
        height: Math.round(node.height)
      };
      
      pageData.frames.push(frameInfo);
    }
    
    // Count total elements
    pageData.totalElements += countElements(node);
  }
  
  return pageData;
}

function countElements(node) {
  let count = 1;
  
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      count += countElements(child);
    }
  }
  
  return count;
}

async function findAllComponents(node, projectData, depth = 0) {
  if (depth > 10) return; // Prevent infinite recursion
  
  // For pages, ensure they are loaded
  if (node.type === 'PAGE' && !node.children) {
    await node.loadAsync();
  }
  
  if (node.type === 'COMPONENT') {
    projectData.components.components[node.id] = {
      id: node.id,
      name: node.name,
      description: node.description || '',
      type: 'COMPONENT',
      instances: 0
    };
    projectData.stats.totalComponents++;
  }
  
  if (node.type === 'COMPONENT_SET') {
    const variants = node.children ? node.children.length : 0;
    projectData.components.componentSets[node.id] = {
      id: node.id,
      name: node.name,
      description: node.description || '',
      properties: node.componentPropertyDefinitions || {},
      variants: variants
    };
    projectData.stats.totalComponentSets++;
  }
  
  // Recursively process children
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      await findAllComponents(child, projectData, depth + 1);
    }
  }
}

async function extractDesignSystem(projectData) {
  try {
    // Extract local styles using synchronous methods (async versions not available)
    const paintStyles = figma.getLocalPaintStyles();
    const textStyles = figma.getLocalTextStyles();
    const effectStyles = figma.getLocalEffectStyles();
    
    // Process paint styles (colors)
    for (const style of paintStyles) {
      if (style.paints && style.paints.length > 0) {
        const paint = style.paints[0];
        if (paint.type === 'SOLID' && paint.color) {
          const { r, g, b } = paint.color;
          const hex = `#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`;
          
          projectData.designSystem.colors.push({
            name: style.name,
            value: hex,
            id: style.id
          });
        }
      }
    }
    
    // Process text styles
    for (const style of textStyles) {
      projectData.designSystem.textStyles.push({
        name: style.name,
        id: style.id,
        properties: {
          fontName: style.fontName,
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          letterSpacing: style.letterSpacing,
          textCase: style.textCase,
          textDecoration: style.textDecoration
        }
      });
    }
    
    // Process effect styles
    for (const style of effectStyles) {
      if (style.effects && style.effects.length > 0) {
        const effect = style.effects[0];
        projectData.designSystem.effects.push({
          name: style.name,
          id: style.id,
          type: effect.type
        });
      }
    }
    
    projectData.stats.uniqueStyles = paintStyles.length + textStyles.length + effectStyles.length;
    
    // Extract variables if available (using synchronous method)
    if (figma.variables && figma.variables.getLocalVariables) {
      try {
        const variables = figma.variables.getLocalVariables();
        for (const variable of variables) {
          projectData.designSystem.variables[variable.name] = {
            id: variable.id,
            type: variable.resolvedType,
            value: variable.valuesByMode
          };
        }
      } catch (varError) {
        console.warn('Could not extract variables:', varError);
      }
    }
    
  } catch (error) {
    console.warn('Could not extract all design system info:', error);
  }
}

async function countComponentUsage(node, projectData, depth = 0) {
  if (depth > 10) return;
  
  if (node.type === 'INSTANCE') {
    projectData.stats.totalInstances++;
    
    try {
      // Use async method to get main component
      const mainComponent = await node.getMainComponentAsync();
      if (mainComponent) {
        const componentId = mainComponent.id;
        if (projectData.components.components[componentId]) {
          projectData.components.components[componentId].instances++;
        }
      }
    } catch (error) {
      console.warn('Could not get main component:', error);
    }
  }
  
  if (node.type === 'TEXT') {
    projectData.stats.totalTextLayers++;
  }
  
  // Check for image fills
  if (node.fills && Array.isArray(node.fills)) {
    for (const fill of node.fills) {
      if (fill.type === 'IMAGE') {
        projectData.stats.totalImages++;
      }
    }
  }
  
  // Recursively process children
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      await countComponentUsage(child, projectData, depth + 1);
    }
  }
}

// Send project overview to MCP server
async function sendProjectOverviewToMCP(projectData) {
  try {
    console.log('📡 Sending project overview to MCP server...');
    
    const response = await fetch('http://localhost:3333/plugin/project-overview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(projectData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Project overview sent successfully:', result);
    
  } catch (error) {
    console.error('❌ Error sending project overview:', error);
    throw error;
  }
}

// Handle VS Code specific requirements
if (figma.vscode) {
  console.log('🔧 Running in VS Code - special handling enabled');
  
  // Handle link opening for VS Code
  figma.ui.onmessage = (originalHandler => {
    return (msg) => {
      if (msg.type === 'OPEN_IN_BROWSER') {
        figma.openExternal(msg.url);
        return;
      }
      if (originalHandler) {
        originalHandler(msg);
      }
    };
  })(figma.ui.onmessage);
}

// Start the plugin
console.log('Figma Context MCP Plugin initialized with project overview features');