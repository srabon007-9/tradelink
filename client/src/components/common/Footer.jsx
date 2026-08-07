/**
 * components/common/Footer.jsx — Site footer.
 */

import { Link } from 'react-router-dom';
import Logo from './Logo';
import { BRAND, ROUTES } from '../../constants';

const FOOTER_LINKS = {
  Platform: [
    { label: 'Browse Skills', to: ROUTES.BROWSE },
    { label: 'How It Works', to: '/#process' },
    { label: 'About TradeLink', to: ROUTES.ABOUT },
    { label: 'Contact', to: ROUTES.CONTACT },
  ],
  Members: [
    { label: 'Member Login', to: ROUTES.LOGIN },
    { label: 'Create Account', to: ROUTES.REGISTER },
    { label: 'Member Dashboard', to: ROUTES.DASHBOARD },
  ],
};

const Footer = () => (
  <footer className="border-t border-concrete-200 bg-white">
    <div className="container-xl py-12">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-md text-sm leading-6 text-steel-600">
            TradeLink is a boilerplate skill exchange where members can publish services,
            discover collaborators, and build project workflows on top of a shared foundation.
          </p>
          <div className="mt-5 grid gap-1 text-sm text-steel-700">
            <span>{BRAND.location}</span>
            <a href={`mailto:${BRAND.email}`} className="hover:text-navy-900">{BRAND.email}</a>
            <a href={`tel:${BRAND.phone.replaceAll(' ', '')}`} className="hover:text-navy-900">{BRAND.phone}</a>
          </div>
        </div>

        {Object.entries(FOOTER_LINKS).map(([group, links]) => (
          <div key={group}>
            <h3 className="text-sm font-semibold text-slate-950">{group}</h3>
            <ul className="mt-4 space-y-2" role="list">
              {links.map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-steel-600 hover:text-navy-900">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-3 border-t border-concrete-200 pt-6 text-sm text-steel-600 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.</p>
        <p>Member skills and collaboration portal.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
