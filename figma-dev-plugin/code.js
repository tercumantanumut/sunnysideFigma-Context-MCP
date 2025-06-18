// Figma Plugin Main Code
// This runs in the Figma plugin sandbox

// Show the plugin UI
figma.showUI(__html__, { 
  width: 400, 
  height: 600,
  themeColors: true 
});

// Listen for messages from the UI
figma.ui.onmessage = async (msg) => {
  console.log('Received message:', msg);
  
  if (msg.type === 'extract-dev-code') {
    try {
      const selection = figma.currentPage.selection;
      
      if (selection.length === 0) {
        figma.ui.postMessage({
          type: 'error',
          message: 'Please select a node to extract code from'
        });
        return;
      }
      
      const node = selection[0];
      const devData = await extractDevModeData(node);

      // Deep serialize the data to remove any remaining symbols before postMessage
      const serializedData = deepSerialize(devData);

      // Send data back to UI
      figma.ui.postMessage({
        type: 'dev-data-extracted',
        data: serializedData
      });
      
    } catch (error) {
      console.error('Error extracting dev data:', error);
      figma.ui.postMessage({
        type: 'error',
        message: error.message
      });
    }
  }
  
  if (msg.type === 'send-to-mcp') {
    try {
      // Deep serialize the data before sending to MCP server
      const serializedData = deepSerialize(msg.data);
      await sendToMCPServer(serializedData);
      figma.ui.postMessage({
        type: 'success',
        message: 'Data sent to MCP server successfully'
      });
    } catch (error) {
      figma.ui.postMessage({
        type: 'error',
        message: 'Failed to send to MCP server: ' + error.message
      });
    }
  }
};

// Extract comprehensive dev mode data from a node
async function extractDevModeData(node) {
  try {

    const data = {
      id: safeGetProperty(node, 'id') || 'unknown',
      name: safeGetProperty(node, 'name') || 'unnamed',
      type: serializeProperty(safeGetProperty(node, 'type')),
      css: '',
      allLayersCSS: '',
      react: '',
      layout: {},
      styling: {},
      children: []
    };

    // Generate CSS safely
    try {
      data.css = generateCSS(node);
    } catch (error) {
      console.error(`Error generating CSS for node "${data.name}":`, error);
      data.css = `/* Error generating CSS: ${error.message} */`;
    }

    // Generate all layers CSS safely
    try {
      data.allLayersCSS = generateAllLayersCSS(node);
    } catch (error) {
      console.error(`Error generating all layers CSS for node "${data.name}":`, error);
      data.allLayersCSS = `/* Error generating all layers CSS: ${error.message} */`;
    }

    // Generate React component safely
    try {
      data.react = generateReactComponent(node);
    } catch (error) {
      console.error(`Error generating React component for node "${data.name}":`, error);
      data.react = `/* Error generating React component: ${error.message} */`;
    }

    // Extract layout data safely
    try {
      data.layout = extractLayoutData(node);
    } catch (error) {
      console.error(`Error extracting layout data for node "${data.name}":`, error);
      data.layout = {};
    }

    // Extract styling data safely
    try {
      data.styling = extractStylingData(node);
    } catch (error) {
      console.error(`Error extracting styling data for node "${data.name}":`, error);
      data.styling = {};
    }

    // Recursively extract children
    try {
      if ('children' in node && node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          try {
            data.children.push(await extractDevModeData(child));
          } catch (childError) {
            console.warn('Error extracting child node:', childError);
            // Continue with other children
          }
        }
      }
    } catch (error) {
      console.error(`Error processing children for node "${data.name}":`, error);
    }

    return data;
  } catch (error) {
    console.error('Error in extractDevModeData:', error);
    // Return a minimal safe object instead of throwing
    return {
      id: 'error',
      name: 'Error Node',
      type: 'ERROR',
      css: `/* Error: ${error.message} */`,
      allLayersCSS: `/* Error: ${error.message} */`,
      react: `/* Error: ${error.message} */`,
      layout: {},
      styling: {},
      children: []
    };
  }
}

// Safely access properties to avoid symbol errors (global helper)
function safeGetProperty(obj, prop) {
  try {
    const value = obj[prop];
    return typeof value === 'symbol' ? value.toString() : value;
  } catch (e) {
    return undefined;
  }
}

