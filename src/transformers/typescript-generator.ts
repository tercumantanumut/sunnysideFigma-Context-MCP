/**
 * 🎨 PICASSO-LEVEL TYPESCRIPT CODE GENERATOR
 * Transforms Figma data into production-ready TypeScript React components
 */

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  css?: string;
  allLayersCSS?: string;
  react?: string;
  layout?: any;
  styling?: any;
  children?: FigmaNode[];
  characters?: string;
  fills?: any[];
  strokes?: any[];
  fontName?: any;
  fontSize?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface ComponentGenerationOptions {
  styleType: 'css-modules' | 'styled-components' | 'tailwind' | 'inline';
  componentFormat: 'functional' | 'class' | 'arrow';
  includeTypes: boolean;
  includeProps: boolean;
  includeChildren: boolean;
  exportFormat: 'default' | 'named' | 'both';
  addComments: boolean;
}

export class TypeScriptGenerator {
  private options: ComponentGenerationOptions;

  constructor(options: Partial<ComponentGenerationOptions> = {}) {
    this.options = {
      styleType: 'css-modules',
      componentFormat: 'functional',
      includeTypes: true,
      includeProps: true,
      includeChildren: true,
      exportFormat: 'default',
      addComments: true,
      ...options
    };
  }

  /**
   * 🚀 MASTER FUNCTION: Generate complete TypeScript React component
   */
  generateComponent(node: FigmaNode): {
    component: string;
    styles: string;
    types: string;
    index: string;
  } {
    const componentName = this.sanitizeComponentName(node.name);
    
    return {
      component: this.generateComponentFile(node, componentName),
      styles: this.generateStylesFile(node, componentName),
      types: this.generateTypesFile(node, componentName),
      index: this.generateIndexFile(componentName)
    };
  }

