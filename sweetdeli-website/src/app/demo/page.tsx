import React from 'react';
import ProfileSettings from '@/components/ProfileSettings/ProfileSettings';

export default function DemoPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '30px',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '32px', 
            fontWeight: 700,
            fontFamily: 'DM Sans, sans-serif'
          }}>
            Sweetdeli Profile Settings
          </h1>
          <p style={{ 
            margin: '10px 0 0 0', 
            fontSize: '16px',
            opacity: 0.9
          }}>
            Created from Figma Design with Pixel-Perfect Accuracy
          </p>
        </div>
        
        <ProfileSettings />
        
        <div style={{
          background: '#f8f9fa',
          padding: '30px',
          textAlign: 'center',
          borderTop: '1px solid #e9ecef'
        }}>
          <h3 style={{ 
            margin: '0 0 15px 0', 
            color: '#23262F',
            fontFamily: 'DM Sans, sans-serif'
          }}>
            Features Implemented
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginTop: '20px'
          }}>
            <div style={{ textAlign: 'left' }}>
              <h4 style={{ color: '#23262F', margin: '0 0 8px 0' }}>✨ Design Fidelity</h4>
              <p style={{ color: '#777E90', margin: 0, fontSize: '14px' }}>
                Pixel-perfect recreation from Figma design
              </p>
            </div>
            <div style={{ textAlign: 'left' }}>
              <h4 style={{ color: '#23262F', margin: '0 0 8px 0' }}>📱 Responsive</h4>
              <p style={{ color: '#777E90', margin: 0, fontSize: '14px' }}>
                Works perfectly on all device sizes
              </p>
            </div>
            <div style={{ textAlign: 'left' }}>
              <h4 style={{ color: '#23262F', margin: '0 0 8px 0' }}>⚡ Performance</h4>
              <p style={{ color: '#777E90', margin: 0, fontSize: '14px' }}>
                Optimized with Next.js and TypeScript
              </p>
            </div>
            <div style={{ textAlign: 'left' }}>
              <h4 style={{ color: '#23262F', margin: '0 0 8px 0' }}>🎨 Design System</h4>
              <p style={{ color: '#777E90', margin: 0, fontSize: '14px' }}>
                Consistent colors, typography, and spacing
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