// Generate comprehensive CSS from Figma node (like native "Copy as CSS")
function generateCSS(node) {
  const css = [];

  try {

    // Safe CSS push function
    const safePush = (cssRule) => {
      try {
        if (typeof cssRule === 'string' && cssRule.length > 0) {
          css.push(String(cssRule));
        }
      } catch (e) {
        // Skip invalid CSS rules
      }
    };

    // Position (absolute positioning like Figma's Copy as CSS)
    try {
      if (node.parent && safeGetProperty(node.parent, 'type') !== 'PAGE') {
        safePush('position: absolute;');
        const x = safeGetProperty(node, 'x');
        const y = safeGetProperty(node, 'y');
        if (x !== undefined) safePush(`left: ${x}px;`);
        if (y !== undefined) safePush(`top: ${y}px;`);
      } else {
        safePush('position: relative;');
      }
    } catch (e) {
      safePush('position: relative;');
    }

    // Dimensions
    const width = safeGetProperty(node, 'width');
    const height = safeGetProperty(node, 'height');
    if (width !== undefined) safePush(`width: ${width}px;`);
    if (height !== undefined) safePush(`height: ${height}px;`);

    // Box sizing for precise layout
    try {
      const strokes = safeGetProperty(node, 'strokes');
      if (strokes && Array.isArray(strokes) && strokes.length > 0) {
        safePush('box-sizing: border-box;');
      }
    } catch (e) {
      // Skip if strokes can't be accessed
    }

    // Background/Fill
    try {
      const fills = safeGetProperty(node, 'fills');
      if (fills && Array.isArray(fills) && fills.length > 0) {
        const fill = fills[0];
        if (fill && safeGetProperty(fill, 'visible') !== false) {
          const fillType = safeGetProperty(fill, 'type');
          if (fillType === 'SOLID') {
            try {
              const color = rgbToHex(safeGetProperty(fill, 'color'), safeGetProperty(fill, 'opacity'));
              safePush(`background: ${color};`);
            } catch (e) {
              // Skip if color can't be processed
            }
          } else if (fillType === 'IMAGE') {
            safePush(`background: url(.png);`);
            safePush('background-size: cover;');
            safePush('background-position: center;');
          }
        }
      }
    } catch (e) {
      // Skip if fills can't be accessed
    }

    // Strokes/Borders
    try {
      const strokes = safeGetProperty(node, 'strokes');
      if (strokes && Array.isArray(strokes) && strokes.length > 0) {
        const stroke = strokes[0];
        if (stroke && safeGetProperty(stroke, 'visible') !== false && safeGetProperty(stroke, 'type') === 'SOLID') {
          try {
            const strokeWidth = safeGetProperty(node, 'strokeWeight') || 1;
            const strokeColor = rgbToHex(safeGetProperty(stroke, 'color'), safeGetProperty(stroke, 'opacity'));
            safePush(`border: ${strokeWidth}px solid ${strokeColor};`);
          } catch (e) {
            // Skip if stroke color can't be processed
          }
        }
      }
    } catch (e) {
      // Skip if strokes can't be accessed
    }

    // Border radius
    const cornerRadius = safeGetProperty(node, 'cornerRadius');
    if (cornerRadius !== undefined) {
      safePush(`border-radius: ${cornerRadius}px;`);
    }

    // Typography for text nodes
    try {
      const nodeType = safeGetProperty(node, 'type');
      if (nodeType === 'TEXT') {
        const fontName = safeGetProperty(node, 'fontName');
        if (fontName) {
          try {
            const family = safeGetProperty(fontName, 'family');
            const style = safeGetProperty(fontName, 'style');
            if (family) safePush(`font-family: '${family}';`);
            safePush('font-style: normal;');
            if (style) safePush(`font-weight: ${getFontWeight(style)};`);
          } catch (e) {
            // Skip if fontName can't be accessed
          }
        }

        const fontSize = safeGetProperty(node, 'fontSize');
        if (fontSize) safePush(`font-size: ${fontSize}px;`);

        try {
          const lineHeight = safeGetProperty(node, 'lineHeight');
          if (lineHeight && typeof lineHeight === 'object') {
            const value = safeGetProperty(lineHeight, 'value');
            const unit = safeGetProperty(lineHeight, 'unit');
            if (value) safePush(`line-height: ${value}${unit === 'PIXELS' ? 'px' : ''};`);
          } else if (lineHeight && typeof lineHeight === 'number') {
            safePush(`line-height: ${lineHeight}px;`);
          }
        } catch (e) {
          // Skip if lineHeight can't be accessed
        }

        try {
          const textAlign = safeGetProperty(node, 'textAlignHorizontal');
          if (textAlign) {
            const align = String(textAlign).toLowerCase();
            safePush(`text-align: ${align === 'justified' ? 'justify' : align};`);
          }
        } catch (e) {
          // Skip if textAlignHorizontal can't be accessed
        }

        try {
          const fills = safeGetProperty(node, 'fills');
          if (fills && fills[0] && safeGetProperty(fills[0], 'type') === 'SOLID') {
            const textColor = rgbToHex(safeGetProperty(fills[0], 'color'), safeGetProperty(fills[0], 'opacity'));
            safePush(`color: ${textColor};`);
          }
        } catch (e) {
          // Skip if text color can't be processed
        }
      }
    } catch (e) {
      // Skip text styling if type can't be accessed
    }

    // Safely join CSS strings, filtering out any that might contain symbols
    const safeCss = css.filter(line => {
      try {
        return typeof line === 'string' && line.length > 0;
      } catch (e) {
        return false;
      }
    }).map(line => {
      try {
        return String(line);
      } catch (e) {
        return '/* Invalid CSS line */';
      }
    });

    return safeCss.join('\n  ');
  } catch (error) {
    console.error(`Error generating CSS for node "${safeGetProperty(node, 'name') || 'unknown'}":`, error);
    return `/* Error generating CSS: ${error.message} */`;
  }
}

