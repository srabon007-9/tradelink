/**
 * pages/BrowseSkills/index.jsx — Public skill directory scaffold.
 *
 * Feature owners can connect these controls to search, filters, member profiles,
 * proposal requests, and backend data when those modules are ready.
 */

import { SKILL_CATEGORIES, SKILL_LISTINGS } from '../../constants';
import PageHeader from '../../components/layout/PageHeader';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';

const BrowseSkills = () => (
  <div>
    <PageHeader
      eyebrow="Skill Directory"
      title="Browse member skills"
      subtitle="A starter directory for member services, availability, categories, and collaboration signals. The data is static for now so each teammate can implement their feature independently."
    />

    <div className="container-xl py-12">
      <div className="surface-card mb-8 grid gap-3 p-4 lg:grid-cols-[1fr_220px_220px]">
        <input
          id="browse-search"
          type="search"
          placeholder="Search by skill, member, location, or tag"
          className="input-base"
        />
        <select id="browse-category-filter" className="input-base cursor-pointer" defaultValue="">
          <option value="">All categories</option>
          {SKILL_CATEGORIES.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <select id="browse-sort-filter" className="input-base cursor-pointer" defaultValue="match">
          <option value="match">Best Match</option>
          <option value="availability">Availability</option>
          <option value="rate-low">Rate: Low to High</option>
          <option value="rate-high">Rate: High to Low</option>
        </select>
      </div>

      <div className="mb-6 flex flex-wrap gap-2" role="list" aria-label="Skill category filters">
        <button className="badge bg-navy-50 text-navy-900 border border-navy-100">All</button>
        {SKILL_CATEGORIES.map(category => (
          <button key={category} id={`category-chip-${category.toLowerCase().replace(/\W+/g, '-')}`} className="badge bg-white text-steel-700 border border-concrete-200 hover:bg-concrete-50">
            {category}
          </button>
        ))}
      </div>

      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-steel-600">
          Showing <span className="font-semibold text-slate-950">{SKILL_LISTINGS.length}</span> sample member listings
        </p>
      </div>

      <div className="table-shell">
        <div className="hidden grid-cols-[1.5fr_1fr_1fr_0.8fr_0.8fr] gap-4 border-b border-concrete-200 bg-concrete-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-steel-600 md:grid">
          <span>Skill</span>
          <span>Member</span>
          <span>Location</span>
          <span>Rate</span>
          <span>Match</span>
        </div>

        <div className="divide-y divide-concrete-200">
          {SKILL_LISTINGS.map(listing => (
            <article key={listing.id} id={`skill-card-${listing.id}`} className="grid gap-4 px-5 py-5 md:grid-cols-[1.5fr_1fr_1fr_0.8fr_0.8fr] md:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <Badge color="gray">{listing.category}</Badge>
                  <Badge color={listing.availability === 'Available' ? 'green' : listing.availability === 'Limited' ? 'yellow' : 'accent'}>
                    {listing.availability}
                  </Badge>
                </div>
                <h2 className="mt-3 text-base font-semibold text-slate-950">{listing.title}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {listing.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs text-steel-600">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Avatar initials={listing.initials} size="sm" />
                <span className="text-sm font-medium text-slate-900">{listing.member}</span>
              </div>
              <span className="text-sm text-steel-700">{listing.location}</span>
              <span className="text-sm font-semibold text-slate-950">{listing.rate}</span>
              <div>
                <div className="mb-1 flex justify-between text-xs text-steel-600">
                  <span>Fit</span>
                  <span>{listing.match}%</span>
                </div>
                <div className="h-2 rounded bg-concrete-100">
                  <div className="h-2 rounded bg-navy-800" style={{ width: `${listing.match}%` }} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default BrowseSkills;
