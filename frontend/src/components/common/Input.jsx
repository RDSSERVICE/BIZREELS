import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Premium Custom Input Component
 * Styled according to Warm Editorial Bento-Brutalism design system (Pill-shaped borders & high-contrast labels).
 * Integrates perfectly with react-hook-form.
 */
const Input = forwardRef(({
  label,
  type = 'text',
  error,
  placeholder,
  className = '',
  id,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const isPassword = type === 'password';

  return (
    <div className={`flex flex-col w-full gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-[11px] font-extrabold tracking-wider text-slate-700 uppercase"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          ref={ref}
          placeholder={placeholder}
          className={`w-full px-4 py-3 text-xs font-medium transition-all duration-200 border border-[#e3dccb] rounded-full bg-white text-slate-800 focus:outline-none focus:border-[#d99a3d] focus:ring-2 focus:ring-[#d99a3d]/20 placeholder:text-slate-400 shadow-2xs
            ${isPassword ? 'pr-11' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'hover:border-slate-400'}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-slate-500" />
            ) : (
              <Eye className="w-4 h-4 text-slate-500" />
            )}
          </button>
        )}
      </div>
      {error && (
        <span className="text-xs font-medium text-red-500 pl-3">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
