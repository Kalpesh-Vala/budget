'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardProps) {
  return <div className={`mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: CardProps) {
  return <h2 className={`text-2xl font-bold text-gray-900 dark:text-white ${className}`}>{children}</h2>;
}

export function CardContent({ children, className = '' }: CardProps) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }: CardProps) {
  return <div className={`mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 ${className}`}>{children}</div>;
}
