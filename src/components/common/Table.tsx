'use client';

import React from 'react';

interface TableProps {
  columns: { key: string; label: string; render?: (value: any, row?: any) => React.ReactNode }[];
  data: any[];
  className?: string;
  striped?: boolean;
}

export function Table({ columns, data, className = '', striped = true }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-left text-sm ${className}`}>
        <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={idx}
                className={`border-b border-gray-200 dark:border-gray-700 ${
                  striped && idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
