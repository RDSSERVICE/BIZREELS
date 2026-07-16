import React from 'react';
import { ImSpinner2 } from 'react-icons/im';

/**
 * Premium Custom Button Component
 * Supporting various style options from the BizReels brand system.
 */
const Button = ({
  children,
  type = 'button',
  variant = 'primary', // primary | secondary | accent | outline | glass | text
  size = 'md', // sm | md | lg
  isLoading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  onClick,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-premium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
  };

  const variantStyles = {
    primary: 'bg-brand-purple hover:bg-brand-purple-700 text-white shadow-premium focus:ring-brand-purple-500',
    secondary: 'bg-brand-orange hover:bg-brand-orange-600 text-white shadow-premium focus:ring-brand-orange-500',
    accent: 'gradient-brand hover:brightness-110 text-white shadow-premium focus:ring-brand-pink-500',
    outline: 'border border-brand-purple text-brand-purple hover:bg-brand-purple-50 focus:ring-brand-purple-500',
    glass: 'glass hover:bg-white/90 text-brand-navy shadow-glass focus:ring-brand-purple-500 border-white/40',
    text: 'text-brand-purple hover:bg-brand-purple-50 focus:ring-brand-purple-500',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <ImSpinner2 className="animate-spin mr-2 h-4 w-4" />
      ) : Icon ? (
        <Icon className="mr-2 h-4 w-4" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
