'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import LogoutButton from './LogoutButton';
import ThemeToggle from './ThemeToggle';
import { CustomLink } from './navigation-blocker';
import { headerLinkClass, HEADER_CONTROL_BOX_BASE } from './header-chrome';

interface HeaderProps {
  username?: string;
  isAdmin?: boolean;
}

export default function Header({ isAdmin = false, username = 'Operator' }: HeaderProps) {
  const pathname = usePathname() || '';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  // Shared with `ThemeToggle` via `header-chrome`, not reproduced there.
  const getLinkClass = headerLinkClass;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setPwError(null);
    setPwSuccess(false);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      setPwSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => {
        setChangePasswordOpen(false);
        setPwSuccess(false);
      }, 1500);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Error occurred');
    } finally {
      setBusy(false);
    }
  };

  return (
    <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border/80 pb-6 gap-4 relative">
      <div className="flex items-center gap-4">
        {/* `CustomLink`, not `Link`, on all five: a surface below may be holding
            unsaved work, and these are the operator's normal way off the page.
            With no `NavigationBlockerProvider` above — which is every page but
            `/admin/artifacts` — the context default is `isBlocked: false` and
            these behave exactly as a plain `Link`. */}
        <CustomLink href="/" className="flex items-center gap-4 group">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-card shadow-md text-primary group-hover:border-primary/50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0h.5m-.5 0h-10.5m.5 0h-1.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              BIC Presenter Hub
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage presentation slides
            </p>
          </div>
        </CustomLink>
      </div>
      {/* `<nav>` ends where the links end. The theme control and the profile
          menu are settings, not navigation, and a screen-reader operator should
          not meet them inside the navigation landmark. `flex-wrap` on the row
          because an admin already carries four pills plus the profile button,
          and the toggle made it six controls on a row that could not wrap. */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <nav className="flex flex-wrap items-center gap-2">
          <CustomLink
            href="/"
            className={getLinkClass(pathname === '/')}
          >
            Dashboard
          </CustomLink>
          <CustomLink
            href="/announcements"
            className={getLinkClass(pathname.startsWith('/announcements'))}
          >
            Announcements
          </CustomLink>
          {isAdmin && (
            <>
              <CustomLink
                href="/admin/artifacts"
                className={getLinkClass(pathname.startsWith('/admin/artifacts'))}
              >
                Artifacts
              </CustomLink>
              <CustomLink
                href="/admin"
                className={getLinkClass(
                  pathname.startsWith('/admin') && !pathname.startsWith('/admin/artifacts')
                )}
              >
                Settings
              </CustomLink>
            </>
          )}
        </nav>

        <ThemeToggle />

        {/* Profile Dropdown Menu */}
        <div className="relative">
          {/* The box comes from `header-chrome`, the tone stays here: this
              trigger rests at `text-foreground` where the pills and the toggle
              rest at `text-muted-foreground`. It used to state the whole box
              inline — the third copy of it, after the other two were closed. */}
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-2.5 text-foreground ${HEADER_CONTROL_BOX_BASE}`}
          >
            <div className="w-4 h-4 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
              {username[0]?.toUpperCase()}
            </div>
            <span>{username}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-muted-foreground">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>
          
          {dropdownOpen && (
            <>
              {/* Overlay background to close dropdown when clicking outside */}
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-40 rounded-xl border border-border bg-card/95 backdrop-blur-md p-1.5 shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                <button
                  type="button"
                  onClick={() => { setDropdownOpen(false); setChangePasswordOpen(true); }}
                  className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted text-foreground transition-all cursor-pointer flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-muted-foreground">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a3 3 0 0 1-3 3m-12-6a9 9 0 0 1 18 0v.75A2.25 2.25 0 0 1 19.5 12h-1.5a2.25 2.25 0 0 0-2.25 2.25v1.5a2.25 2.25 0 0 1-2.25 2.25h-1.5a2.25 2.25 0 0 0-2.25 2.25v1.5a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 21V9.75A2.25 2.25 0 0 1 3.75 7.5h12Z" />
                  </svg>
                  Change Password
                </button>
                <LogoutButton />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {changePasswordOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm border border-border bg-card/95 p-6 rounded-2xl shadow-xl space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-foreground">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Password</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  className="w-full p-2.5 text-xs bg-background border border-border/80 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground"
                  placeholder="Your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="w-full p-2.5 text-xs bg-background border border-border/80 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground"
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              {pwError && <p className="text-xs text-destructive font-medium">{pwError}</p>}
              {/* `emerald-600` holds at 4.91:1 on the dark card — it passes AA,
                  but only just, and it is the same shade the slide-preview
                  badges had to leave behind for the dark surface. `emerald-400`
                  measures 9.25:1, so the success line reads as clearly as the
                  failure line beside it under either theme. */}
              {pwSuccess && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">Password updated successfully!</p>}
              
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setChangePasswordOpen(false); setCurrentPassword(''); setNewPassword(''); setPwError(null); setPwSuccess(false); }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-border bg-background hover:bg-muted text-foreground cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground cursor-pointer shadow-sm transition-all"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
