import React from 'react';
import styles from './Sidebar.module.css';
import { UserIcon, LockIcon, CreditCardIcon, BellIcon } from '../Icons';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const menuItems = [
    {
      icon: <UserIcon />,
      label: 'Personal info',
      active: false,
    },
    {
      icon: <LockIcon />,
      label: 'Login and security',
      active: true,
    },
    {
      icon: <CreditCardIcon />,
      label: 'My payments',
      active: false,
    },
    {
      icon: <BellIcon />,
      label: 'My voucher',
      active: false,
    },
    {
      icon: <BellIcon />,
      label: 'My points',
      active: false,
    },
    {
      icon: <BellIcon />,
      label: 'My orders',
      active: false,
    },
  ];

  return (
    <div className={`${styles.categories} ${className || ''}`}>
      {menuItems.map((item, index) => (
        <div 
          key={index} 
          className={`${styles.menuItem} ${item.active ? styles.active : ''}`}
        >
          <div className={styles.iconContainer}>
            {item.icon}
          </div>
          <span className={styles.label}>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export { Sidebar };
