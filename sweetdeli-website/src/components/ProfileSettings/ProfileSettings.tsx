import React from 'react';
import styles from './ProfileSettings.module.css';
import { Sidebar } from './Sidebar';
import { LoginSecurity } from './LoginSecurity';

interface ProfileSettingsProps {
  className?: string;
  style?: React.CSSProperties;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ className, style }) => {
  return (
    <div className={`${styles.profileSettings} ${className || ''}`} style={style}>
      <div className={styles.paymentMethods}>
        <Sidebar />
        <LoginSecurity />
      </div>
    </div>
  );
};

export default ProfileSettings;
