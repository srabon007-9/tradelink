/**
 * components/layout/PageHeader.jsx — Inner Page Header
 *
 * Used on non-home pages (Browse, About, Contact, etc.)
 * to provide a consistent hero-like top section.
 */

import { cn } from '../../utils/cn';

/**
 * @param {{
 *   title: string
 *   subtitle?: string
 *   eyebrow?: string
 *   className?: string
 *   children?: React.ReactNode
 * }} props
 */
const PageHeader = ({ title, subtitle, eyebrow, className = '', children }) => (
  <div className={cn('border-b border-concrete-200 bg-white pt-28 pb-12', className)}>
    <div className="container-xl">
      {eyebrow && (
        <span className="eyebrow mb-3">
          {eyebrow}
        </span>
      )}
      <h1 className="text-3xl sm:text-4xl font-semibold text-slate-950 mb-3">
        {title}
      </h1>
      {subtitle && (
        <p className="text-steel-600 text-base max-w-3xl leading-relaxed">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  </div>
);

export default PageHeader;
