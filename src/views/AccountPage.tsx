import React, { useState, useEffect } from 'react';
import {
  FlagSkoolConfig,
  Page,
  UserProfile,
  Enrollment,
  LoadState,
  koboToNaira,
} from '@/types/index';
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getEnrollments,
} from '@/lib/data-access';
import { StudentNav } from '@/components/StudentNav';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  User,
  Mail,
  ShieldCheck,
  KeyRound,
  Camera,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Receipt,
  LogOut,
  AlertCircle,
  Sun,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export interface AccountPageProps {
  config: FlagSkoolConfig;
  onNavigate?: (page: Page) => void;
  onLogout?: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  config,
  onNavigate,
  onLogout,
}) => {
  const [userState, setUserState] = useState<LoadState<UserProfile>>({
    status: 'loading',
  });
  const [enrollmentsState, setEnrollmentsState] = useState<
    LoadState<Enrollment[]>
  >({ status: 'loading' });

  // Form states
  const [fullName, setFullName] = useState<string>('');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState<string>('');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    setUserState({ status: 'loading' });
    setEnrollmentsState({ status: 'loading' });

    Promise.all([getUserProfile(), getEnrollments()])
      .then(([profile, enrollments]) => {
        if (!isMounted) return;
        setUserState({ status: 'success', data: profile });
        setFullName(profile.fullName);
        setEnrollmentsState({ status: 'success', data: enrollments });
      })
      .catch((err) => {
        if (!isMounted) return;
        setUserState({ status: 'error', error: err?.message || 'Failed to load profile' });
        setEnrollmentsState({ status: 'error', error: 'Failed to load enrollments' });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Save Profile Name
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || isSavingProfile) return;

    setIsSavingProfile(true);
    setProfileSuccessMessage('');
    try {
      const updated = await updateUserProfile({ fullName: fullName.trim() });
      setUserState({ status: 'success', data: updated });
      setProfileSuccessMessage('Profile name updated successfully.');
      setTimeout(() => setProfileSuccessMessage(''), 4000);
    } catch {
      // Error handled
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccessMessage('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccessMessage('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccessMessage(''), 4000);
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-deep text-body-text flex flex-col justify-between">
      <div>
        {/* Student Top Navigation */}
        <StudentNav
          config={config}
          currentPage="account"
          user={userState.status === 'success' ? userState.data : undefined}
          onNavigate={(page) => onNavigate && onNavigate(page)}
          onLogout={onLogout}
        />

        {/* Account Page Canvas */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
          
          {/* Header */}
          <div className="space-y-1">
            <h1 className="font-display font-black text-2xl sm:text-3xl text-paper-soft">
              Account Settings
            </h1>
            <p className="text-sm text-muted-text">
              Manage your personal student credentials, enrollment access, and security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* LEFT 2 COLUMNS: PROFILE & PASSWORD */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Profile Card */}
              <Card className="p-6 bg-ink-raised border border-ink-border space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-ink-border">
                  <h2 className="font-display font-bold text-lg text-paper-soft flex items-center gap-2">
                    <User className="w-5 h-5 text-flag-red" />
                    <span>Personal Profile</span>
                  </h2>
                  <span className="text-xs font-mono text-muted-text">
                    {userState.status === 'success'
                      ? `ID: ${userState.data.id.slice(0, 8)}`
                      : null}
                  </span>
                </div>

                {userState.status === 'loading' ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Skeleton circle height={64} width={64} />
                      <div className="space-y-2">
                        <Skeleton height={20} width={180} />
                        <Skeleton height={14} width={120} />
                      </div>
                    </div>
                    <Skeleton height={48} width="100%" />
                  </div>
                ) : userState.status === 'success' ? (
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    {/* Avatar Upload Placeholder */}
                    <div className="flex items-center gap-4">
                      <div className="relative group">
                        <div className="w-16 h-16 rounded-full bg-flag-red text-paper-soft flex items-center justify-center font-display font-bold text-xl ring-2 ring-ink-border">
                          {userState.data.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        {/* // TODO(handoff): avatar upload S3 / Bunny Storage */}
                        <div
                          className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-paper-soft"
                          title="Change profile avatar placeholder"
                        >
                          <Camera className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-paper-soft">
                          {userState.data.fullName}
                        </h3>
                        <p className="text-xs font-mono text-muted-text">
                          Joined {userState.data.joinedDate}
                        </p>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-mono uppercase text-muted-text">
                          Full Name
                        </label>
                        <input
                          id="account-fullname-input"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-ink-deep border border-ink-border focus:border-flag-red rounded-lg p-3 text-sm text-paper-soft focus:outline-none focus:ring-1 focus:ring-flag-red"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-mono uppercase text-muted-text">
                          Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            value={userState.data.email}
                            disabled
                            className="w-full bg-ink-deep/50 border border-ink-border rounded-lg p-3 text-sm text-muted-text cursor-not-allowed pr-10"
                          />
                          <ShieldCheck className="w-4 h-4 text-[#10B981] absolute right-3 top-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-[11px] text-muted-text">
                          Email is locked for certificate verification. Contact support to change.
                        </p>
                      </div>
                    </div>

                    {profileSuccessMessage && (
                      <div className="p-3 rounded-lg bg-[#059669]/15 border border-[#059669]/30 text-[#10B981] text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>{profileSuccessMessage}</span>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        id="account-save-profile-btn"
                        type="submit"
                        variant="primary"
                        size="md"
                        isLoading={isSavingProfile}
                        disabled={fullName === userState.data.fullName}
                      >
                        Save Profile
                      </Button>
                    </div>
                  </form>
                ) : null}
              </Card>

              {/* Password Change Card */}
              <Card className="p-6 bg-ink-raised border border-ink-border space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-ink-border">
                  <h2 className="font-display font-bold text-lg text-paper-soft flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-flag-red" />
                    <span>Change Password</span>
                  </h2>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase text-muted-text">
                      Current Password
                    </label>
                    <input
                      id="account-current-password-input"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-ink-deep border border-ink-border focus:border-flag-red rounded-lg p-3 text-sm text-paper-soft focus:outline-none focus:ring-1 focus:ring-flag-red"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono uppercase text-muted-text">
                        New Password
                      </label>
                      <input
                        id="account-new-password-input"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-ink-deep border border-ink-border focus:border-flag-red rounded-lg p-3 text-sm text-paper-soft focus:outline-none focus:ring-1 focus:ring-flag-red"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono uppercase text-muted-text">
                        Confirm New Password
                      </label>
                      <input
                        id="account-confirm-password-input"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-ink-deep border border-ink-border focus:border-flag-red rounded-lg p-3 text-sm text-paper-soft focus:outline-none focus:ring-1 focus:ring-flag-red"
                        required
                      />
                    </div>
                  </div>

                  {passwordError && (
                    <div className="p-3 rounded-lg bg-flag-red/15 border border-flag-red/30 text-flag-red text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccessMessage && (
                    <div className="p-3 rounded-lg bg-[#059669]/15 border border-[#059669]/30 text-[#10B981] text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>{passwordSuccessMessage}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      id="account-update-password-btn"
                      type="submit"
                      variant="secondary"
                      size="md"
                      isLoading={isChangingPassword}
                      disabled={!currentPassword || !newPassword}
                    >
                      Update Password
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Display & Appearance Card */}
              <Card className="p-6 bg-ink-raised border border-ink-border space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-ink-border">
                  <h2 className="font-display font-bold text-lg text-paper-soft flex items-center gap-2">
                    <Sun className="w-5 h-5 text-flag-red" />
                    <span>Display & Appearance</span>
                  </h2>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-muted-text leading-relaxed">
                    Select your preferred interface theme. Switch to FlagIQ Light mode to match the official FlagIQ agency aesthetic (#F7F4EE canvas, crisp white cards, and signature red accents).
                  </p>
                  <div>
                    <ThemeToggle id="account-theme-segmented" variant="segmented" />
                  </div>
                </div>
              </Card>
            </div>

            {/* RIGHT 1 COLUMN: ACTIVE ENROLLMENTS & SUPPORT */}
            <div className="space-y-6">
              
              {/* Active Enrollments Card */}
              <Card className="p-6 bg-ink-raised border border-ink-border space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-ink-border">
                  <h2 className="font-display font-bold text-base text-paper-soft flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-flag-red" />
                    <span>Active Enrollments</span>
                  </h2>
                </div>

                {enrollmentsState.status === 'loading' ? (
                  <div className="space-y-3">
                    <Skeleton height={60} width="100%" />
                    <Skeleton height={60} width="100%" />
                  </div>
                ) : enrollmentsState.status === 'success' ? (
                  <div className="space-y-3">
                    {enrollmentsState.data.map((enr) => (
                      <div
                        key={enr.id}
                        className="p-3.5 rounded-xl border border-ink-border bg-ink-deep space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-paper-soft">
                            {enr.tierName}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#059669]/20 text-[#10B981]">
                            Active
                          </span>
                        </div>

                        <div className="space-y-1 text-[11px] font-mono text-muted-text">
                          <div className="flex justify-between">
                            <span>Purchased:</span>
                            <span className="text-body-text">{enr.purchaseDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Amount:</span>
                            <span className="text-body-text">
                              {koboToNaira(enr.amountPaidKobo)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Ref:</span>
                            <span className="text-muted-text">{enr.reference}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </Card>

              {/* Student Support & Help */}
              <Card className="p-5 bg-ink-raised border border-ink-border space-y-3">
                <h3 className="font-display font-bold text-sm text-paper-soft">
                  Need Admissions Help?
                </h3>
                <p className="text-xs text-muted-text leading-relaxed">
                  Questions regarding live session schedules, invoice receipts, or Telegram access? Contact Tobi and the Flag Skool team directly:
                </p>
                <a
                  href={`mailto:${config.org.supportEmail}`}
                  className="inline-flex items-center gap-1.5 text-xs text-flag-red hover:underline font-mono"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{config.org.supportEmail}</span>
                </a>
              </Card>

              {/* Sign Out Action */}
              <div className="pt-2">
                <Button
                  id="account-signout-btn"
                  variant="ghost"
                  size="md"
                  fullWidth
                  onClick={() => onLogout && onLogout()}
                  leftIcon={<LogOut className="w-4 h-4 text-flag-red" />}
                  className="text-xs text-muted-text hover:text-flag-red"
                >
                  Sign Out of Flag Skool
                </Button>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
};