// Generate comprehensive CSS for all layers (like Figma's "Copy all layers as CSS")
function generateAllLayersCSS(node, parentName = '') {
  const allCSS = [];

  try {
    const nodeName = sanitizeCSSName(node.name);
    const fullName = parentName ? `${parentName} ${nodeName}` : nodeName;

    // Generate CSS for current node
    const nodeCSS = generateCSS(node);
    if (nodeCSS) {
      allCSS.push(`/* ${node.name} */\n\n.${nodeName.toLowerCase()} {\n  ${nodeCSS}\n}`);
    }

    // Recursively generate CSS for children
    if ('children' in node && node.children) {
      for (const child of node.children) {
        try {
          const childCSS = generateAllLayersCSS(child, nodeName);
          if (childCSS) {
            allCSS.push(childCSS);
          }
        } catch (error) {
          console.error(`Error generating CSS for child node "${child.name}":`, error);
          // Continue with other children
        }
      }
    }
  } catch (error) {
    console.error(`Error generating CSS for node "${node.name}":`, error);
  }

  return allCSS.join('\n\n\n');
}

// 🎨 PICASSO-LEVEL: Sanitize node names for CSS class names
function sanitizeCSSName(name) {
  return name
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();
}

// 🧹 ENHANCED: Sanitize component names for TypeScript React components
function sanitizeComponentName(name) {
  return name
    // Remove special characters and replace with spaces
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    // Split by spaces and capitalize each word
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
    // Ensure it starts with uppercase
    .replace(/^[a-z]/, char => char.toUpperCase())
    // Remove any remaining invalid characters
    .replace(/[^a-zA-Z0-9]/g, '')
    // Ensure it's not empty
    || 'Component';
}

