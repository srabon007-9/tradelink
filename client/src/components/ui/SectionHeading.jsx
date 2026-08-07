/**
 * components/ui/SectionHeading.jsx — Reusable Section Title Block
 */

import { cn } from '../../utils/cn';

/**
 * @param {{
 *   eyebrow?: string   — small label above the title
 *   title: string
 *   subtitle?: string
 *   centered?: boolean
 *   className?: string
 * }} props
 */
const SectionHeading = ({
  eyebrow,
  title,
  subtitle,
  centered = true,
  className = '',
}) => {
  return (
    <div className={cn(centered && 'text-center', 'mb-10', className)}>
      {eyebrow && (
        <span className="eyebrow mb-3">
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl sm:text-3xl font-semibold text-slate-950 mb-3">
        {title}
      </h2>
      {subtitle && (
        <p className={cn('text-steel-600 text-base leading-relaxed', centered ? 'max-w-2xl mx-auto' : 'max-w-3xl')}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionHeading;
