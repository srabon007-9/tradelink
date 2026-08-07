/**
 * pages/Home/CallToAction.jsx — Bottom member callout.
 */

import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import Section from '../../components/layout/Section';
import Container from '../../components/layout/Container';

const CallToAction = () => (
  <Section className="bg-page">
    <Container>
      <div className="surface-card grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <span className="eyebrow mb-3">Build The Next Module</span>
          <h2 className="text-2xl font-semibold text-slate-950">Ready for member features to be connected?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-steel-600">
            The public pages, member forms, browse directory, and dashboard shell are in place.
            Feature owners can now wire real auth, profiles, requests, messages, and reviews.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Link id="cta-register-btn" to={ROUTES.REGISTER} className="btn-primary">
            Create Account
          </Link>
          <Link id="cta-browse-btn" to={ROUTES.CONTACT} className="btn-ghost">
            Contact Team
          </Link>
        </div>
      </div>
    </Container>
  </Section>
);

export default CallToAction;
