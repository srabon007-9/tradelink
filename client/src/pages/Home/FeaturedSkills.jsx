/**
 * pages/Home/FeaturedSkills.jsx — Featured skill listing grid.
 */

import { Link } from 'react-router-dom';
import { SKILL_LISTINGS, ROUTES } from '../../constants';
import SectionHeading from '../../components/ui/SectionHeading';
import Section from '../../components/layout/Section';
import Container from '../../components/layout/Container';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';

const SkillCard = ({ listing }) => (
  <article className="surface-card flex flex-col p-5">
    <div className="flex items-start justify-between gap-4">
      <Badge color="gray">{listing.category}</Badge>
      <span className="text-sm font-semibold text-navy-900">{listing.rate}</span>
    </div>

    <h3 className="mt-4 text-lg font-semibold leading-snug text-slate-950">{listing.title}</h3>
    <p className="mt-1 text-sm text-steel-600">{listing.location}</p>

    <div className="mt-5 flex items-center gap-3">
      <Avatar initials={listing.initials} size="sm" />
      <div>
        <p className="text-sm font-semibold text-slate-900">{listing.member}</p>
        <p className="text-xs text-steel-600">{listing.availability}</p>
      </div>
    </div>

    <div className="mt-5">
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-steel-600">Profile match</span>
        <span className="font-semibold text-slate-950">{listing.match}%</span>
      </div>
      <div className="h-2 rounded bg-concrete-100">
        <div className="h-2 rounded bg-accent-600" style={{ width: `${listing.match}%` }} />
      </div>
    </div>

    <div className="mt-5 flex flex-wrap gap-2">
      {listing.tags.map(tag => (
        <span key={tag} className="rounded border border-concrete-200 bg-concrete-50 px-2 py-1 text-xs text-steel-700">
          {tag}
        </span>
      ))}
    </div>
  </article>
);

const FeaturedSkills = () => (
  <Section className="bg-white">
    <Container>
      <SectionHeading
        eyebrow="Featured Skills"
        title="Sample listings for the directory"
        subtitle="These static cards define the expected shape for future member profile, search, rate, availability, and matching features."
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SKILL_LISTINGS.slice(0, 3).map(listing => (
          <SkillCard key={listing.id} listing={listing} />
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link id="featured-skills-browse-all" to={ROUTES.BROWSE} className="btn-ghost">
          View All Skills
        </Link>
      </div>
    </Container>
  </Section>
);

export default FeaturedSkills;
