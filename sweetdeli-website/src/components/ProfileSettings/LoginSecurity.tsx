import React from 'react';
import styles from './LoginSecurity.module.css';
import { Button } from '../Button';

interface LoginSecurityProps {
  className?: string;
}

const LoginSecurity: React.FC<LoginSecurityProps> = ({ className }) => {
  return (
    <div className={`${styles.login} ${className || ''}`}>
      <div className={styles.loginContent}>
        {/* Title Section */}
        <div className={styles.title}>
          <h1 className={styles.heading}>Login and security</h1>
          <Button variant="outline" size="sm">
            View profile
          </Button>
        </div>

        {/* Account Info Section */}
        <div className={styles.accountInfo}>
          {/* Login Section */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Login</h2>
            <div className={styles.sectionContent}>
              <div className={styles.infoItem}>
                <div className={styles.infoDetails}>
                  <div className={styles.infoLabel}>Password</div>
                  <div className={styles.infoDescription}>Last updated 1 month ago</div>
                </div>
                <Button variant="outline" size="sm">
                  Update password
                </Button>
              </div>
            </div>
          </div>

          <div className={styles.divider}></div>

          {/* Social Accounts Section */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Social accounts</h2>
            <div className={styles.socialAccounts}>
              <div className={styles.socialAccount}>
                <div className={styles.infoDetails}>
                  <div className={styles.infoLabel}>Facebook</div>
                  <div className={styles.infoDescription}>Not connected</div>
                </div>
                <Button variant="outline" size="sm">
                  Connect
                </Button>
              </div>
              
              <div className={styles.socialDivider}></div>
              
              <div className={styles.socialAccount}>
                <div className={styles.infoDetails}>
                  <div className={styles.infoLabel}>Apple account</div>
                  <div className={styles.infoDescription}>Not connected</div>
                </div>
                <Button variant="outline" size="sm">
                  Connect
                </Button>
              </div>
            </div>
          </div>

          <div className={styles.divider}></div>

          {/* Device History Section */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Device history</h2>
            <div className={styles.deviceHistory}>
              <div className={styles.historyItem}>
                <div className={styles.infoDetails}>
                  <div className={styles.infoLabel}>Session</div>
                  <div className={styles.infoDescription}>May 14, 2021 at 08:36pm</div>
                </div>
                <Button variant="outline" size="sm">
                  Log out device
                </Button>
              </div>

              <div className={styles.divider}></div>

              <div className={styles.historyItem}>
                <div className={styles.infoDetails}>
                  <div className={styles.infoLabel}>macOs Big Sur. Chrome</div>
                  <div className={styles.infoDescription}>May 14, 2021 at 08:36pm</div>
                </div>
                <Button variant="outline" size="sm">
                  Log out device
                </Button>
              </div>

              <div className={styles.divider}></div>

              <div className={styles.historyItem}>
                <div className={styles.infoDetails}>
                  <div className={styles.infoLabel}>Session</div>
                  <div className={styles.infoDescription}>May 14, 2021 at 08:36pm</div>
                </div>
                <Button variant="outline" size="sm">
                  Log out device
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { LoginSecurity };
