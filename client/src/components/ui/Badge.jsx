/**
 * components/ui/Badge.jsx — Pill Badge
 */

import { cn } from '../../utils/cn';

const COLORS = {
  primary: 'bg-navy-50 text-navy-800 border border-navy-100',
  accent: 'bg-accent-50 text-accent-800 border border-accent-100',
  green: 'bg-emerald-50 text-emerald-800 border border-emerald-100',
  yellow: 'bg-amber-50 text-amber-800 border border-amber-100',
  red: 'bg-red-50 text-red-800 border border-red-100',
  gray: 'bg-concrete-50 text-steel-700 border border-concrete-200',
};

/**
 * @param {{
 *   color?: keyof typeof COLORS
 *   className?: string
 *   children: React.ReactNode
 * }} props
 */
const Badge = ({ color = 'primary', className = '', children }) => (
  <span className={cn('badge', COLORS[color], className)}>
    {children}
  </span>
);

export default Badge;
