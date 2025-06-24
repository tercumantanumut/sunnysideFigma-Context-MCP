import React from 'react';
import styles from './TestComponent.module.css';

interface TestComponentProps {
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

const TestComponent: React.FC<TestComponentProps> = ({ 
  title = "Test Component", 
  children, 
  className 
}) => {
  return (
    <div className={`${styles.testComponent} ${className || ''}`}>
      <h2 className={styles.testHeader}>{title}</h2>
      
      <div className={styles.testCard}>
        <p>This is a test component created to verify token detection.</p>
        {children}
      </div>
      
      <button className={styles.testButton}>
        Test Button
      </button>
      
      <div className={styles.testGrid}>
        <div>Grid Item 1</div>
        <div>Grid Item 2</div>
        <div>Grid Item 3</div>
        <div>Grid Item 4</div>
      </div>
    </div>
  );
};

export default TestComponent;
