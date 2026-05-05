// src/components/ui/Input.tsx
import React from 'react';

export const Input = ({ icon, ...props }: { icon?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <div className="relative w-full group">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
          {icon}
        </div>
      )}
      <input 
        className={`w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 text-sm transition-all focus:outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white focus:border-blue-200 placeholder:text-gray-400 ${icon ? 'pl-10 pr-4' : 'px-4'}`}
        {...props}
      />
    </div>
  );
};