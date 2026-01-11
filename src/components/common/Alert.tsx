'use client';

import React from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
}

export function Alert({ type, title, message, onClose }: AlertProps) {
  const typeStyles = {
    success: 'bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700',
    error: 'bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700',
    warning: 'bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700',
    info: 'bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700',
  };

  return (
    <div className={`border rounded-lg p-4 ${typeStyles[type]}`}>
      <div className="flex items-start justify-between">
        <div>
          {title && <h3 className="font-semibold mb-1">{title}</h3>}
          <p className="text-sm">{message}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-4 font-bold text-lg">
            ×
          </button>
        )}
      </div>
    </div>
  );
}
