import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api';
import { Activity, Crm, CrmDashboard, CrmRights } from '../../core/crm';
import { I18n, I18nKey } from '../../core/i18n';
import { Confirm, Toasts } from '../../core/toast';
import { ActivityForm, ActivityItem } from '../../ui/crm-ui';
import { Icon } from '../../ui/icon';
import { ListState, PageHeader } from '../../ui/states';

@Component({
  selector: 'app-crm-dashboard',
  imports: [RouterLink, Icon, ActivityItem, ActivityForm, ListState, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header [title]="i18n.t('crmDashboard')" [subtitle]="i18n.t('crmIntro')">
      <div class="flex gap-2">
        <a routerLink="/crm/clients" class="btn btn-ghost"><app-icon name="building" [size]="16" />{{ i18n.t('clients') }}</a>
        @if (rights.canEdit()) {
        <button type="button" class="btn btn-primary" (click)="editing.set(null)"><app-icon name="plus" />{{ i18n.t('newActivity') }}</button>
      }
      </div>
    </app-page-header>
    @if (rights.ownOnly() || rights.readOnly()) {
      <p class="mb-4 flex items-center gap-2 rounded-xl border border-line bg-soft/60 px-3.5 py-2.5 text-sm text-body">
        <app-icon [name]="rights.ownOnly() ? 'user' : 'eye'" [size]="16" class="shrink-0 text-muted" />{{ i18n.t(rights.ownOnly() ? 'scopeOwn' : 'scopeReadOnly') }}
      </p>
    }

    @if (state() !== 'ready') {
      <div class="card"><app-list-state [state]="state()" (retry)="load()" /></div>
    } @else if (data(); as d) {
      <!-- Key figures -->
      <section class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        @for (k of kpis(); track k.key; let i = $index) {
          <a [routerLink]="k.route" [queryParams]="k.query ?? null" class="card group animate-rise p-5 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/5" [style.animation-delay.ms]="i * 50">
            <div class="flex items-center justify-between">
              <span class="grid size-11 place-items-center rounded-2xl" [class]="k.tone"><app-icon [name]="k.icon" /></span>
              @if (k.badge) { <span class="rounded-lg bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{{ k.badge }}</span> }
            </div>
            <p class="mt-4 text-3xl font-bold tracking-tight text-strong">{{ k.value }}</p>
            <p class="mt-0.5 text-sm text-muted">{{ i18n.t(k.key) }}</p>
            @if (k.hint) { <p class="mt-1 text-xs text-muted">{{ k.hint }}</p> }
          </a>
        }
      </section>

      <div class="mt-6 grid gap-6 lg:grid-cols-3">
        <!-- Status split -->
        <section class="card p-6">
          <h2 class="mb-5 font-semibold text-strong">{{ i18n.t('pipelineStatus') }}</h2>
          <div class="flex h-3 overflow-hidden rounded-full bg-soft">
            @for (s of statusBars(); track s.key) { <div class="h-full transition-[width] duration-700" [style.width.%]="s.pct" [style.background]="s.color"></div> }
          </div>
          <ul class="mt-5 space-y-3 text-sm">
            @for (s of statusBars(); track s.key) {
              <li class="flex items-center gap-2.5">
                <span class="size-2.5 rounded-full" [style.background]="s.color"></span>
                <span class="flex-1 text-body">{{ i18n.t(s.key) }}</span>
                <span class="font-semibold text-strong tabular-nums">{{ s.value }}</span>
                <span class="w-10 text-end text-muted tabular-nums">{{ s.pct }}%</span>
              </li>
            }
          </ul>
          <div class="mt-6 rounded-2xl bg-soft p-4">
            <p class="text-sm text-muted">{{ i18n.t('conversion') }}</p>
            <p class="text-2xl font-bold text-strong">{{ d.conversionRate === null ? '—' : d.conversionRate + '%' }}</p>
            <p class="text-xs text-muted">{{ i18n.t('conversionHint') }}</p>
          </div>
        </section>

        <!-- Upcoming -->
        <section class="card overflow-hidden lg:col-span-2">
          <div class="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 class="font-semibold text-strong">{{ i18n.t('upcoming') }}</h2>
            <a routerLink="/crm/activities" class="text-sm font-medium text-brand hover:underline dark:text-indigo-300">{{ i18n.t('seeAllActivities') }}</a>
          </div>
          <div class="divide-y divide-line border-t border-line">
            @for (a of d.upcoming; track a.id) {
              <app-activity-item [activity]="a" (toggle)="toggle($event)" (edit)="editing.set($event)" (remove)="remove($event)" />
            } @empty {
              <p class="px-5 py-8 text-center text-muted">{{ i18n.t('noActivities') }}</p>
            }
          </div>
        </section>

        <!-- By sector / city -->
        @for (block of breakdowns(); track block.title) {
          <section class="card p-6">
            <h2 class="mb-5 font-semibold text-strong">{{ i18n.t(block.title) }}</h2>
            <ul class="space-y-4">
              @for (row of block.rows; track row.label) {
                <li>
                  <div class="mb-1.5 flex justify-between text-sm"><span class="font-medium text-strong">{{ row.label }}</span><span class="text-muted tabular-nums">{{ row.value }}</span></div>
                  <div class="h-2 overflow-hidden rounded-full bg-soft">
                    <div class="h-full rounded-full bg-gradient-to-r from-brand to-brand-2 rtl:bg-gradient-to-l" [style.width.%]="row.pct"></div>
                  </div>
                </li>
              } @empty { <li class="text-muted">{{ i18n.t('noResults') }}</li> }
            </ul>
          </section>
        }

        <!-- By owner -->
        <section class="card p-6">
          <h2 class="mb-4 font-semibold text-strong">{{ i18n.t('byOwner') }}</h2>
          <ul class="space-y-3">
            @for (o of d.byOwner; track o.owner) {
              <li class="flex items-center gap-3">
                <span class="grid size-10 place-items-center rounded-xl bg-soft text-sm font-bold text-strong">{{ initials(o.owner) }}</span>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium text-strong">{{ o.owner }}</p>
                  <p class="text-sm text-muted">{{ o.clients }} {{ i18n.t('clients').toLowerCase() }} · {{ o.openTasks }} {{ i18n.t('openTasks').toLowerCase() }}</p>
                </div>
              </li>
            } @empty { <li class="text-muted">{{ i18n.t('noResults') }}</li> }
          </ul>
        </section>

        <!-- Recent -->
        <section class="card overflow-hidden lg:col-span-3">
          <div class="px-5 pt-5 pb-3"><h2 class="font-semibold text-strong">{{ i18n.t('recentActivities') }}</h2></div>
          <div class="grid divide-y divide-line border-t border-line lg:grid-cols-2 lg:divide-y-0">
            @for (a of d.recent; track a.id) {
              <app-activity-item class="lg:border-b lg:border-line" [activity]="a" (toggle)="toggle($event)" (edit)="editing.set($event)" (remove)="remove($event)" />
            }
          </div>
        </section>
      </div>
    }

    @if (editing() !== undefined) {
      <app-activity-form [activity]="editing()!" (closed)="editing.set(undefined)" (saved)="editing.set(undefined); load()" />
    }
  `,
})
export class CrmDashboardPage {
  protected i18n = inject(I18n);
  protected rights = inject(CrmRights);
  private crm = inject(Crm);
  private toasts = inject(Toasts);
  private confirm = inject(Confirm);

  protected data = signal<CrmDashboard | null>(null);
  protected state = signal<'loading' | 'error' | 'ready'>('loading');
  protected editing = signal<Activity | null | undefined>(undefined);

  protected kpis = computed(() => {
    const d = this.data();
    if (!d) return [];
    return [
      { key: 'clients' as I18nKey, icon: 'building', value: d.clients, route: '/crm/clients', tone: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300', hint: `+${d.newThisMonth} ${this.i18n.t('newThisMonth').toLowerCase()}` },
      { key: 'customers' as I18nKey, icon: 'star', value: d.customers, route: '/crm/clients', tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', hint: `${d.prospects} ${this.i18n.t('prospects').toLowerCase()}` },
      { key: 'openTasks' as I18nKey, icon: 'task', value: d.openActivities, route: '/crm/activities', tone: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', hint: `${d.myOpenActivities} · ${this.i18n.t('myOpenTasks').toLowerCase()}`, badge: d.lateActivities ? `${d.lateActivities} ${this.i18n.t('lateTasks').toLowerCase()}` : '' },
      { key: 'dueToday' as I18nKey, icon: 'calendar', value: d.dueToday, route: '/crm/activities', tone: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', hint: `${d.doneThisWeek} ${this.i18n.t('doneThisWeek').toLowerCase()}` },
    ] as { key: I18nKey; icon: string; value: number; route: string; tone: string; hint?: string; badge?: string; query?: Record<string, string> }[];
  });

  protected statusBars = computed(() => {
    const d = this.data();
    if (!d) return [];
    const total = Math.max(1, d.clients);
    return [
      { key: 'statusCLIENT' as I18nKey, value: d.customers, color: '#10b981' },
      { key: 'statusPROSPECT' as I18nKey, value: d.prospects, color: '#f59e0b' },
      { key: 'statusLOST' as I18nKey, value: d.lost, color: '#94a3b8' },
    ].map((s) => ({ ...s, pct: Math.round((100 * s.value) / total) }));
  });

  protected breakdowns = computed(() => {
    const d = this.data();
    if (!d) return [];
    const rows = (list: { label: string; value: number }[]) => {
      const max = Math.max(1, ...list.map((r) => r.value));
      return list.map((r) => ({ label: r.label || this.i18n.t('other'), value: r.value, pct: Math.max(4, (100 * r.value) / max) }));
    };
    return [
      { title: 'clientsBySector' as I18nKey, rows: rows(d.bySector) },
      { title: 'clientsByCity' as I18nKey, rows: rows(d.byCity) },
    ];
  });

  constructor() {
    this.load();
  }

  load(): void {
    if (!this.data()) this.state.set('loading');
    this.crm.dashboard().subscribe({
      next: (d) => {
        this.data.set(d);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  protected toggle(a: Activity): void {
    this.crm.setDone(a.id, !a.done).subscribe({
      next: () => {
        this.toasts.success(this.i18n.t('saved'));
        this.load();
      },
      error: (err) => this.toasts.error(errorMessage(err) ?? this.i18n.t('saveError')),
    });
  }

  protected async remove(a: Activity): Promise<void> {
    if (!(await this.confirm.ask(this.i18n.t('confirmDelete'), this.i18n.t('confirmDeleteText', { name: a.subject })))) return;
    this.crm.deleteActivity(a.id).subscribe({
      next: () => {
        this.toasts.success(this.i18n.t('deleted'));
        this.load();
      },
      error: (err) => this.toasts.error(errorMessage(err) ?? this.i18n.t('deleteError')),
    });
  }

  protected initials(name: string): string {
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }
}
