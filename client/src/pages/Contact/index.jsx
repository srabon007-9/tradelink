/**
 * pages/Contact/index.jsx — Contact page.
 */

import PageHeader from '../../components/layout/PageHeader';
import Container from '../../components/layout/Container';
import Section from '../../components/layout/Section';
import Button from '../../components/ui/Button';
import { BRAND } from '../../constants';

const CONTACT_INFO = [
  { label: 'Email', value: BRAND.email },
  { label: 'Phone', value: BRAND.phone },
  { label: 'Office', value: BRAND.location },
  { label: 'Hours', value: 'Sunday to Thursday, 9:00 AM to 6:00 PM' },
];

const Contact = () => (
  <div>
    <PageHeader
      eyebrow="Contact"
      title="Contact the TradeLink team"
      subtitle="Use this placeholder contact page for member support, feature questions, partnership notes, or assignment handoff details."
    />

    <Section>
      <Container>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="surface-card p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-slate-950">General Message</h2>

            <form className="mt-6 space-y-5" aria-label="Contact form">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-steel-700">Name</label>
                  <input id="contact-name" type="text" placeholder="Your name" className="input-base" />
                </div>
                <div>
                  <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-steel-700">Email</label>
                  <input id="contact-email" type="email" placeholder="name@company.com" className="input-base" />
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className="mb-1.5 block text-sm font-medium text-steel-700">Subject</label>
                <input id="contact-subject" type="text" placeholder="Account setup, feature question, collaboration support..." className="input-base" />
              </div>

              <div>
                <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-steel-700">Message</label>
                <textarea
                  id="contact-message"
                  rows={6}
                  placeholder="Write a short note for the TradeLink team."
                  className="input-base resize-none"
                />
              </div>

              <Button id="contact-submit-btn" type="submit">
                Send Message
              </Button>
            </form>
          </div>

          <aside className="space-y-5">
            <div className="surface-card p-6">
              <h2 className="text-lg font-semibold text-slate-950">Support Desk</h2>
              <div className="mt-5 space-y-4">
                {CONTACT_INFO.map(info => (
                  <div key={info.label}>
                    <div className="text-xs font-semibold uppercase tracking-wide text-steel-600">{info.label}</div>
                    <div className="mt-1 text-sm font-medium text-slate-950">{info.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-card p-6">
              <h3 className="text-lg font-semibold text-slate-950">Feature Handoff Notes</h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-steel-700">
                <li>Connect this form to backend validation and email or ticket creation.</li>
                <li>Add success and error states when the API endpoint is ready.</li>
                <li>Decide whether member support should live in contact, dashboard, or both.</li>
              </ul>
            </div>
          </aside>
        </div>
      </Container>
    </Section>
  </div>
);

export default Contact;
