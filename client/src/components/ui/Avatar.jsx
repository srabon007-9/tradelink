/**
 * components/ui/Avatar.jsx — User Avatar Component
 *
 * Shows an image if provided, otherwise renders initials.
 */

import { cn } from '../../utils/cn';

const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

/**
 * @param {{
 *   initials?: string
 *   src?: string
 *   alt?: string
 *   size?: 'sm'|'md'|'lg'|'xl'
 *   className?: string
 * }} props
 */
const Avatar = ({ initials = '?', src, alt = 'User avatar', size = 'md', className = '' }) => (
  <div
    className={cn(
      'rounded-md flex-shrink-0 flex items-center justify-center font-semibold text-navy-900 overflow-hidden',
      'bg-concrete-100 border border-concrete-200',
      SIZES[size],
      className
    )}
    aria-label={alt}
  >
    {src ? (
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    ) : (
      <span>{initials}</span>
    )}
  </div>
);

export default Avatar;
