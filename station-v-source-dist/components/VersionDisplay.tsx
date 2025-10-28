import React from 'react';
import pkg from '../package.json';

export const VersionDisplay: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  return (
    <div className={`text-xs text-gray-500 ${className}`}>
      {`v${pkg.version}`}
      <div className="text-[10px] text-gray-600">
        {process.env.NODE_ENV === 'development' ? '(Development)' : '(Production)'}
      </div>
    </div>
  );
};