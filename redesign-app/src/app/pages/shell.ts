import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { Api, menuTree, routeForMenu } from '../core/api';
import { Auth } from '../core/auth';
import { I18n, I18nKey } from '../core/i18n';
import { Menu } from '../core/models';
import { Theme } from '../core/theme';
import { AssistantPanel } from '../ui/assistant';
import { Icon, iconFor } from '../ui/icon';

interface NavItem {
  label: string;
  icon: string;
  route: string | null;
  children: NavItem[];
}

/** Used when the backend menus cannot be loaded (same structure as the seed data). */
const FALLBACK: { key: I18nKey; icon: string; route: string | null; children?: { key: I18nKey; icon: string; route: string }[] }[] = [
  { key: 'dashboard', icon: 'chart', route: '/dashboard' },
  {
    key: 'administration', icon: 'cog', route: null,
    children: [
      { key: 'users', icon: 'users', route: '/users' },
      { key: 'roles', icon: 'idCard', route: '/roles' },
      { key: 'menus', icon: 'list', route: '/menus' },
    ],
  },
  {
    key: 'settings', icon: 'database', route: null,
    children: [
      { key: 'countries', icon: 'globe', route: '/countries' },
      { key: 'cities', icon: 'pin', route: '/cities' },
    ],
  },
];

const CRM_TITLES: Record<string, I18nKey> = { '': 'crmDashboard', clients: 'clients', pipeline: 'pipeline', activities: 'activities', history: 'history' };

const TITLES: Record<string, I18nKey> = {
  dashboard: 'dashboard', users: 'users', roles: 'roles', menus: 'menus', countries: 'countries', cities: 'cities',
};

/** Names of the roles created by the backend seed data. */
const ROLE_KEYS: Record<string, I18nKey> = {
  ROLE_SUPER_ADMIN: 'roleSuperAdmin',
  ROLE_ADMIN: 'roleAdmin',
  ROLE_USER: 'roleUser',
  ROLE_MANAGER: 'roleManager',
  ROLE_SALES: 'roleSales',
  ROLE_VIEWER: 'roleViewer',
};

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgTemplateOutlet, Icon, AssistantPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'drawer.set(false); userMenu.set(false)' },
  template: `
    <div class="min-h-dvh lg:ps-72">
      <!-- Sidebar -->
      @if (drawer()) { <div class="animate-fade fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden" (click)="drawer.set(false)"></div> }
      <aside class="fixed inset-y-0 start-0 z-50 flex w-72 flex-col border-e border-line bg-surface transition-transform duration-300 lg:translate-x-0"
        [class.-translate-x-full]="!drawer() && !i18n.rtl()" [class.translate-x-full]="!drawer() && i18n.rtl()" [attr.aria-label]="i18n.t('navigation')">
        <div class="flex h-16 items-center justify-between gap-3 px-5">
          <a routerLink="/dashboard" class="flex items-center gap-2.5" (click)="drawer.set(false)">
            <img src="favicon.svg" alt="" class="size-9" />
            <span class="text-lg font-bold tracking-tight text-strong">{{ i18n.t('appName') }}</span>
          </a>
          <button type="button" class="icon-btn lg:hidden" (click)="drawer.set(false)" [attr.aria-label]="i18n.t('closeMenu')"><app-icon name="x" /></button>
        </div>

        <nav class="flex-1 overflow-y-auto px-3 py-4">
          @for (item of nav(); track item.label) {
            @if (item.children.length) {
              <p class="mt-5 mb-2 px-3 text-[11px] font-semibold tracking-[.12em] text-muted uppercase first:mt-0">{{ item.label }}</p>
              @for (child of item.children; track child.label) { <ng-container *ngTemplateOutlet="link; context: { $implicit: child }" /> }
            } @else if (item.route) {
              <ng-container *ngTemplateOutlet="link; context: { $implicit: item }" />
            }
          }
          <ng-template #link let-item>
            @if (item.route) {
              <a [routerLink]="item.route" routerLinkActive="!bg-brand/10 !text-brand dark:!bg-brand/20 dark:!text-indigo-300" [routerLinkActiveOptions]="{ exact: item.route === '/crm' }" (click)="drawer.set(false)"
                class="mb-0.5 flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-body transition hover:bg-soft hover:text-strong">
                <app-icon [name]="item.icon" />{{ item.label }}
              </a>
            }
          </ng-template>
        </nav>

        <div class="m-3 rounded-2xl border border-line bg-soft/60 p-4 text-sm">
          <p class="font-medium text-strong">{{ i18n.t('footer') }}</p>
          <a href="../" class="mt-1 inline-flex items-center gap-1.5 text-muted hover:text-strong">{{ i18n.t('oldVersion') }}<app-icon name="external" [size]="14" /></a>
        </div>
      </aside>

      <!-- Top bar -->
      <header class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-page/80 px-4 backdrop-blur-xl sm:px-8">
        <button type="button" class="icon-btn lg:hidden" (click)="drawer.set(true)" [attr.aria-label]="i18n.t('openMenu')" [attr.aria-expanded]="drawer()"><app-icon name="menu" /></button>
        <p class="truncate font-semibold text-strong">{{ title() }}</p>
        <div class="ms-auto flex items-center gap-1">
          <button type="button" class="btn btn-ghost hidden min-h-10 px-3 sm:inline-flex" (click)="i18n.toggle()"><app-icon name="languages" [size]="16" />{{ i18n.t('language') }}</button>
          <button type="button" class="icon-btn sm:hidden" (click)="i18n.toggle()" [attr.aria-label]="i18n.t('language')"><app-icon name="languages" /></button>
          <button type="button" class="icon-btn" (click)="theme.toggle()" [attr.aria-label]="theme.dark() ? i18n.t('lightMode') : i18n.t('darkMode')"><app-icon [name]="theme.dark() ? 'sun' : 'moon'" /></button>

          <div class="relative ms-1">
            <button type="button" class="flex items-center gap-2 rounded-xl p-1 pe-2 transition hover:bg-soft" (click)="userMenu.set(!userMenu())" [attr.aria-expanded]="userMenu()">
              <span class="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-sm font-bold text-white">{{ auth.initials() }}</span>
              <span class="hidden text-start leading-tight md:block">
                <span class="block text-sm font-semibold text-strong">{{ fullName() }}</span>
                <span class="block text-xs text-muted">{{ roleLabel() }}</span>
              </span>
              <app-icon name="chevronDown" [size]="16" class="hidden text-muted md:block" />
            </button>
            @if (userMenu()) {
              <div class="fixed inset-0 z-10" (click)="userMenu.set(false)"></div>
              <div class="animate-pop absolute end-0 z-20 mt-2 w-64 rounded-2xl border border-line bg-surface p-2 shadow-xl">
                <div class="px-3 py-2">
                  <p class="font-semibold text-strong">{{ fullName() }}</p>
                  <p class="truncate text-sm text-muted">{{ auth.user()?.email || auth.user()?.login }}</p>
                </div>
                <hr class="my-1 border-line" />
                <button type="button" class="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10" (click)="auth.logout()">
                  <app-icon name="logout" class="rtl:rotate-180" />{{ i18n.t('logout') }}
                </button>
              </div>
            }
          </div>
        </div>
      </header>

      <main class="mx-auto w-full max-w-7xl px-4 py-6 pb-24 sm:px-8 sm:py-8 sm:pb-24"><router-outlet /></main>
      <app-assistant />
    </div>
  `,
})
export class Shell {
  /** The role name in the current language (its code when unknown). */
  protected roleLabel = computed(() => {
    const role = this.auth.user()?.role ?? '';
    const key = ROLE_KEYS[role];
    return key ? this.i18n.t(key) : role;
  });
  protected i18n = inject(I18n);
  protected theme = inject(Theme);
  protected auth = inject(Auth);
  private api = inject(Api);
  private router = inject(Router);

