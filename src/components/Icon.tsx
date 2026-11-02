import React from 'react';
import type { IconName } from '../types';

interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
}

export const Icon: React.FC<IconProps> = ({ name, className = 'ico', size = 22 }) => {
  const renderPaths = () => {
    switch (name) {
      case 'star':
        return <path d="M12 3 14.9 8.8 21.3 9.7 16.6 14.2 17.7 20.6 12 17.6 6.3 20.6 7.4 14.2 2.7 9.7 9.1 8.8 12 3Z" />;
      case 'chat':
        return (
          <>
            <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5A8.4 8.4 0 0 1 8 19.2L3 20.5l1.3-4.8A8.4 8.4 0 0 1 3 12a8.5 8.5 0 0 1 8.5-8.5A8.5 8.5 0 0 1 21 12Z" />
            <path d="M8 11h8M8 15h5" />
          </>
        );
      case 'user':
        return (
          <>
            <circle cx="12" cy="8" r="4" />
            <path d="M5 20c1.5-3.5 4.2-5 7-5s5.5 1.5 7 5" />
          </>
        );
      case 'home':
        return <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V10Z" />;
      case 'camera':
        return (
          <>
            <path d="M4 8h3l2-2h6l2 2h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" />
            <circle cx="12" cy="14" r="3.5" />
          </>
        );
      case 'send':
        return (
          <>
            <path d="M22 2 11 13" />
            <path d="m22 2-7 20-4-9-9-4 20-7Z" />
          </>
        );
      case 'check':
        return (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="m8.5 12.5 2.5 2.5 5-5.5" />
          </>
        );
      case 'spark':
        return (
          <>
            <path d="m12 3 2.4 5.5L20 11l-5.6 2.5L12 19l-2.4-5.5L4 11l5.6-2.5L12 3Z" />
            <path d="m19 16 1.2 2.1L22 19l-1.8.9L19 22l-1.1-2.1L16 19l1.9-.9L19 16Z" />
          </>
        );
      case 'recycle':
        return (
          <>
            <path d="m9 5 3-3 3 3" />
            <path d="M12 2v6H6l-2 4" />
            <path d="m17 8 4 1-1 4" />
            <path d="m21 9-4 7 3 4" />
            <path d="M7 17h8l2 4" />
          </>
        );
      case 'coffee':
        return (
          <>
            <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
            <path d="M3 8h14v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z" />
            <path d="M6 2v3M10 2v3M14 2v3" />
          </>
        );
      case 'food':
        return (
          <>
            <path d="M5 3v7a2 2 0 0 0 4 0V3" />
            <path d="M7 3v18" />
            <path d="M17 3c-2 1.5-3 4-3 7 0 2 1 3 3 3v8" />
          </>
        );
      case 'tag':
        return (
          <>
            <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
            <circle cx="7.5" cy="7.5" r="1.2" />
          </>
        );
      case 'book':
        return (
          <>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Z" />
            <path d="M6.5 17H20v4H6.5a2.5 2.5 0 0 1 0-4Z" />
          </>
        );
      case 'logout':
        return (
          <>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5M21 12H9" />
          </>
        );
      case 'close':
        return <path d="M18 6 6 18M6 6l12 12" />;
      case 'timer':
        return (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 6v6l4 2" />
          </>
        );
      case 'eye':
        return (
          <>
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </>
        );
      case 'eye-off':
        return (
          <>
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" x2="22" y1="2" y2="22" />
          </>
        );
      case 'arrow-right':
        return <path d="m9 18 6-6-6-6" />;
      case 'leaf':
      default:
        return (
          <>
            <path d="M20 4C12 4 6 8 6 14c0 3 2 5 5 4 6-2 9-8 9-14Z" />
            <path d="M3 21c4-6 8-10 14-14" />
          </>
        );
    }
  };

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {renderPaths()}
    </svg>
  );
};
