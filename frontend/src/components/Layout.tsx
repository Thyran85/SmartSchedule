import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, DoorOpen,
  BookOpen, Calendar, ClipboardCheck, Menu, X, Search,
  Bell, ChevronsLeft, ChevronsRight,
  UserCircle2, School,
} from 'lucide-react';
import clsx from 'clsx';
import {
  classesApi, enseignantsApi, sallesApi, notificationsApi,
} from '../services/api';
import type { Notification } from '../types';

interface NavItem {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  match: 'exact' | 'starts';
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Général',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Tableau de bord', match: 'exact' },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { to: '/classes', icon: Users, label: 'Classes', match: 'starts' },
      { to: '/enseignants', icon: GraduationCap, label: 'Enseignants', match: 'starts' },
      { to: '/salles', icon: DoorOpen, label: 'Salles', match: 'starts' },
      { to: '/matieres', icon: BookOpen, label: 'Matières', match: 'starts' },
    ],
  },
  {
    label: 'Planification',
    items: [
      { to: '/edt', icon: Calendar, label: 'Emplois du temps', match: 'starts' },
      { to: '/contraintes', icon: ClipboardCheck, label: 'Contraintes', match: 'starts' },
    ],
  },
];

const routeMeta: { path: string; crumb: string }[] = [
  { path: '/', crumb: 'Tableau de bord' },
  { path: '/classes', crumb: 'Classes' },
  { path: '/enseignants', crumb: 'Enseignants' },
  { path: '/salles', crumb: 'Salles' },
  { path: '/matieres', crumb: 'Matières' },
  { path: '/edt', crumb: 'Emplois du temps' },
  { path: '/contraintes', crumb: 'Contraintes' },
];

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const crumb = useMemo(() => {
    if (location.pathname.startsWith('/edt/')) return 'Consultation';
    return routeMeta.find(r =>
      r.path === '/' ? location.pathname === '/' : location.pathname.startsWith(r.path),
    )?.crumb ?? 'Accueil';
  }, [location.pathname]);

  const isActive = (item: NavItem) =>
    item.match === 'exact'
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to);

  return (
    <div className="flex min-h-screen bg-paper text-body">
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 animate-fade-in bg-ink/50 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-surface transition-all duration-300 lg:relative',
          collapsed ? 'w-[76px]' : 'w-[264px]',
          mobileOpen ? 'translate-x-0 shadow-pop' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Brand */}
        <div
          className={clsx(
            'flex h-16 shrink-0 items-center border-b border-line px-4',
            collapsed ? 'justify-center' : 'gap-3',
          )}
        >
          <Link to="/" className="logo-mark" aria-label="SmartSchedule" title="SmartSchedule">
            <School className="h-5 w-5" />
          </Link>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate font-display text-[15px] font-semibold text-ink">
                SmartSchedule
              </p>
              <p className="text-[11px] text-muted">Emplois du temps</p>
            </div>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto grid h-8 w-8 place-items-center rounded-[9px] text-muted hover:bg-black/5 lg:hidden"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={clsx(
            'mx-3 mt-3 hidden h-8 items-center gap-2 rounded-[9px] px-2.5 text-xs font-medium text-muted transition-colors hover:bg-black/5 hover:text-body lg:flex',
            collapsed && 'justify-center px-0',
          )}
          title={collapsed ? 'Déplier le menu' : 'Replier le menu'}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4" />
              Replier
            </>
          )}
        </button>

        {/* Nav */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 scrollbar-thin">
          {navGroups.map(group => (
            <div key={group.label}>
              {!collapsed && (
                <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/80">
                  {group.label}
                </p>
              )}
              <ul className="space-y-1">
                {group.items.map(item => {
                  const active = isActive(item);
                  return (
                    <li key={item.to} className="relative">
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-gold"
                          aria-hidden
                        />
                      )}
                      <Link
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        title={collapsed ? item.label : undefined}
                        aria-current={active ? 'page' : undefined}
                        className={clsx(
                          'group flex items-center rounded-[11px] text-sm font-medium transition-all duration-150',
                          collapsed ? 'h-11 justify-center' : 'h-10 gap-3 px-3',
                          active
                            ? 'bg-primary-soft text-primary'
                            : 'text-body hover:bg-black/4 hover:text-ink',
                        )}
                      >
                        <span
                          className={clsx(
                            'shrink-0 transition-colors [&>svg]:h-5 [&>svg]:w-5',
                            active ? 'text-primary' : 'text-muted group-hover:text-ink',
                          )}
                        >
                          <item.icon />
                        </span>
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div
          className={clsx(
            'flex shrink-0 items-center gap-3 border-t border-line px-4 py-4',
            collapsed && 'justify-center px-0',
          )}
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-strong">
            <UserCircle2 className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium text-ink">Administrateur</p>
              <p className="truncate text-[11px] text-muted">admin@lycee.mg</p>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <Header crumb={crumb} onOpenMenu={() => setMobileOpen(true)} />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1200px]">{children}</div>
        </main>

        <footer className="border-t border-line px-6 py-4">
          <p className="text-center text-xs text-muted">
            SmartSchedule · Gestion des emplois du temps · {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
}

/* ── Header ──────────────────────────────────────────────────────────── */

function Header({ crumb, onOpenMenu }: { crumb: string; onOpenMenu: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ label: string; sub: string; to: string }[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notificationsApi.list().then(r => setNotifs(r.data.results)).catch(() => {});
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.trim().toLowerCase();
    const found: { label: string; sub: string; to: string }[] = [];
    Promise.all([
      classesApi.list(),
      enseignantsApi.list(),
      sallesApi.list(),
    ]).then(([c, t, r]) => {
      c.data.results.forEach(x => {
        if (x.nom.toLowerCase().includes(q)) found.push({ label: x.nom, sub: 'Classe', to: `/edt/classe/${x.id}` });
      });
      t.data.results.forEach(x => {
        if (`${x.prenom} ${x.nom}`.toLowerCase().includes(q)) found.push({ label: `${x.prenom} ${x.nom}`, sub: 'Enseignant', to: `/edt/enseignant/${x.id}` });
      });
      r.data.results.forEach(x => {
        if (x.nom.toLowerCase().includes(q)) found.push({ label: x.nom, sub: 'Salle', to: `/edt/salle/${x.id}` });
      });
      setResults(found.slice(0, 8));
    }).catch(() => {});
  }, [query]);

  const unread = notifs.filter(n => !n.lue).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-paper/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <button
        onClick={onOpenMenu}
        className="grid h-9 w-9 place-items-center rounded-[10px] text-body transition-colors hover:bg-black/5 lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb */}
      <nav aria-label="Fil d'ariane" className="hidden min-w-0 items-center gap-2 sm:flex">
        <Link
          to="/"
          className="truncate text-sm font-medium text-muted transition-colors hover:text-primary"
        >
          Accueil
        </Link>
        <ChevronsLeft className="h-3.5 w-3.5 rotate-180 text-muted/50" aria-hidden />
        <span className="truncate text-sm font-semibold text-ink">{crumb}</span>
      </nav>

      <div className="flex-1" />

      {/* Search */}
      <div ref={searchRef} className="relative hidden md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setSearchOpen(true); }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Rechercher classe, enseignant, salle…"
          className="h-10 w-56 rounded-[11px] border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-muted transition-all duration-200 focus:w-72 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary-soft lg:w-64 lg:focus:w-80"
          aria-label="Rechercher"
        />
        {searchOpen && results.length > 0 && (
          <div className="absolute right-0 top-12 w-80 animate-pop-in overflow-hidden rounded-[14px] border border-line bg-surface shadow-pop">
            <p className="border-b border-line px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Résultats de recherche
            </p>
            <ul className="max-h-72 overflow-y-auto scrollbar-thin">
              {results.map((r, i) => (
                <li key={i}>
                  <Link
                    to={r.to}
                    onClick={() => { setSearchOpen(false); setQuery(''); }}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-primary-soft/40"
                  >
                    <span className="truncate font-medium text-ink">{r.label}</span>
                    <span className="shrink-0 text-[11px] font-medium text-muted">{r.sub}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {searchOpen && query.trim() && results.length === 0 && (
          <div className="absolute right-0 top-12 w-80 animate-pop-in rounded-[14px] border border-line bg-surface px-4 py-4 text-sm text-muted shadow-pop">
            Aucun résultat pour «&nbsp;{query}&nbsp;»
          </div>
        )}
      </div>

      {/* Notifications */}
      <div ref={notifRef} className="relative">
        <button
          onClick={() => setNotifOpen(o => !o)}
          className="relative grid h-9 w-9 place-items-center rounded-[10px] text-body transition-colors hover:bg-black/5"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-12 w-80 animate-pop-in overflow-hidden rounded-[14px] border border-line bg-surface shadow-pop">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Notifications
              </p>
              {unread > 0 && (
                <button
                  onClick={() => {
                    notifs.forEach(n => { if (!n.lue) notificationsApi.markRead(n.id).catch(() => {}); });
                    setNotifs(ns => ns.map(n => ({ ...n, lue: true })));
                  }}
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
            <ul className="max-h-80 overflow-y-auto scrollbar-thin">
              {notifs.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-muted">
                  Aucune notification
                </li>
              )}
              {notifs.slice(0, 8).map(n => (
                <li key={n.id}>
                  <Link
                    to={n.lien || '/'}
                    onClick={() => { setNotifOpen(false); if (!n.lue) notificationsApi.markRead(n.id).catch(() => {}); }}
                    className={clsx(
                      'block px-4 py-3 transition-colors hover:bg-primary-soft/40',
                      !n.lue && 'border-l-2 border-gold bg-gold-soft/40',
                    )}
                  >
                    <p className="text-sm font-medium text-ink">{n.message}</p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {new Date(n.date_creation).toLocaleString('fr-FR', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="flex items-center gap-2.5 border-l border-line pl-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-strong text-xs font-bold text-white">
          AD
        </div>
        <div className="hidden leading-tight lg:block">
          <p className="text-sm font-medium text-ink">Admin</p>
          <p className="text-[11px] text-muted">Lycée de Tana</p>
        </div>
      </div>
    </header>
  );
}