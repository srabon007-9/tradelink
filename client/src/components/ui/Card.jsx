/**
 * components/ui/Card.jsx — Reusable surface container
 */

import { cn } from '../../utils/cn';

/**
 * @param {{
 *   hover?: boolean
 *   muted?: boolean
 *   className?: string
 *   children: React.ReactNode
 * } & React.HTMLAttributes<HTMLDivElement>} props
 */
const Card = ({ hover = false, muted = false, className = '', children, ...rest }) => (
  <div
    className={cn(
      muted ? 'surface-panel bg-concrete-50' : 'surface-card',
      hover && 'hover:border-concrete-300 hover:shadow-card cursor-pointer',
      'transition-colors duration-150',
      className
    )}
    {...rest}
  >
    {children}
  </div>
);

export default Card;
