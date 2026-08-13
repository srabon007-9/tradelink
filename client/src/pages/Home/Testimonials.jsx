/**
 * pages/Home/Testimonials.jsx — Team notes.
 */

import { TESTIMONIALS } from '../../constants';
import SectionHeading from '../../components/ui/SectionHeading';
import Section from '../../components/layout/Section';
import Container from '../../components/layout/Container';
import Avatar from '../../components/ui/Avatar';

const Testimonials = () => (
  <Section className="bg-page">
    <Container>
      <SectionHeading
        eyebrow="Team Handoff"
        title="Clear placeholders for each feature owner"
        subtitle="These sample notes keep expectations honest: the foundation is ready, and the actual product features still need to be implemented."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {TESTIMONIALS.map(testimonial => (
          <blockquote key={testimonial.id} className="surface-card flex flex-col gap-5 p-6">
            <p className="flex-1 text-sm leading-6 text-steel-700">&ldquo;{testimonial.content}&rdquo;</p>
            <footer className="flex items-center gap-3 border-t border-concrete-200 pt-4">
              <Avatar initials={testimonial.initials} size="sm" />
              <div>
                <div className="text-sm font-semibold text-slate-950">{testimonial.name}</div>
                <div className="text-xs text-steel-600">{testimonial.role}</div>
              </div>
            </footer>
          </blockquote>
        ))}
      </div>
    </Container>
  </Section>
);

export default Testimonials;
