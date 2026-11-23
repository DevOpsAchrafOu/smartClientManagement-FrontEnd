import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime } from 'rxjs';
import { errorMessage } from '../../core/api';
import { ACTIVITY_TYPES, Activity, ActivityType, ActivityView, Crm } from '../../core/crm';
import { I18n, I18nKey } from '../../core/i18n';
import { Confirm, Toasts } from '../../core/toast';
import { ActivityForm, ActivityItem } from '../../ui/crm-ui';
import { Icon } from '../../ui/icon';
import { ListState, PageHeader } from '../../ui/states';

const PAGE_SIZE = 15;
const VIEWS: ActivityView[] = ['OPEN', 'TODAY', 'LATE', 'DONE', 'ALL'];

@Component({
  selector: 'app-crm-activities',
  imports: [Icon, ActivityItem, ActivityForm, ListState, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header [title]="i18n.t('activities')" [subtitle]="i18n.t('activitiesSubtitle')">
      <button type="button" class="btn btn-primary" (click)="editing.set(null)"><app-icon name="plus" />{{ i18n.t('newActivity') }}</button>
    </app-page-header>

    <div class="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist">
      @for (v of views; track v) {
        <button type="button" role="tab" class="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition"
          [class]="view() === v ? 'border-brand bg-brand text-white shadow-md shadow-brand/25' : 'border-line bg-surface text-body hover:border-slate-400'"
          [attr.aria-selected]="view() === v" (click)="setView(v)">
          @if (v === 'LATE') { <span class="size-2 rounded-full bg-rose-500"></span> }
          {{ i18n.t(viewKey(v)) }}
        </button>
      }
    </div>

    <div class="card overflow-hidden">
      <div class="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
        <div class="relative flex-1">
          <app-icon name="search" class="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input class="input ps-10" type="search" [placeholder]="i18n.t('search')" [value]="query()" (input)="typed($any($event.target).value)" [attr.aria-label]="i18n.t('search')" />
        </div>
        <select class="input lg:w-48" [value]="type()" (change)="setType($any($event.target).value)" [attr.aria-label]="i18n.t('type')">
          <option value="">{{ i18n.t('allTypes') }}</option>
          @for (t of types; track t) { <option [value]="t">{{ i18n.t(typeKey(t)) }}</option> }
        </select>
        <label class="flex min-h-11 items-center gap-2.5 rounded-xl border border-line px-3.5 text-sm font-medium whitespace-nowrap text-strong">
          <input type="checkbox" class="size-4 accent-brand" [checked]="mine()" (change)="setMine($any($event.target).checked)" />{{ i18n.t('mineOnly') }}
        </label>
      </div>

      @if (state() !== 'ready') {
        <app-list-state [state]="state()" (retry)="load()" />
      } @else {
        <div class="divide-y divide-line">
          @for (a of items(); track a.id) {
            <app-activity-item [activity]="a" (toggle)="toggle($event)" (edit)="editing.set($event)" (remove)="remove($event)" />
          } @empty {
            <app-list-state state="empty" />
          }
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

    @if (editing() !== undefined) {
      <app-activity-form [activity]="editing()!" (closed)="editing.set(undefined)" (saved)="editing.set(undefined); load()" />
    }
  `,
})
export class CrmActivitiesPage {
  protected i18n = inject(I18n);
  private crm = inject(Crm);
  private toasts = inject(Toasts);
  private confirm = inject(Confirm);

  protected views = VIEWS;
  protected types = ACTIVITY_TYPES;
  protected viewKey = (v: ActivityView) => ('view' + v) as I18nKey;
  protected typeKey = (t: ActivityType) => ('type' + t) as I18nKey;

  protected items = signal<Activity[]>([]);
  protected total = signal(0);
  protected state = signal<'loading' | 'error' | 'ready'>('loading');
  protected view = signal<ActivityView>('OPEN');
  protected type = signal<ActivityType | ''>('');
  protected mine = signal(false);
  protected query = signal('');
  protected page = signal(0);
  /** undefined = closed, null = new activity. */
  protected editing = signal<Activity | null | undefined>(undefined);
  protected pages = computed(() => Math.max(1, Math.ceil(this.total() / PAGE_SIZE)));

  private search$ = new Subject<void>();

  constructor() {
    this.search$.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => this.reset());
    this.load();
  }

  load(): void {
    this.state.set('loading');
    this.crm
      .activities({ view: this.view(), type: this.type(), mine: this.mine(), q: this.query(), page: this.page(), size: PAGE_SIZE })
      .subscribe({
        next: (p) => {
          this.items.set(p.items);
          this.total.set(p.total);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
  }

  private reset(): void {
    this.page.set(0);
    this.load();
  }
  protected setView(v: ActivityView): void {
    this.view.set(v);
    this.reset();
  }
  protected setType(t: ActivityType | ''): void {
    this.type.set(t);
    this.reset();
  }
  protected setMine(value: boolean): void {
    this.mine.set(value);
    this.reset();
  }
  protected typed(value: string): void {
    this.query.set(value);
    this.search$.next();
  }
  protected go(page: number): void {
    this.page.set(page);
    this.load();
  }

  protected toggle(a: Activity): void {
    this.crm.setDone(a.id, !a.done).subscribe({
      next: (updated) => {
        // In the "open" views a finished activity leaves the list (and vice versa).
        const leaves = (this.view() === 'DONE' && !updated.done) || (['OPEN', 'TODAY', 'LATE'].includes(this.view()) && updated.done);
        this.items.update((list) => (leaves ? list.filter((x) => x.id !== updated.id) : list.map((x) => (x.id === updated.id ? updated : x))));
        if (leaves) this.total.update((t) => t - 1);
        this.toasts.success(this.i18n.t('saved'));
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
}
