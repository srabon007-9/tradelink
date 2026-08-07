/**
 * components/layout/Section.jsx — Section Wrapper
 */

import { cn } from '../../utils/cn';

const Section = ({ id, className = '', children, ...rest }) => (
  <section id={id} className={cn('section', className)} {...rest}>
    {children}
  </section>
);

export default Section;
