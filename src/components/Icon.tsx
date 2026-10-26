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
      case 'qr':
        return (
          <>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <path d="M14 14h3v3h-3zM18 18h3v3h-3zM18 14h3M14 18v3" />
          </>
        );
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
      case 'paper':
        return (
          <>
            <path d="M6 3h8l4 4v14H6z" />
            <path d="M14 3v5h5M9 12h6M9 16h6" />
          </>
        );
      case 'plastic':
        return (
          <>
            <path d="M9 3h6v4l2 2v12H7V9l2-2V3Z" />
            <path d="M9 7h6M7 13h10" />
          </>
        );
      case 'glass':
        return (
          <>
            <path d="M8 3h8l-1 18H9L8 3Z" />
            <path d="M8 7h8M10 12h4" />
          </>
        );
      case 'battery':
        return (
          <>
            <rect x="4" y="7" width="16" height="14" rx="2" />
            <path d="M9 7V4h6v3M12 10v8m-3-4h6" />
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
      case 'logout':
        return (
          <>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5M21 12H9" />
          </>
        );
      case 'plus':
        return <path d="M12 5v14M5 12h14" />;
      case 'close':
        return <path d="M18 6 6 18M6 6l12 12" />;
      case 'water':
        return <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />;
      case 'cloud':
        return <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />;
      case 'timer':
        return (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 6v6l4 2" />
          </>
        );
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