  /**
   * 🧹 SANITIZE: Convert Figma names to valid TypeScript component names
   */
  private sanitizeComponentName(name: string): string {
    return name
      // Remove special characters and replace with camelCase
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

  /**
   * 🏗️ COMPONENT: Generate TypeScript React component file
   */
  private generateComponentFile(node: FigmaNode, componentName: string): string {
    const imports = this.generateImports(componentName);
    const interfaces = this.generateInterfaces(node, componentName);
    const component = this.generateComponentBody(node, componentName);
    const exports = this.generateExports(componentName);

    return `${imports}\n\n${interfaces}\n\n${component}\n\n${exports}`;
  }

  /**
   * 📦 IMPORTS: Generate all necessary imports
   */
  private generateImports(componentName: string): string {
    const imports = ["import React from 'react';"];

    switch (this.options.styleType) {
      case 'css-modules':
        imports.push(`import styles from './${componentName}.module.css';`);
        break;
      case 'styled-components':
        imports.push("import styled from 'styled-components';");
        break;
      case 'tailwind':
        // No additional imports needed for Tailwind
        break;
    }

    if (this.options.includeTypes) {
      imports.push(`import type { ${componentName}Props } from './${componentName}.types';`);
    }

    return imports.join('\n');
  }

  /**
   * 🏷️ INTERFACES: Generate TypeScript interfaces
   */
  private generateInterfaces(node: FigmaNode, componentName: string): string {
    if (!this.options.includeTypes) return '';

    const props = this.extractPropsFromNode(node);
    const propsInterface = `interface ${componentName}Props {
${props.map(prop => `  ${prop.name}${prop.optional ? '?' : ''}: ${prop.type};`).join('\n')}
}`;

    return this.options.addComments 
      ? `/**\n * Props for ${componentName} component\n */\n${propsInterface}`
      : propsInterface;
  }

  /**
   * 🧬 PROPS: Extract props from Figma node
   */
  private extractPropsFromNode(node: FigmaNode): Array<{name: string, type: string, optional: boolean}> {
    const props = [
      { name: 'className', type: 'string', optional: true },
      { name: 'style', type: 'React.CSSProperties', optional: true }
    ];

    // Add text content prop for text nodes
    if (node.type === 'TEXT' && node.characters) {
      props.push({ name: 'children', type: 'React.ReactNode', optional: true });
    }

    // Add onClick for interactive elements
    if (this.isInteractiveElement(node)) {
      props.push({ name: 'onClick', type: '() => void', optional: true });
    }

    return props;
  }

  /**
   * 🎯 INTERACTIVE: Check if element should be interactive
   */
  private isInteractiveElement(node: FigmaNode): boolean {
    const interactiveTypes = ['BUTTON', 'INSTANCE'];
    const interactiveNames = ['button', 'btn', 'link', 'clickable'];
    
    return interactiveTypes.includes(node.type) || 
           interactiveNames.some(name => node.name.toLowerCase().includes(name));
  }

  /**
   * 🏗️ COMPONENT BODY: Generate the main component function
   */
  private generateComponentBody(node: FigmaNode, componentName: string): string {
    const propsParam = this.options.includeProps ? `props: ${componentName}Props` : '';
    const destructuring = this.generatePropsDestructuring(node);
    const jsx = this.generateJSX(node, componentName);

    const componentFunction = `const ${componentName}: React.FC${this.options.includeProps ? `<${componentName}Props>` : ''} = (${propsParam}) => {
${destructuring ? `  ${destructuring}\n` : ''}
  return (
${jsx}
  );
};`;

    return this.options.addComments
      ? `/**\n * ${componentName} component generated from Figma\n */\n${componentFunction}`
      : componentFunction;
  }

  /**
   * 🔧 DESTRUCTURING: Generate props destructuring
   */
  private generatePropsDestructuring(node: FigmaNode): string {
    if (!this.options.includeProps) return '';

    const props = ['className', 'style'];
    
    if (node.type === 'TEXT') props.push('children');
    if (this.isInteractiveElement(node)) props.push('onClick');

    return `const { ${props.join(', ')}, ...restProps } = props;`;
  }

  /**
   * 🎨 JSX: Generate JSX structure
   */
  private generateJSX(node: FigmaNode, componentName: string, depth = 0): string {
    const indent = '    '.repeat(depth + 1);
    const className = this.generateClassName(node, componentName);
    const attributes = this.generateAttributes(node);
    const children = this.generateChildren(node, depth + 1);

    const element = node.type === 'TEXT' ? 'span' : 'div';
    const content = node.type === 'TEXT' && node.characters 
      ? `{children || '${node.characters}'}`
      : children;

    return `${indent}<${element}${className}${attributes}>
${content}
${indent}</${element}>`;
  }

  /**
   * 🎨 CLASS NAME: Generate className based on style type
   */
  private generateClassName(node: FigmaNode, componentName: string): string {
    const baseName = this.sanitizeCSSName(node.name);
    
    switch (this.options.styleType) {
      case 'css-modules':
        return ` className={styles.${baseName}}`;
      case 'tailwind':
        return ` className="${this.generateTailwindClasses(node)}"`;
      case 'styled-components':
        return ''; // Styled components don't use className
      case 'inline':
        return ` style={${JSON.stringify(this.generateInlineStyles(node))}}`;
      default:
        return ` className="${baseName}"`;
    }
  }

  /**
   * 🧹 CSS NAME: Sanitize names for CSS classes
   */
  private sanitizeCSSName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-')
      .toLowerCase();
  }

  /**
   * 🎯 ATTRIBUTES: Generate additional attributes
   */
  private generateAttributes(node: FigmaNode): string {
    const attrs = [];
    
    if (this.options.includeProps) {
      attrs.push('{...restProps}');
    }

    if (this.isInteractiveElement(node)) {
      attrs.push('onClick={onClick}');
    }

    return attrs.length > 0 ? ` ${attrs.join(' ')}` : '';
  }

  /**
   * 👶 CHILDREN: Generate child components
   */
  private generateChildren(node: FigmaNode, depth: number): string {
    if (!this.options.includeChildren || !node.children || node.children.length === 0) {
      return '';
    }

    return node.children
      .map(child => this.generateJSX(child, this.sanitizeComponentName(child.name), depth))
      .join('\n');
  }

