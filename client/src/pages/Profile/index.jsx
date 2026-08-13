/**
 * pages/Profile/index.jsx — My Profile
 *
 * Shows the logged-in member's own account details. Uses the user object
 * already held in AuthContext (populated at login/register) — no extra
 * API call needed since the server already returns the full public
 * profile shape on auth.
 */

import useAuth from '../../hooks/useAuth';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { getInitials, formatDate } from '../../utils/formatters';

const ROLE_COLORS = {
  admin: 'accent',
  operations: 'primary',
  client: 'gray',
};

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-steel-500">{label}</p>
    <p className="mt-1 text-sm text-slate-950">{value || <span className="text-steel-400">Not set</span>}</p>
  </div>
);

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex justify-center py-16 text-sm text-steel-600">
        Loading your profile…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow mb-2">My Profile</span>
        <h1 className="text-3xl font-semibold text-slate-950">Your Details</h1>
        <p className="mt-2 text-sm text-steel-600">Your account information as registered on TradeLink.</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar initials={getInitials(user.name)} src={user.avatar || undefined} size="xl" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-950">{user.name}</h2>
              <Badge color={ROLE_COLORS[user.role] || 'gray'}>{user.role}</Badge>
              <Badge color={user.isVerified ? 'green' : 'yellow'}>
                {user.isVerified ? 'Verified' : 'Not Verified'}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-steel-600">{user.email}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 border-t border-concrete-200 pt-6 sm:grid-cols-2">
          <Field label="Full Name" value={user.name} />
          <Field label="Email Address" value={user.email} />
          <Field label="Company" value={user.company} />
          <Field label="Phone" value={user.phone} />
          <Field label="Role" value={user.role} />
          <Field label="Member Since" value={user.createdAt ? formatDate(user.createdAt) : null} />
        </div>

        <div className="mt-6 border-t border-concrete-200 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-steel-500">Bio</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-950">
            {user.bio || <span className="text-steel-400">No bio added yet.</span>}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
