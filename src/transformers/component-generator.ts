/**
 * Clean Component Generator - No Jest/Storybook bloat
 * Generates simple, production-ready React components
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
}

export interface ComponentOptions {
  styleType: 'css-modules' | 'styled-components' | 'tailwind' | 'inline';
  componentName?: string;
  includeChildren?: boolean;
}

export class ComponentGenerator {
  generateCleanComponent(node: FigmaNode, options: ComponentOptions): { component: string; styles?: string } {
    const componentName = this.sanitizeComponentName(options.componentName || node.name);
    
    switch (options.styleType) {
      case 'css-modules':
        return this.generateCSSModuleComponent(node, componentName, options.includeChildren);
      case 'styled-components':
        return { component: this.generateStyledComponent(node, componentName) };
      case 'tailwind':
        return { component: this.generateTailwindComponent(node, componentName) };
      case 'inline':
        return { component: this.generateInlineComponent(node, componentName) };
      default:
        return { component: this.generateBasicComponent(node, componentName) };
    }
  }

  private sanitizeComponentName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
      .replace(/^[a-z]/, char => char.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, '')
      || 'Component';
  }

  private generateCSSModuleComponent(node: FigmaNode, componentName: string, includeChildren?: boolean): { component: string; styles: string } {
    const className = componentName.toLowerCase();
    
    const component = `import React from 'react';
import styles from './${componentName}.module.css';

interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
}

const ${componentName}: React.FC<${componentName}Props> = ({ className, children }) => {
  return (
    <div className={\`\${styles.${className}} \${className || ''}\`}>
      {children}
    </div>
  );
};

export default ${componentName};`;

    const styles = `.${className} {
  ${node.css || '/* Add styles here */'}
}`;

    return { component, styles };
  }

  private generateStyledComponent(node: FigmaNode, componentName: string): string {
    return `import React from 'react';
import styled from 'styled-components';

const Styled${componentName} = styled.div\`
  ${node.css || '/* Add styles here */'}
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

  private generateTailwindComponent(node: FigmaNode, componentName: string): string {
    const classes = this.cssToTailwind(node.css || '');
    
    return `import React from 'react';

interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
}

const ${componentName}: React.FC<${componentName}Props> = ({ className, children }) => {
  return (
    <div className={\`${classes} \${className || ''}\`}>
      {children}
    </div>
  );
};

export default ${componentName};`;
  }

  private generateInlineComponent(node: FigmaNode, componentName: string): string {
    const styles = this.cssToStyleObject(node.css || '');
    
    return `import React from 'react';

interface ${componentName}Props {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const ${componentName}: React.FC<${componentName}Props> = ({ className, style, children }) => {
  const inlineStyles = ${styles};
  
  return (
    <div className={className} style={{ ...inlineStyles, ...style }}>
      {children}
    </div>
  );
};

export default ${componentName};`;
  }

  private generateBasicComponent(node: FigmaNode, componentName: string): string {
    return `import React from 'react';

interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
}

const ${componentName}: React.FC<${componentName}Props> = ({ className, children }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export default ${componentName};`;
  }

  private cssToTailwind(css: string): string {
    // Simple conversion - focus on common properties
    const lines = css.split('\n').filter(line => line.trim());
    const classes: string[] = [];
    
    for (const line of lines) {
      const [property, value] = line.split(':').map(s => s.trim().replace(';', ''));
      if (!property || !value) continue;
      
      if (property === 'display' && value === 'flex') classes.push('flex');
      else if (property === 'width' && value.endsWith('px')) classes.push(`w-[${value}]`);
      else if (property === 'height' && value.endsWith('px')) classes.push(`h-[${value}]`);
      else if (property === 'background-color') classes.push(`bg-[${value}]`);
      else if (property === 'color') classes.push(`text-[${value}]`);
      else if (property === 'border-radius') classes.push(`rounded-[${value}]`);
      else if (property === 'padding') classes.push(`p-[${value}]`);
      else if (property === 'margin') classes.push(`m-[${value}]`);
    }
    
    return classes.join(' ') || 'block';
  }

  private cssToStyleObject(css: string): string {
    const lines = css.split('\n').filter(line => line.trim());
    const styleProps = lines.map(line => {
      const [prop, value] = line.split(':').map(s => s.trim());
      if (prop && value) {
        const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        return `    ${camelProp}: '${value.replace(';', '')}'`;
      }
      return '';
    }).filter(Boolean);
    
    return `{
${styleProps.join(',\n')}
  }`;
  }
}