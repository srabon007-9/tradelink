import { Link } from 'react-router-dom';
import { BRAND } from '../../constants';

const Logo = ({ className = '' }) => (
  <Link to="/" className={`flex items-center gap-3 ${className}`} aria-label={`${BRAND.name} home`}>
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-navy-700 bg-navy-800 text-xs font-bold tracking-wide text-white">
      TL
    </div>
    <span className="leading-tight">
      <span className="block text-sm font-bold tracking-wide text-slate-950">{BRAND.shortName}</span>
      <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-steel-600">Skill Exchange</span>
    </span>
  </Link>
);

export default Logo;
