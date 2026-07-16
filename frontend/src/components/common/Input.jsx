import React, { forwardRef } from 'react';

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
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

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
          type={type}
          ref={ref}
          placeholder={placeholder}
          className={`w-full px-4 py-3 text-sm transition-all duration-300 border rounded-premium bg-surface/50 text-brand-navy focus:outline-none focus:bg-surface focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple placeholder-text-tertiary
            ${error ? 'border-error focus:border-error focus:ring-error/20' : 'border-border hover:border-brand-purple/40'}
          `}
          {...props}
        />
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
