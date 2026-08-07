/**
 * components/ui/Button.jsx — Reusable Button Component
 *
 * Variants: primary | ghost | outline | danger
 * Sizes: sm | md | lg
 */

import { cn } from '../../utils/cn';

const VARIANTS = {
  primary: 'btn-primary',
  ghost:   'btn-ghost',
  outline: 'inline-flex items-center justify-center gap-2 rounded-md border border-navy-800 px-5 py-2.5 text-sm font-semibold text-navy-800 transition-colors duration-150 hover:bg-navy-50 focus:outline-none focus:ring-2 focus:ring-accent-600 focus:ring-offset-2',
  danger:  'inline-flex items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition-colors duration-150 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2',
};

const SIZES = {
  sm: 'text-xs px-3 py-2',
  md: 'text-sm px-5 py-2.5',
  lg: 'text-base px-6 py-3',
};

/**
 * @param {{
 *   variant?: 'primary'|'ghost'|'outline'|'danger'
 *   size?: 'sm'|'md'|'lg'
 *   isLoading?: boolean
 *   disabled?: boolean
 *   fullWidth?: boolean
 *   className?: string
 *   children: React.ReactNode
 * } & React.ButtonHTMLAttributes<HTMLButtonElement>} props
 */
const Button = ({
  variant    = 'primary',
  size       = 'md',
  isLoading  = false,
  disabled   = false,
  fullWidth  = false,
  className  = '',
  children,
  ...rest
}) => (
  <button
    disabled={disabled || isLoading}
    className={cn(
      VARIANTS[variant],
      SIZES[size],
      fullWidth && 'w-full',
      (disabled || isLoading) && 'opacity-60 cursor-not-allowed pointer-events-none',
      className
    )}
    {...rest}
  >
    {isLoading && (
      <svg
        className="animate-spin h-4 w-4 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    )}
    {children}
  </button>
);

export default Button;
