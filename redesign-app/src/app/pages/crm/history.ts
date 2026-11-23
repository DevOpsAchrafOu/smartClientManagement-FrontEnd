import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Crm, CrmRights, HistoryEntityType, HistoryEntry } from '../../core/crm';
import { I18n, I18nKey } from '../../core/i18n';
import { Icon } from '../../ui/icon';
import { HistoryList } from '../../ui/history-ui';
import { ListState, PageHeader } from '../../ui/states';

const PAGE_SIZE = 25;
const TYPES: (HistoryEntityType | '')[] = ['', 'CLIENT', 'CONTACT', 'OPPORTUNITY', 'ACTIVITY'];

/** The CRM journal: every change, newest first (sales people: their clients and their own actions). */
@Component({
  selector: 'app-crm-history',
  imports: [Icon, HistoryList, ListState, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header [title]="i18n.t('history')" [subtitle]="i18n.t('historySubtitle')" />
    @if (rights.ownOnly()) {
      <p class="mb-4 flex items-center gap-2 rounded-xl border border-line bg-soft/60 px-3.5 py-2.5 text-sm text-body">
        <app-icon name="user" [size]="16" class="shrink-0 text-muted" />{{ i18n.t('historyScopeOwn') }}
      </p>
    }

    <div class="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist">
      @for (t of types; track t) {
        <button type="button" role="tab" class="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition"
          [class]="type() === t ? 'border-brand bg-brand text-white shadow-md shadow-brand/25' : 'border-line bg-surface text-body hover:border-slate-400'"
          [attr.aria-selected]="type() === t" (click)="setType(t)">{{ i18n.t(typeKey(t)) }}</button>
      }
    </div>

    <section class="card p-5 sm:p-6">
      @if (state() !== 'ready') {
        <app-list-state [state]="state()" (retry)="load(true)" />
      } @else if (items().length) {
        <app-history-list [items]="items()" />
        @if (hasMore()) {
          <div class="mt-6 text-center">
            <button type="button" class="btn btn-ghost" [disabled]="loadingMore()" (click)="more()">
              @if (loadingMore()) { <app-icon name="loader" class="animate-spin" /> }{{ i18n.t('showMore') }}
            </button>
          </div>
        }
      } @else {
        <app-list-state state="empty" />
      }
    </section>
  `,
})
export class CrmHistoryPage {
  protected i18n = inject(I18n);
  protected rights = inject(CrmRights);
  private crm = inject(Crm);

  protected types = TYPES;
  protected typeKey = (t: HistoryEntityType | '') => (t ? 'historyType' + t : 'historyAll') as I18nKey;
  protected items = signal<HistoryEntry[]>([]);
  protected total = signal(0);
  protected page = signal(0);
  protected type = signal<HistoryEntityType | ''>('');
  protected state = signal<'loading' | 'error' | 'ready'>('loading');
  protected loadingMore = signal(false);
  protected hasMore = computed(() => this.items().length < this.total());

  constructor() {
    this.load(true);
  }

  load(reset: boolean): void {
    if (reset) {
      this.page.set(0);
      this.state.set('loading');
    }
    this.crm.history({ type: this.type(), page: this.page(), size: PAGE_SIZE }).subscribe({
      next: (p) => {
        this.items.update((list) => (reset ? p.items : [...list, ...p.items]));
        this.total.set(p.total);
        this.state.set('ready');
        this.loadingMore.set(false);
      },
      error: () => {
        this.loadingMore.set(false);
        if (reset) this.state.set('error');
      },
    });
  }

  protected setType(t: HistoryEntityType | ''): void {
    this.type.set(t);
    this.load(true);
  }

  protected more(): void {
    this.loadingMore.set(true);
    this.page.update((p) => p + 1);
    this.load(false);
  }
}
