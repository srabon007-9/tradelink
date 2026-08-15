/**
 * pages/Settings/index.jsx — Account Settings
 */

import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import useAuth from '../../hooks/useAuth';

const Settings = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="eyebrow mb-2">Account Preference</span>
          <h1 className="text-3xl font-semibold text-slate-950">Settings</h1>
          <p className="mt-2 text-sm text-steel-600">
            Manage your account preferences and notification settings.
          </p>
        </div>
        <Badge color="green">Active</Badge>
      </div>

      <Card className="p-6 space-y-6">
        <div>
          <h3 className="text-base font-semibold text-slate-950">Email Notifications</h3>
          <p className="mt-1 text-sm text-steel-600">
            Automated notifications for credit purchases, earnings, and spent credits are active for <span className="font-medium text-slate-900">{user?.email}</span>.
          </p>
        </div>

        <div className="border-t border-concrete-200 pt-6">
          <h3 className="text-base font-semibold text-slate-950">Account Security</h3>
          <p className="mt-1 text-sm text-steel-600">
            Password & JWT authentication managed securely.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
