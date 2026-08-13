/**
 * pages/Home/PlatformFeatures.jsx — Platform capabilities grid.
 */

import { PLATFORM_FEATURES } from '../../constants';
import SectionHeading from '../../components/ui/SectionHeading';
import Section from '../../components/layout/Section';
import Container from '../../components/layout/Container';

const PlatformFeatures = () => (
  <Section className="bg-white">
    <Container>
      <SectionHeading
        eyebrow="Boilerplate Modules"
        title="Prepared areas for teammate feature work"
        subtitle="The current UI defines product boundaries without shipping unfinished business logic. Teams can connect APIs and state management module by module."
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PLATFORM_FEATURES.map(feature => (
          <article key={feature.title} className="surface-card p-6">
            <h3 className="text-base font-semibold text-slate-950">{feature.title}</h3>
            <p className="mt-3 text-sm leading-6 text-steel-600">{feature.description}</p>
          </article>
        ))}
      </div>
    </Container>
  </Section>
);

export default PlatformFeatures;
