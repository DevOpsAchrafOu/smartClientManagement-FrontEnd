import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, of } from 'rxjs';
import { Api, flattenMenus } from '../core/api';
import { Auth } from '../core/auth';
import { I18n, I18nKey } from '../core/i18n';
import { City, Country, Menu, Role, User } from '../core/models';
import { Icon } from '../ui/icon';

interface Data {
  users: User[] | null;
  roles: Role[] | null;
  menus: Menu[] | null;
  countries: Country[] | null;
  cities: City[] | null;
}

const safe = <T,>(o: Observable<T>) => o.pipe(catchError(() => of(null)));

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, Icon, DatePipe, UpperCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="animate-rise relative mb-8 overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
      <div class="pointer-events-none absolute -top-24 end-0 size-80 rounded-full bg-brand/50 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-28 start-1/3 size-72 rounded-full bg-brand-2/30 blur-3xl"></div>
      <div class="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-sm text-slate-300">{{ today | date: 'fullDate' : undefined : i18n.lang() === 'ar' ? 'ar' : 'fr' }}</p>
          <h1 class="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{{ i18n.t('hello') }}, {{ auth.user()?.prenom || auth.user()?.login }} 👋</h1>
          <p class="mt-2 text-slate-300">{{ i18n.t('dashboardIntro') }}</p>
        </div>
        <a routerLink="/users" class="btn bg-white text-slate-900 hover:bg-slate-100"><app-icon name="plus" />{{ i18n.t('newUser') }}</a>
      </div>
    </section>

    <!-- Key figures -->
    <section class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
      @for (s of stats(); track s.key; let i = $index) {
        <a [routerLink]="s.route" class="card group animate-rise p-5 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/5" [style.animation-delay.ms]="i * 50">
          <span class="grid size-11 place-items-center rounded-2xl" [class]="s.tone"><app-icon [name]="s.icon" /></span>
          <p class="mt-4 text-3xl font-bold tracking-tight text-strong">
            @if (loading()) { <span class="skeleton inline-block h-8 w-12 align-middle"></span> } @else { {{ s.value ?? '—' }} }
          </p>
          <p class="mt-0.5 flex items-center justify-between text-sm text-muted">{{ i18n.t(s.key) }}<app-icon name="arrowRight" [size]="16" class="opacity-0 transition group-hover:opacity-100 rtl:rotate-180" /></p>
        </a>
      }
    </section>

    <div class="mt-6 grid gap-6 lg:grid-cols-3">
      <!-- Cities by country -->
      <section class="card p-6 lg:col-span-2">
        <div class="mb-5 flex items-center justify-between">
          <h2 class="font-semibold text-strong">{{ i18n.t('citiesByCountry') }}</h2>
          <a routerLink="/cities" class="text-sm font-medium text-brand hover:underline dark:text-indigo-300">{{ i18n.t('seeAll') }}</a>
        </div>
        @if (loading()) {
          <div class="space-y-4">@for (i of [1, 2, 3, 4]; track i) { <div class="skeleton h-8"></div> }</div>
        } @else {
          <ul class="space-y-4">
            @for (c of citiesByCountry(); track c.name) {
              <li>
                <div class="mb-1.5 flex justify-between text-sm"><span class="font-medium text-strong">{{ c.name }}</span><span class="text-muted tabular-nums">{{ c.count }}</span></div>
                <div class="h-2.5 overflow-hidden rounded-full bg-soft">
                  <div class="h-full rounded-full bg-gradient-to-r from-brand to-brand-2 transition-[width] duration-700 rtl:bg-gradient-to-l" [style.width.%]="c.pct"></div>
                </div>
              </li>
            } @empty { <li class="text-muted">{{ i18n.t('noResults') }}</li> }
          </ul>
        }
      </section>

      <!-- Users by role -->
      <section class="card p-6">
        <h2 class="mb-5 font-semibold text-strong">{{ i18n.t('usersByRole') }}</h2>
        @if (loading()) {
          <div class="skeleton mx-auto size-40 rounded-full"></div>
        } @else {
          <div class="relative mx-auto size-40">
            <div class="size-full rounded-full" [style.background]="donut()"></div>
            <div class="absolute inset-5 grid place-items-center rounded-full bg-surface text-center">
              <div><p class="text-3xl font-bold text-strong">{{ data().users?.length ?? '—' }}</p><p class="text-xs text-muted">{{ i18n.t('users') }}</p></div>
            </div>
          </div>
          <ul class="mt-6 space-y-2.5 text-sm">
            @for (r of usersByRole(); track r.code) {
              <li class="flex items-center gap-2.5"><span class="size-2.5 rounded-full" [style.background]="r.color"></span><span class="flex-1 text-body">{{ r.title }}</span><span class="font-semibold text-strong tabular-nums">{{ r.count }}</span></li>
            }
          </ul>
        }
      </section>

      <!-- Latest users -->
      <section class="card lg:col-span-2">
        <div class="flex items-center justify-between px-6 pt-6 pb-3">
          <h2 class="font-semibold text-strong">{{ i18n.t('latestUsers') }}</h2>
          <a routerLink="/users" class="text-sm font-medium text-brand hover:underline dark:text-indigo-300">{{ i18n.t('seeAll') }}</a>
        </div>
        <ul class="px-3 pb-3">
          @for (u of latestUsers(); track u.id) {
            <li class="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-soft/60">
              <span class="grid size-10 place-items-center rounded-xl bg-soft text-sm font-bold text-strong">{{ (u.prenom?.[0] ?? '') + (u.nom?.[0] ?? '') | uppercase }}</span>
              <div class="min-w-0 flex-1">
                <p class="truncate font-medium text-strong">{{ u.prenom }} {{ u.nom }}</p>
                <p class="truncate text-sm text-muted">{{ u.email || u.login }}</p>
              </div>
              <span class="chip hidden sm:inline-flex">{{ roleTitle(u.role) }}</span>
            </li>
          } @empty {
            @if (loading()) { @for (i of [1, 2, 3]; track i) { <li class="skeleton mx-3 my-2 h-12"></li> } } @else { <li class="px-3 py-6 text-muted">{{ i18n.t('noResults') }}</li> }
          }
        </ul>
      </section>

      <!-- Quick actions -->
      <section class="card p-6">
        <h2 class="mb-4 font-semibold text-strong">{{ i18n.t('quickActions') }}</h2>
        <div class="space-y-2">
          @for (q of quick; track q.route) {
            <a [routerLink]="q.route" class="flex items-center gap-3 rounded-2xl border border-line p-3 transition hover:border-brand/40 hover:bg-brand/5">
              <span class="grid size-10 place-items-center rounded-xl bg-soft text-strong"><app-icon [name]="q.icon" /></span>
              <span class="flex-1"><span class="block font-medium text-strong">{{ i18n.t(q.title) }}</span><span class="block text-sm text-muted">{{ i18n.t(q.text) }}</span></span>
              <app-icon name="chevron" [size]="16" class="text-muted rtl:rotate-180" />
            </a>
          }
        </div>
      </section>
    </div>
  `,
})
export class DashboardPage {
  protected i18n = inject(I18n);
  protected auth = inject(Auth);
  private api = inject(Api);

  protected today = new Date();
  protected loading = signal(true);
  protected data = signal<Data>({ users: null, roles: null, menus: null, countries: null, cities: null });

  private palette = ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];

  protected stats = computed(() => {
    const d = this.data();
    return [
      { key: 'users' as I18nKey, icon: 'users', route: '/users', value: d.users?.length, tone: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300' },
      { key: 'roles' as I18nKey, icon: 'shield', route: '/roles', value: d.roles?.length, tone: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300' },
      { key: 'menus' as I18nKey, icon: 'list', route: '/menus', value: d.menus ? flattenMenus(d.menus).length : undefined, tone: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
      { key: 'countries' as I18nKey, icon: 'globe', route: '/countries', value: d.countries?.length, tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
      { key: 'cities' as I18nKey, icon: 'pin', route: '/cities', value: d.cities?.length, tone: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300' },
    ];
  });

  protected citiesByCountry = computed(() => {
    const { countries, cities } = this.data();
    if (!countries || !cities) return [];
    const rows = countries.map((c) => ({ name: this.i18n.label(c), count: cities.filter((v) => v.idPays === c.id).length }));
    const max = Math.max(1, ...rows.map((r) => r.count));
    return rows.sort((a, b) => b.count - a.count).slice(0, 6).map((r) => ({ ...r, pct: Math.max(3, (r.count / max) * 100) }));
  });

  protected usersByRole = computed(() => {
    const { users, roles } = this.data();
    if (!users) return [];
    const codes = [...new Set([...(roles ?? []).map((r) => r.code), ...users.map((u) => u.role)])];
    return codes
      .map((code, i) => ({ code, title: this.roleTitle(code), count: users.filter((u) => u.role === code).length, color: this.palette[i % this.palette.length] }))
      .filter((r) => r.count > 0);
  });

  /** Conic gradient for the users-by-role ring. */
  protected donut = computed(() => {
    const rows = this.usersByRole();
    const total = rows.reduce((s, r) => s + r.count, 0);
    if (!total) return 'var(--soft)';
    let at = 0;
    const stops = rows.map((r) => {
      const from = at;
      at += (r.count / total) * 100;
      return `${r.color} ${from}% ${at}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  });

  protected latestUsers = computed(() =>
    [...(this.data().users ?? [])].sort((a, b) => (b.creationDate ?? '').localeCompare(a.creationDate ?? '') || b.id - a.id).slice(0, 5),
  );

  protected quick: { route: string; icon: string; title: I18nKey; text: I18nKey }[] = [
    { route: '/users', icon: 'users', title: 'users', text: 'manageUsers' },
    { route: '/roles', icon: 'shield', title: 'roles', text: 'manageRoles' },
    { route: '/menus', icon: 'list', title: 'menus', text: 'manageMenus' },
    { route: '/countries', icon: 'globe', title: 'settings', text: 'manageSettings' },
  ];

  constructor() {
    forkJoin({
      users: safe(this.api.users.list()),
      roles: safe(this.api.roles.list()),
      menus: safe(this.api.menus.list()),
      countries: safe(this.api.countries.list()),
      cities: safe(this.api.cities.list()),
    }).subscribe((d) => {
      this.data.set(d);
      this.loading.set(false);
    });
  }

  protected roleTitle(code: string | undefined): string {
    return this.data().roles?.find((r) => r.code === code)?.title ?? code ?? '';
  }
}
