/**
 * pages/About/index.jsx — Platform overview page.
 */

import PageHeader from '../../components/layout/PageHeader';
import Container from '../../components/layout/Container';
import Section from '../../components/layout/Section';

const PRINCIPLES = [
  { title: 'Clear Member Data', desc: 'Profiles, skills, rates, availability, portfolio links, and contact preferences should have predictable places to live.' },
  { title: 'Small Feature Boundaries', desc: 'Browse, profile, requests, messages, reviews, and dashboard routes can be implemented without stepping on each other.' },
  { title: 'Honest Boilerplate', desc: 'The UI shows intended workflows while keeping unfinished behavior as placeholders for future implementation.' },
];

const About = () => (
  <div>
    <PageHeader
      eyebrow="About"
      title="Built as a member skill exchange foundation"
      subtitle="TradeLink is not a construction company site. It is a shared scaffold for a skill marketplace where members can list services, find collaborators, and manage work."
    />

    <Section>
      <Container>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {PRINCIPLES.map(point => (
            <article key={point.title} className="surface-card p-6">
              <h2 className="text-lg font-semibold text-slate-950">{point.title}</h2>
              <p className="mt-3 text-sm leading-6 text-steel-600">{point.desc}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="surface-card p-6">
            <h2 className="text-lg font-semibold text-slate-950">Scaffold Coverage</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-steel-700">Base location</dt>
                <dd className="mt-1 text-steel-600">Dhaka, Bangladesh</dd>
              </div>
              <div>
                <dt className="font-semibold text-steel-700">Core modules</dt>
                <dd className="mt-1 text-steel-600">Member profiles, skill directory, collaboration requests, messages, reviews, and dashboard placeholders.</dd>
              </div>
              <div>
                <dt className="font-semibold text-steel-700">Implementation status</dt>
                <dd className="mt-1 text-steel-600">Static frontend scaffold with clear route and data naming for future API work.</dd>
              </div>
            </dl>
          </aside>

          <article className="surface-card p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-slate-950">How the app is organized</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-steel-700">
              <p>
                The app separates public pages from the member dashboard. Public pages introduce the
                platform, show a sample skill directory, and provide login, registration, and contact
                forms that can later connect to backend services.
              </p>
              <p>
                The dashboard is intentionally lightweight. It gives future owners a place to add
                profile editing, skill management, request tracking, messaging, reviews, and settings
                without having to redesign the shell.
              </p>
              <p>
                Backend business endpoints are still pending. The current repository is best treated
                as a naming, layout, and data-shape foundation for the team.
              </p>
            </div>
          </article>
        </div>
      </Container>
    </Section>
  </div>
);

export default About;
