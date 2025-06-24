import React from 'react';
import Image from 'next/image';

interface IconProps {
  className?: string;
  size?: number;
}

// Using the actual SVG files downloaded from Figma
export const UserIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <div className={className} style={{ width: size, height: size, color: 'currentColor' }}>
    <Image
      src="/images/user-icon.svg"
      alt="User Icon"
      width={size}
      height={size}
      style={{ filter: 'brightness(0) saturate(100%) invert(47%) sepia(8%) saturate(1077%) hue-rotate(202deg) brightness(95%) contrast(86%)' }}
    />
  </div>
);

export const LockIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <div className={className} style={{ width: size, height: size, position: 'relative' }}>
    <Image
      src="/images/lock-icon-1.svg"
      alt="Lock Icon"
      width={size}
      height={size}
      style={{
        position: 'absolute',
        filter: 'brightness(0) saturate(100%) invert(13%) sepia(8%) saturate(1077%) hue-rotate(202deg) brightness(95%) contrast(86%)'
      }}
    />
  </div>
);

export const CreditCardIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <div className={className} style={{ width: size, height: size, position: 'relative' }}>
    <Image
      src="/images/credit-card-icon-1.svg"
      alt="Credit Card Icon"
      width={size}
      height={size}
      style={{
        position: 'absolute',
        filter: 'brightness(0) saturate(100%) invert(47%) sepia(8%) saturate(1077%) hue-rotate(202deg) brightness(95%) contrast(86%)'
      }}
    />
  </div>
);

export const BellIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M8 2C5.79 2 4 3.79 4 6V9L2 11V12H14V11L12 9V6C12 3.79 10.21 2 8 2Z"
      fill="currentColor"
    />
    <path
      d="M9 13C9 13.55 8.55 14 8 14C7.45 14 7 13.55 7 13"
      stroke="currentColor"
      strokeWidth="1"
    />
  </svg>
);
