/**
 * pages/Home/HowItWorks.jsx — Member workflow section.
 */

import { SERVICE_LINES } from '../../constants';
import SectionHeading from '../../components/ui/SectionHeading';
import Section from '../../components/layout/Section';
import Container from '../../components/layout/Container';

const HowItWorks = () => (
  <Section id="process" className="bg-page">
    <Container>
      <SectionHeading
        eyebrow="How It Works"
        title="A simple flow for member collaboration"
        subtitle="This section documents the intended product rhythm while deeper member, request, messaging, and review features are still pending."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {SERVICE_LINES.map(step => (
          <article key={step.code} className="surface-card p-6">
            <span className="text-sm font-semibold text-accent-700">{step.code}</span>
            <h3 className="mt-4 text-lg font-semibold text-slate-950">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-steel-600">{step.description}</p>
          </article>
        ))}
      </div>
    </Container>
  </Section>
);

export default HowItWorks;
