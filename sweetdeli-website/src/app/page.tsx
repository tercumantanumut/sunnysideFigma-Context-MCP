import Link from 'next/link';
import ProfileSettings from '@/components/ProfileSettings/ProfileSettings';

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '60px 20px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 700,
            margin: '0 0 20px 0',
            fontFamily: 'DM Sans, sans-serif'
          }}>
            Sweetdeli Website
          </h1>
          <p style={{
            fontSize: '20px',
            margin: '0 0 30px 0',
            opacity: 0.9
          }}>
            A pixel-perfect recreation of the Figma design with modern web technologies
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/demo"
              style={{
                background: 'white',
                color: '#667eea',
                padding: '15px 30px',
                borderRadius: '50px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '16px',
                transition: 'transform 0.2s ease'
              }}
            >
              View Demo
            </Link>
            <a
              href="https://www.figma.com/design/rEOjYEdgIt4fZMulSMgybi/Sweetdeli---40--screens-Website-Wireframe-Kit--Mobile---Desktop---Free---Community-"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'transparent',
                color: 'white',
                padding: '15px 30px',
                borderRadius: '50px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '16px',
                border: '2px solid white',
                transition: 'all 0.2s ease'
              }}
            >
              View Figma Design
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ProfileSettings />

      {/* Footer */}
      <footer style={{
        background: '#23262F',
        color: 'white',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, opacity: 0.8 }}>
          Built with Next.js, React, TypeScript, and CSS Modules
        </p>
        <p style={{ margin: '10px 0 0 0', opacity: 0.6, fontSize: '14px' }}>
          Created from Figma design using Sunnyside Figma MCP tools
        </p>
      </footer>
    </main>
  );
}
