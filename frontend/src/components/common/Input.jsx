import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Premium Custom Input Component
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
          className="text-xs font-semibold tracking-wide text-brand-navy uppercase"
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
          className={`w-full px-4 py-3 text-sm transition-all duration-300 border rounded-premium bg-surface/50 text-brand-navy focus:outline-none focus:bg-surface focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple placeholder-text-tertiary
            ${isPassword ? 'pr-11' : ''}
            ${error ? 'border-error focus:border-error focus:ring-error/20' : 'border-border hover:border-brand-purple/40'}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-brand-purple focus:outline-none cursor-pointer p-1 rounded-full hover:bg-neutral-100/10 dark:hover:bg-neutral-800/10 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-text-secondary" />
            ) : (
              <Eye className="w-4 h-4 text-text-secondary" />
            )}
          </button>
        )}
      </div>
      {error && (
        <span className="text-xs font-medium text-error animate-slide-down">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
