/**
 * components/layout/Container.jsx — Max-Width Content Container
 */

import { cn } from '../../utils/cn';

const Container = ({ className = '', children, ...rest }) => (
  <div className={cn('container-xl', className)} {...rest}>
    {children}
  </div>
);

export default Container;
