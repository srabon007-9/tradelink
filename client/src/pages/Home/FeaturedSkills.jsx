/**
 * pages/Home/FeaturedSkills.jsx — Featured members from the database.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import SectionHeading from '../../components/ui/SectionHeading';
import Section from '../../components/layout/Section';
import Container from '../../components/layout/Container';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';

const MemberCard = ({ user }) => {
  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <article className="surface-card flex flex-col p-5">
      <div className="flex items-start justify-between gap-4">
        <Badge color="gray">{user.role || 'Member'}</Badge>
      </div>

      <h3 className="mt-4 text-lg font-semibold leading-snug text-slate-950">{user.name}</h3>
      <p className="mt-1 text-sm text-steel-600">{user.company || 'TradeLink Member'}</p>

      {user.bio && (
        <p className="mt-2 text-sm text-steel-600 line-clamp-2">{user.bio}</p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <Avatar initials={initials} size="sm" />
        <div>
          <p className="text-sm font-semibold text-slate-900">{user.name}</p>
          <p className="text-xs text-steel-600">{user.email}</p>
        </div>
      </div>
    </article>
  );
};

const FeaturedSkills = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users')
      .then(res => setMembers(res.data.data.slice(0, 3)))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Section className="bg-white">
      <Container>
        <SectionHeading
          eyebrow="Members"
          title="Registered members"
          subtitle="These are real members who have joined the platform."
        />

        {loading ? (
          <div className="flex justify-center py-12 text-sm text-steel-600">Loading members…</div>
        ) : members.length === 0 ? (
          <div className="rounded-lg border border-concrete-200 bg-concrete-50 py-14 text-center">
            <p className="text-base font-semibold text-slate-950">No members yet</p>
            <p className="mt-2 text-sm text-steel-600">Be the first to register and appear here.</p>
            <Link to={ROUTES.REGISTER} className="btn-primary mt-6 inline-flex">Create Account</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {members.map(user => (
              <MemberCard key={user._id} user={user} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link id="featured-skills-browse-all" to={ROUTES.BROWSE} className="btn-ghost">
            View All Members
          </Link>
        </div>
      </Container>
    </Section>
  );
};

export default FeaturedSkills;
