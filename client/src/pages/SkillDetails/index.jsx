/**
 * pages/SkillDetails/index.jsx — Skill listing details page.
 */

import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import { ROUTES } from '../../constants';
import { skillService } from '../../services/skill.service';

const formatCurrency = value =>
  new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDate = value =>
  value
    ? new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value))
    : 'Not available';

const statusColor = status => {
  if (status === 'active') {
    return 'green';
  }
  if (status === 'paused') {
    return 'yellow';
  }
  return 'gray';
};

const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-steel-600">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-950">{value || 'Not provided'}</p>
  </div>
);

const SkillDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const [skill, setSkill] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    skillService
      .getById(id)
      .then(setSkill)
      .catch(apiError => setError(apiError.response?.data?.message || 'Unable to load skill listing.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <div className="surface-card p-8 text-sm font-medium text-steel-600">Loading skill listing...</div>;
  }

  if (!skill) {
    return <div className="surface-card p-8 text-sm font-medium text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link to={ROUTES.MY_SKILLS} className="text-sm font-semibold text-steel-600 hover:text-navy-900">Back to My Skills</Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold text-slate-950">{skill.title}</h1>
            <Badge color={statusColor(skill.status)}>{skill.status}</Badge>
          </div>
        </div>
        <Link to={`${ROUTES.MY_SKILLS}/${skill._id}/edit`} className="btn-primary">
          Edit Skill
        </Link>
      </div>

      {location.state?.notice && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {location.state.notice}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="surface-card overflow-hidden">
          {skill.thumbnail && (
            <img src={skill.thumbnail} alt="" className="h-64 w-full object-cover" />
          )}
          <div className="p-5 sm:p-6">
            <Badge color="gray">{skill.category}</Badge>
            <p className="mt-5 whitespace-pre-line text-sm leading-7 text-steel-700">{skill.description}</p>
            {skill.tags?.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {skill.tags.map(tag => (
                  <span key={tag} className="badge border border-concrete-200 bg-concrete-50 text-steel-700">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </article>

        <aside className="space-y-6">
          <section className="surface-card p-5">
            <h2 className="text-base font-semibold text-slate-950">Listing Details</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
              <DetailItem label="Base Rate" value={formatCurrency(skill.baseRate)} />
              <DetailItem label="Experience" value={skill.experienceLevel} />
              <DetailItem label="Estimated Duration" value={skill.estimatedDuration} />
              <DetailItem label="Owner" value={skill.owner} />
              <DetailItem label="Created Date" value={formatDate(skill.createdAt)} />
              <DetailItem label="Status" value={skill.status} />
            </div>
          </section>

          <section className="surface-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-700">Current Live Credit</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">Pending</p>
            <p className="mt-2 text-sm leading-6 text-steel-600">
              Will be calculated by the Dynamic Valuation Engine.
            </p>
          </section>
        </aside>
      </section>
    </div>
  );
};

export default SkillDetails;