  /**
   * 🎨 TAILWIND: Generate Tailwind classes from Figma styles
   */
  private generateTailwindClasses(node: FigmaNode): string {
    const classes = [];

    // Position
    if (node.layout?.x !== undefined || node.layout?.y !== undefined) {
      classes.push('absolute');
    } else {
      classes.push('relative');
    }

    // Size
    if (node.layout?.width) classes.push(`w-[${node.layout.width}px]`);
    if (node.layout?.height) classes.push(`h-[${node.layout.height}px]`);

    // Background color
    if (node.styling?.fills?.[0]?.color) {
      const color = this.rgbToTailwind(node.styling.fills[0].color);
      classes.push(`bg-${color}`);
    }

    // Text styles for text nodes
    if (node.type === 'TEXT') {
      if (node.fontSize) classes.push(`text-[${node.fontSize}px]`);
      classes.push('font-normal');
    }

    return classes.join(' ');
  }

  /**
   * 🎨 INLINE STYLES: Generate inline styles object
   */
  private generateInlineStyles(node: FigmaNode): Record<string, any> {
    const styles: Record<string, any> = {};

    if (node.layout?.width) styles.width = `${node.layout.width}px`;
    if (node.layout?.height) styles.height = `${node.layout.height}px`;
    if (node.layout?.x !== undefined) styles.left = `${node.layout.x}px`;
    if (node.layout?.y !== undefined) styles.top = `${node.layout.y}px`;

    return styles;
  }

  /**
   * 🎨 RGB TO TAILWIND: Convert RGB to Tailwind color
   */
  private rgbToTailwind(rgb: any): string {
    // Simplified conversion - in production, you'd want a more sophisticated mapping
    const r = Math.round(rgb.r * 255);
    const g = Math.round(rgb.g * 255);
    const b = Math.round(rgb.b * 255);
    
    // Return hex for custom colors
    return `[#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}]`;
  }

  /**
   * 📄 STYLES FILE: Generate styles file
   */
  private generateStylesFile(node: FigmaNode, componentName: string): string {
    switch (this.options.styleType) {
      case 'css-modules':
        return this.generateCSSModules(node);
      case 'styled-components':
        return this.generateStyledComponents(node, componentName);
      default:
        return '';
    }
  }

  /**
   * 🎨 CSS MODULES: Generate CSS modules file
   */
  private generateCSSModules(node: FigmaNode): string {
    // Use the existing allLayersCSS but convert to CSS modules format
    if (node.allLayersCSS) {
      return node.allLayersCSS
        .replace(/\/\* (.+?) \*\//g, '/* $1 */')
        .replace(/\.([a-zA-Z-]+)/g, '.$1');
    }
    return '';
  }

  /**
   * 💅 STYLED COMPONENTS: Generate styled-components
   */
  private generateStyledComponents(node: FigmaNode, componentName: string): string {
    return `import styled from 'styled-components';

export const Styled${componentName} = styled.div\`
  ${node.css || ''}
\`;`;
  }

  /**
   * 🏷️ TYPES FILE: Generate types file
   */
  private generateTypesFile(node: FigmaNode, componentName: string): string {
    if (!this.options.includeTypes) return '';

    const props = this.extractPropsFromNode(node);
    return `export interface ${componentName}Props {
${props.map(prop => `  ${prop.name}${prop.optional ? '?' : ''}: ${prop.type};`).join('\n')}
}`;
  }

  /**
   * 📦 INDEX FILE: Generate index file
   */
  private generateIndexFile(componentName: string): string {
    return `export { default } from './${componentName}';
export type { ${componentName}Props } from './${componentName}.types';`;
  }

  /**
   * 📤 EXPORTS: Generate exports
   */
  private generateExports(componentName: string): string {
    switch (this.options.exportFormat) {
      case 'named':
        return `export { ${componentName} };`;
      case 'both':
        return `export { ${componentName} };\nexport default ${componentName};`;
      default:
        return `export default ${componentName};`;
    }
  }
}