// 🎨 PICASSO-LEVEL: Generate React component with full hierarchy and enhanced naming
function generateReactComponent(node, isRoot = true) {
  const componentName = sanitizeComponentName(safeGetProperty(node, 'name') || 'Component');
  const nodeType = safeGetProperty(node, 'type');
  const className = sanitizeCSSName(safeGetProperty(node, 'name') || 'component');

  // Generate JSX for children
  let childrenJSX = '';
  try {
    if ('children' in node && node.children && Array.isArray(node.children)) {
      childrenJSX = node.children.map(child => {
        try {
          const childName = sanitizeComponentName(safeGetProperty(child, 'name') || 'Child');
          const childClassName = sanitizeCSSName(safeGetProperty(child, 'name') || 'child');
          const childType = safeGetProperty(child, 'type');

          if (childType === 'TEXT') {
            const characters = safeGetProperty(child, 'characters') || 'Text';
            return `      <div className="${childClassName}">${characters}</div>`;
          } else {
            return `      <${childName} />`;
          }
        } catch (e) {
          return `      {/* Error rendering child component */}`;
        }
      }).join('\n');
    }
  } catch (e) {
    childrenJSX = '      {/* Error processing children */}';
  }

  // Generate main JSX
  let jsx = '';
  if (nodeType === 'TEXT') {
    const characters = safeGetProperty(node, 'characters') || 'Text';
    jsx = `<div className="${className}">${characters}</div>`;
  } else {
    jsx = `<div className="${className}">
${childrenJSX || '      {/* Add content here */}'}
    </div>`;
  }

  // Generate child components
  let childComponents = '';
  try {
    if ('children' in node && node.children && Array.isArray(node.children)) {
      childComponents = node.children.map(child => {
        try {
          const childType = safeGetProperty(child, 'type');
          if (childType !== 'TEXT') {
            return generateReactComponent(child, false);
          }
          return '';
        } catch (e) {
          return '// Error generating child component';
        }
      }).filter(comp => comp.length > 0).join('\n\n');
    }
  } catch (e) {
    childComponents = '// Error processing child components';
  }

  // Generate the main component
  const mainComponent = `const ${componentName} = () => {
  return (
    ${jsx}
  );
};`;

  if (isRoot) {
    // For root component, include all child components and comprehensive CSS
    const allLayersCSS = generateAllLayersCSS(node);

    return `${childComponents ? childComponents + '\n\n' : ''}${mainComponent}

// Comprehensive CSS for all layers
const styles = \`
${allLayersCSS}
\`;

export default ${componentName};
`;
  } else {
    // For child components, just return the component
    return mainComponent;
  }
}

// Helper functions
function rgbToHex(rgb, opacity = 1) {
  try {
    if (!rgb) return '#000000';

    const r = Math.round((safeGetProperty(rgb, 'r') || 0) * 255);
    const g = Math.round((safeGetProperty(rgb, 'g') || 0) * 255);
    const b = Math.round((safeGetProperty(rgb, 'b') || 0) * 255);
    const a = opacity !== undefined ? opacity : 1;

    if (a < 1) {
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch (error) {
    return '#000000'; // Fallback color
  }
}

function getFontWeight(style) {
  const weights = {
    'Thin': 100,
    'ExtraLight': 200,
    'Light': 300,
    'Regular': 400,
    'Medium': 500,
    'SemiBold': 600,
    'Bold': 700,
    'ExtraBold': 800,
    'Black': 900
  };
  return weights[style] || 400;
}

function toPascalCase(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
    return word.toUpperCase();
  }).replace(/\s+/g, '');
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

// Helper function to safely serialize properties that might contain symbols
function serializeProperty(prop) {
  if (prop === undefined || prop === null) return null;

  // Handle symbols directly
  if (typeof prop === 'symbol') {
    return prop.toString();
  }

  // Handle functions
  if (typeof prop === 'function') {
    return '[Function]';
  }

  // Handle arrays
  if (Array.isArray(prop)) {
    return prop.map(item => serializeProperty(item));
  }

  // Handle objects
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

  // Handle primitives
  try {
    return JSON.parse(JSON.stringify(prop));
  } catch (error) {
    return String(prop);
  }
}

// Deep serialize function to ensure postMessage compatibility
function deepSerialize(obj) {
  try {
    // First pass through serializeProperty to handle symbols
    const serialized = serializeProperty(obj);

    // Second pass through JSON to ensure complete serialization
    return JSON.parse(JSON.stringify(serialized));
  } catch (error) {
    console.error('Error in deep serialization:', error);
    return {
      error: 'Serialization failed',
      message: error.message
    };
  }
}

// Send data to MCP server
async function sendToMCPServer(data) {
  try {
    console.log('Sending to MCP server:', data);

    // Check if we have network access
    if (typeof fetch === 'undefined') {
      throw new Error('Network access not available. Please check plugin permissions.');
    }

    // Send to the MCP server plugin endpoint
    const response = await fetch('http://localhost:3333/plugin/figma-dev-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    console.log('MCP server response:', result);

    if (!result.success) {
      throw new Error(result.error || 'Unknown error from MCP server');
    }

    return result;
  } catch (error) {
    console.error('Error sending to MCP server:', error);

    // Provide helpful error messages
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Cannot connect to MCP server. Make sure the server is running on localhost:3333');
    }

    throw error;
  }
}