  protected drawer = signal(false);
  protected userMenu = signal(false);
  private backendMenus = signal<Menu[] | null>(null);

  private url = toSignal(
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd), map((e) => (e as NavigationEnd).urlAfterRedirects)),
    { initialValue: this.router.url },
  );
  protected title = computed(() => {
    const parts = this.url().split(/[/?#]/).filter(Boolean);
    const key = parts[0] === 'crm' ? CRM_TITLES[parts[1] ?? ''] : TITLES[parts[0] ?? 'dashboard'];
    return key ? this.i18n.t(key) : '';
  });
  protected fullName = computed(() => {
    const u = this.auth.user();
    return u ? `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() || u.login : '';
  });

  /** Sidebar built from the menus the backend gives to the connected user's role. */
  protected nav = computed<NavItem[]>(() => this.withCrm(this.adminNav()));

  /** The CRM group (version 2 only, not stored in the shared menus table), placed after the first entry. */
  private withCrm(items: NavItem[]): NavItem[] {
    const crm: NavItem = {
      label: this.i18n.t("crm"),
      icon: "briefcase",
      route: null,
      children: [
        { label: this.i18n.t("crmDashboard"), icon: "chart", route: "/crm", children: [] },
        { label: this.i18n.t("clients"), icon: "building", route: "/crm/clients", children: [] },
        { label: this.i18n.t("pipeline"), icon: "trending", route: "/crm/pipeline", children: [] },
        { label: this.i18n.t("activities"), icon: "calendar", route: "/crm/activities", children: [] },
        { label: this.i18n.t("history"), icon: "clock", route: "/crm/history", children: [] },
      ],
    };
    return [...items.slice(0, 1), crm, ...items.slice(1)];
  }

  private adminNav(): NavItem[] {
    const menus = this.backendMenus();
    if (menus?.length) {
      const items = menuTree(menus).map((m) => ({
        label: this.i18n.label(m),
        icon: iconFor(m.icon),
        route: routeForMenu(m.url),
        children: m.children.map((c) => ({ label: this.i18n.label(c), icon: iconFor(c.icon), route: routeForMenu(c.url), children: [] })),
      }));
      if (items.some((i) => i.route || i.children.some((c) => c.route))) return items;
    }
    return FALLBACK.map((f) => ({
      label: this.i18n.t(f.key),
      icon: f.icon,
      route: f.route,
      children: (f.children ?? []).map((c) => ({ label: this.i18n.t(c.key), icon: c.icon, route: c.route, children: [] })),
    }));
  }

  constructor() {
    this.api.myMenus().subscribe({ next: (m) => this.backendMenus.set(m), error: () => this.backendMenus.set([]) });
    if (!this.auth.user()) this.auth.loadMe().subscribe({ error: () => {} });
  }
}
