import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CLIENT_STATUSES, ClientCounts, ClientDetail, ClientStatus, ClientSummary, Crm } from '../../core/crm';
import { I18n, I18nKey } from '../../core/i18n';
import { Icon } from '../../ui/icon';
import { ClientForm, StatusChip } from '../../ui/crm-ui';
import { ListState, PageHeader } from '../../ui/states';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-crm-clients',
  imports: [RouterLink, DatePipe, Icon, StatusChip, ClientForm, ListState, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header [title]="i18n.t('clients')" [subtitle]="i18n.t('clientsSubtitle')">
      <button type="button" class="btn btn-primary" (click)="creating.set(true)"><app-icon name="plus" />{{ i18n.t('newClient') }}</button>
    </app-page-header>

    <!-- Status tabs with counts -->
    <div class="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist">
      @for (tab of tabs(); track tab.value) {
        <button type="button" role="tab" class="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition"
          [class]="status() === tab.value ? 'border-brand bg-brand text-white shadow-md shadow-brand/25' : 'border-line bg-surface text-body hover:border-slate-400'"
          [attr.aria-selected]="status() === tab.value" (click)="setStatus(tab.value)">
          {{ tab.label }}
          <span class="rounded-md px-1.5 text-xs" [class]="status() === tab.value ? 'bg-white/20' : 'bg-soft'">{{ tab.count ?? '…' }}</span>
        </button>
      }
    </div>

    <div class="card overflow-hidden">
      <div class="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
        <div class="relative flex-1">
          <app-icon name="search" class="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input class="input ps-10" type="search" [placeholder]="i18n.t('search')" [value]="query()" (input)="typed($any($event.target).value)" [attr.aria-label]="i18n.t('search')" />
        </div>
        <select class="input sm:w-52" [value]="sort()" (change)="setSort($any($event.target).value)" [attr.aria-label]="i18n.t('search')">
          <option value="-createdAt">{{ i18n.t('sortNewest') }}</option>
          <option value="name">{{ i18n.t('sortName') }}</option>
        </select>
      </div>

      @if (state() !== 'ready') {
        <app-list-state [state]="state()" (retry)="load()" />
      } @else {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>{{ i18n.t('companyName') }}</th>
                <th class="hidden sm:table-cell">{{ i18n.t('status') }}</th>
                <th class="hidden md:table-cell">{{ i18n.t('city') }}</th>
                <th class="hidden lg:table-cell">{{ i18n.t('contacts') }}</th>
                <th class="hidden lg:table-cell">{{ i18n.t('owner') }}</th>
                <th class="hidden xl:table-cell">{{ i18n.t('createdOn') }}</th>
              </tr>
            </thead>
            <tbody>
              @for (c of items(); track c.id) {
                <tr class="cursor-pointer" (click)="open(c)">
                  <td>
                    <div class="flex items-center gap-3">
                      <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand/15 to-brand-2/15 text-sm font-bold text-brand dark:text-indigo-300">{{ initials(c.name) }}</span>
                      <div class="min-w-0">
                        <a [routerLink]="['/crm/clients', c.id]" class="block truncate font-semibold text-strong hover:text-brand" (click)="$event.stopPropagation()">{{ c.name }}</a>
                        <p class="truncate text-muted">{{ c.sector || '—' }}</p>
                        <span class="mt-1 inline-block sm:hidden"><app-status-chip [status]="c.status" /></span>
                      </div>
                    </div>
                  </td>
                  <td class="hidden sm:table-cell"><app-status-chip [status]="c.status" /></td>
                  <td class="hidden text-body md:table-cell">{{ c.city?.label || '—' }}@if (c.country) { <span class="text-muted">, {{ c.country }}</span> }</td>
                  <td class="hidden lg:table-cell"><span class="chip"><app-icon name="users" [size]="13" />{{ c.contacts }}</span></td>
                  <td class="hidden text-body lg:table-cell">{{ c.owner?.label || '—' }}</td>
                  <td class="hidden text-muted xl:table-cell">{{ c.createdAt | date: 'mediumDate' : undefined : i18n.lang() }}</td>
                </tr>
              } @empty {
                <tr><td colspan="6"><app-list-state state="empty" /></td></tr>
              }
            </tbody>
          </table>
        </div>
        <div class="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-muted">
          <span>{{ total() }} {{ i18n.t('total') }}</span>
          @if (pages() > 1) {
            <div class="flex items-center gap-2">
              <button type="button" class="btn btn-ghost min-h-9 px-3" [disabled]="page() === 0" (click)="go(page() - 1)"><app-icon name="chevron" [size]="16" class="rotate-180 rtl:rotate-0" />{{ i18n.t('previous') }}</button>
              <span>{{ i18n.t('pageOf', { page: '' + (page() + 1), pages: '' + pages() }) }}</span>
              <button type="button" class="btn btn-ghost min-h-9 px-3" [disabled]="page() + 1 >= pages()" (click)="go(page() + 1)">{{ i18n.t('next') }}<app-icon name="chevron" [size]="16" class="rtl:rotate-180" /></button>
            </div>
          }
        </div>
      }
    </div>

    @if (creating()) {
      <app-client-form (closed)="creating.set(false)" (saved)="created($event)" />
    }
  `,
})
export class CrmClientsPage {
  protected i18n = inject(I18n);
  private crm = inject(Crm);
  private router = inject(Router);

  protected items = signal<ClientSummary[]>([]);
  protected total = signal(0);
  protected counts = signal<ClientCounts | null>(null);
  protected state = signal<'loading' | 'error' | 'ready'>('loading');
  protected query = signal('');
  protected status = signal<ClientStatus | ''>('');
  protected sort = signal('-createdAt');
  protected page = signal(0);
  protected creating = signal(false);
  protected pages = computed(() => Math.max(1, Math.ceil(this.total() / PAGE_SIZE)));

  protected tabs = computed(() => {
    const c = this.counts();
    const key = (s: ClientStatus) => ('status' + s) as I18nKey;
    return [
      { value: '' as const, label: this.i18n.t('allStatuses'), count: c?.total },
      ...CLIENT_STATUSES.map((s) => ({
        value: s,
        label: this.i18n.t(key(s)),
        count: c ? { PROSPECT: c.prospects, CLIENT: c.clients, LOST: c.lost }[s] : undefined,
      })),
    ];
  });

  private search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => {
      this.page.set(0);
      this.load();
    });
    this.load();
    this.loadCounts();
  }

  load(): void {
    this.state.set('loading');
    this.crm.clients({ q: this.query(), status: this.status(), page: this.page(), size: PAGE_SIZE, sort: this.sort() }).subscribe({
      next: (p) => {
        this.items.set(p.items);
        this.total.set(p.total);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  private loadCounts(): void {
    this.crm.clientCounts().subscribe({ next: (c) => this.counts.set(c), error: () => {} });
  }

  protected typed(value: string): void {
    this.query.set(value);
    this.search$.next(value);
  }
  protected setStatus(value: ClientStatus | ''): void {
    this.status.set(value);
    this.page.set(0);
    this.load();
  }
  protected setSort(value: string): void {
    this.sort.set(value);
    this.page.set(0);
    this.load();
  }
  protected go(page: number): void {
    this.page.set(page);
    this.load();
  }
  protected open(c: ClientSummary): void {
    this.router.navigate(['/crm/clients', c.id]);
  }
  protected created(c: ClientDetail): void {
    this.creating.set(false);
    this.router.navigate(['/crm/clients', c.id]);
  }
  protected initials(name: string): string {
    return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }
}
