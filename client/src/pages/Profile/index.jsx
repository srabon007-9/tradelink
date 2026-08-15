/**
 * pages/Profile/index.jsx — My Profile & Profile Edit
 *
 * Displays the logged-in member's profile and provides an interactive form
 * to update name, bio, company, phone, and avatar. Profile updates are
 * persisted to MongoDB and synced immediately across the app state.
 */

import { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
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
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    company: user?.company || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  if (!user) {
    return (
      <div className="flex justify-center py-16 text-sm text-steel-600">
        Loading your profile…
      </div>
    );
  }

  const handleStartEdit = () => {
    setForm({
      name: user.name || '',
      bio: user.bio || '',
      company: user.company || '',
      phone: user.phone || '',
      avatar: user.avatar || '',
    });
    setStatusMessage({ type: '', text: '' });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setStatusMessage({ type: '', text: '' });
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });

    if (!form.name.trim()) {
      setStatusMessage({ type: 'error', text: 'Full Name is required.' });
      addToast('Full Name is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await updateProfile({
        name: form.name.trim(),
        bio: form.bio.trim(),
        company: form.company.trim(),
        phone: form.phone.trim(),
        avatar: form.avatar.trim(),
      });

      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
        addToast('Profile updated successfully!', 'success');
        setIsEditing(false);
      } else {
        const msg = res.message || 'Failed to update profile.';
        setStatusMessage({ type: 'error', text: msg });
        addToast(msg, 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'An error occurred while updating profile.';
      setStatusMessage({
        type: 'error',
        text: msg,
      });
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="eyebrow mb-2">My Profile</span>
          <h1 className="text-3xl font-semibold text-slate-950">Your Details</h1>
          <p className="mt-1 text-sm text-steel-600">
            View and manage your TradeLink student profile details.
          </p>
        </div>

        {!isEditing && (
          <Button size="sm" variant="outline" onClick={handleStartEdit}>
            ✏️ Edit Profile
          </Button>
        )}
      </div>

      {/* ── Status Banner ─────────────────────────────────────────────── */}
      {statusMessage.text && (
        <div
          className={`rounded-md p-4 text-sm border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* ── Profile Card ──────────────────────────────────────────────── */}
      <Card className="p-6">
        {/* Header Avatar & Basic Info */}
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

        {/* ── EDIT MODE FORM ────────────────────────────────────────── */}
        {isEditing ? (
          <form className="mt-6 border-t border-concrete-200 pt-6 space-y-4" onSubmit={handleSubmit}>
            <h3 className="text-base font-semibold text-slate-950">Edit Profile Details</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium text-steel-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="profile-name"
                  name="name"
                  type="text"
                  className="input-base"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="profile-email" className="mb-1.5 block text-sm font-medium text-steel-700">
                  Email Address <span className="text-xs text-steel-400">(Read-only)</span>
                </label>
                <input
                  id="profile-email"
                  type="email"
                  className="input-base bg-concrete-100 cursor-not-allowed"
                  value={user.email}
                  disabled
                />
              </div>

              <div>
                <label htmlFor="profile-company" className="mb-1.5 block text-sm font-medium text-steel-700">
                  Company / Organization
                </label>
                <input
                  id="profile-company"
                  name="company"
                  type="text"
                  placeholder="e.g. University of Dhaka"
                  className="input-base"
                  value={form.company}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="profile-phone" className="mb-1.5 block text-sm font-medium text-steel-700">
                  Phone Number
                </label>
                <input
                  id="profile-phone"
                  name="phone"
                  type="text"
                  placeholder="e.g. +880 1700 000000"
                  className="input-base"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile-avatar" className="mb-1.5 block text-sm font-medium text-steel-700">
                Avatar Image URL <span className="text-xs text-steel-400">(Optional)</span>
              </label>
              <input
                id="profile-avatar"
                name="avatar"
                type="text"
                placeholder="https://example.com/avatar.jpg"
                className="input-base"
                value={form.avatar}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="profile-bio" className="mb-1.5 block text-sm font-medium text-steel-700">
                Bio / About Yourself
              </label>
              <textarea
                id="profile-bio"
                name="bio"
                rows={3}
                placeholder="Tell other students about your background and skills..."
                className="input-base"
                value={form.bio}
                onChange={handleChange}
                maxLength={500}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving Changes…' : 'Save Changes'}
              </Button>
              <Button type="button" variant="ghost" disabled={submitting} onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          /* ── VIEW MODE DETAILS ──────────────────────────────────────── */
          <>
            <div className="mt-6 grid grid-cols-1 gap-6 border-t border-concrete-200 pt-6 sm:grid-cols-2">
              <Field label="Full Name" value={user.name} />
              <Field label="Email Address" value={user.email} />
              <Field label="Company / Institution" value={user.company} />
              <Field label="Phone Number" value={user.phone} />
              <Field label="Role" value={user.role} />
              <Field label="Member Since" value={user.createdAt ? formatDate(user.createdAt) : null} />
            </div>

            <div className="mt-6 border-t border-concrete-200 pt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-steel-500">Bio</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-950">
                {user.bio || <span className="text-steel-400">No bio added yet. Click "Edit Profile" above to add one.</span>}
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default Profile;
