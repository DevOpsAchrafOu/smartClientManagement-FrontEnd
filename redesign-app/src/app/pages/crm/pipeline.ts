import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, forkJoin } from 'rxjs';
import { errorMessage } from '../../core/api';
import { Crm, CrmRights, Opportunity, OpportunityStage, PipelineSummary, STAGE_COLOR, STAGES, formatMad } from '../../core/crm';
import { I18n, I18nKey } from '../../core/i18n';
import { Confirm, Toasts } from '../../core/toast';
import { ExportButton } from '../../ui/csv-ui';
import { Icon } from '../../ui/icon';
import { OpportunityCard, OpportunityForm, stageKey } from '../../ui/pipeline-ui';
import { ListState, PageHeader } from '../../ui/states';

/** The sales pipeline: one column per stage; cards move by drag and drop or with their stage menu. */
@Component({
  selector: 'app-crm-pipeline',
  imports: [Icon, ListState, PageHeader, OpportunityCard, OpportunityForm, ExportButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header [title]="i18n.t('pipeline')" [subtitle]="i18n.t('pipelineSubtitle')">
      <div class="flex flex-wrap gap-2">
        <app-export-button [kinds]="['opportunities']" />
        @if (rights.canEdit()) {
          <button type="button" class="btn btn-primary" (click)="create('NEW')"><app-icon name="plus" />{{ i18n.t('newOpportunity') }}</button>
        }
      </div>
    </app-page-header>
    @if (rights.ownOnly() || rights.readOnly()) {
      <p class="mb-4 flex items-center gap-2 rounded-xl border border-line bg-soft/60 px-3.5 py-2.5 text-sm text-body">
        <app-icon [name]="rights.ownOnly() ? 'user' : 'eye'" [size]="16" class="shrink-0 text-muted" />{{ i18n.t(rights.ownOnly() ? 'scopeOwn' : 'scopeReadOnly') }}
      </p>
    }

    @if (summary(); as s) {
      <section class="mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        @for (k of kpis(); track k.key) {
          <div class="card p-4 sm:p-5">
            <p class="flex items-center gap-2 text-sm text-muted"><app-icon [name]="k.icon" [size]="16" />{{ i18n.t(k.key) }}</p>
            <p class="mt-2 text-xl font-bold tracking-tight text-strong tabular-nums sm:text-2xl">{{ k.value }}</p>
            @if (k.hint) { <p class="mt-0.5 text-xs text-muted">{{ k.hint }}</p> }
          </div>
        }
      </section>
    }

    <div class="card mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <app-icon name="search" class="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input class="input ps-10" type="search" [placeholder]="i18n.t('searchOpportunities')" [value]="query()" (input)="typed($any($event.target).value)" [attr.aria-label]="i18n.t('search')" />
      </div>
      <label class="flex min-h-11 items-center gap-2.5 rounded-xl border border-line px-3.5 text-sm font-medium whitespace-nowrap text-strong">
        <input type="checkbox" class="size-4 accent-brand" [checked]="mine()" (change)="setMine($any($event.target).checked)" />{{ i18n.t('mineOnly') }}
      </label>
    </div>

    @if (state() !== 'ready') {
      <div class="card"><app-list-state [state]="state()" (retry)="load()" /></div>
    } @else {
      <!-- The board scrolls sideways inside its own box on small screens. -->
      <div class="-mx-1 overflow-x-auto px-1 pb-3">
        <div class="flex min-w-max gap-3 2xl:grid 2xl:min-w-0 2xl:grid-cols-6">
          @for (col of columns(); track col.stage) {
            <section class="flex w-64 shrink-0 flex-col rounded-2xl border bg-soft/50 transition 2xl:w-auto"
              [class]="dragOver() === col.stage ? 'border-brand bg-brand/5' : 'border-line'"
              (dragover)="over($event, col.stage)" (dragleave)="dragOver.set(null)" (drop)="drop($event, col.stage)"
              [attr.aria-label]="i18n.t(stageKey(col.stage))">
              <header class="flex items-start gap-2 px-3 pt-3 pb-2">
                <span class="mt-1.5 size-2.5 shrink-0 rounded-full" [style.background]="color[col.stage]"></span>
                <div class="min-w-0 flex-1">
                  <h2 class="text-sm leading-snug font-semibold text-strong">{{ i18n.t(stageKey(col.stage)) }}
                    <span class="ms-1 rounded-md bg-surface px-1.5 py-0.5 text-xs font-medium text-muted tabular-nums">{{ col.items.length }}</span>
                  </h2>
                  <p class="text-xs text-muted tabular-nums">{{ money(col.total, true) }}</p>
                </div>
                @if (rights.canEdit() && col.stage !== 'WON' && col.stage !== 'LOST') {
                  <button type="button" class="icon-btn size-8" (click)="create(col.stage)" [attr.aria-label]="i18n.t('newOpportunity') + ' — ' + i18n.t(stageKey(col.stage))"><app-icon name="plus" [size]="16" /></button>
                }
              </header>
              <div class="flex min-h-24 flex-1 flex-col gap-2 p-2 pt-0">
                @for (o of col.items; track o.id) {
                  <app-opportunity-card [opportunity]="o" (edit)="editing.set($event)" (remove)="remove($event)" (move)="move($event.opportunity, $event.stage)" />
                } @empty {
                  <p class="rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-muted">{{ i18n.t(rights.canEdit() ? 'dropHere' : 'noOpportunities') }}</p>
                }
              </div>
            </section>
          }
        </div>
      </div>
    }

    @if (editing() !== undefined) {
      <app-opportunity-form [opportunity]="editing()!" [initialStage]="newStage()" (closed)="editing.set(undefined)" (saved)="editing.set(undefined); load()" />
    }
  `,
})
export class CrmPipelinePage {
  protected i18n = inject(I18n);
  protected rights = inject(CrmRights);
  private crm = inject(Crm);
  private toasts = inject(Toasts);
  private confirm = inject(Confirm);

  protected color = STAGE_COLOR;
  protected stageKey = stageKey;
  protected items = signal<Opportunity[]>([]);
  protected summary = signal<PipelineSummary | null>(null);
  protected state = signal<'loading' | 'error' | 'ready'>('loading');
  protected query = signal('');
  protected mine = signal(false);
  protected dragOver = signal<OpportunityStage | null>(null);
  /** undefined = closed, null = new opportunity. */
  protected editing = signal<Opportunity | null | undefined>(undefined);
  protected newStage = signal<OpportunityStage>('NEW');

  protected columns = computed(() =>
    STAGES.map((stage) => {
      const items = this.items().filter((o) => o.stage === stage);
      return { stage, items, total: items.reduce((sum, o) => sum + o.amount, 0) };
    }),
  );

  protected kpis = computed(() => {
    const s = this.summary();
    if (!s) return [];
    const list: { key: I18nKey; icon: string; value: string; hint?: string }[] = [
      { key: 'openPipeline', icon: 'briefcase', value: this.money(s.openAmount), hint: this.i18n.t('openDeals', { n: '' + s.openCount }) },
      { key: 'forecast', icon: 'trending', value: this.money(s.weightedAmount), hint: this.i18n.t('forecastHint') },
      { key: 'wonThisMonth', icon: 'star', value: this.money(s.wonThisMonth) },
      {
        key: 'winRate', icon: 'check', value: s.winRate === null ? '—' : s.winRate + '%',
        hint: s.averageWon === null ? undefined : this.i18n.t('averageWon', { amount: this.money(s.averageWon) }),
      },
    ];
    return list;
  });

  private search$ = new Subject<void>();

  constructor() {
    this.search$.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => this.load());
    this.load();
  }

  protected money(value: number, compact = false): string {
    return formatMad(value, this.i18n.lang(), compact);
  }

  load(): void {
    if (!this.items().length) this.state.set('loading');
    forkJoin({
      items: this.crm.opportunities({ mine: this.mine(), q: this.query() }),
      summary: this.crm.pipelineSummary(),
    }).subscribe({
      next: ({ items, summary }) => {
        this.items.set(items);
        this.summary.set(summary);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  protected typed(value: string): void {
    this.query.set(value);
    this.search$.next();
  }
  protected setMine(value: boolean): void {
    this.mine.set(value);
    this.load();
  }
  protected create(stage: OpportunityStage): void {
    this.newStage.set(stage);
    this.editing.set(null);
  }

  protected over(event: DragEvent, stage: OpportunityStage): void {
    if (!this.rights.canEdit()) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.dragOver.set(stage);
  }

  protected drop(event: DragEvent, stage: OpportunityStage): void {
    event.preventDefault();
    this.dragOver.set(null);
    const id = Number(event.dataTransfer?.getData('text/plain'));
    const o = this.items().find((x) => x.id === id);
    if (o) this.move(o, stage);
  }

  /** Moves the card at once, then saves; on error it goes back. */
  protected move(o: Opportunity, stage: OpportunityStage): void {
    if (o.stage === stage) return;
    const before = this.items();
    this.items.update((list) => list.map((x) => (x.id === o.id ? { ...x, stage } : x)));
    this.crm.moveOpportunity(o.id, stage).subscribe({
      next: (updated) => {
        this.items.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
        this.toasts.success(stage === 'WON' ? this.i18n.t('dealWon') : this.i18n.t('saved'));
        this.crm.pipelineSummary().subscribe({ next: (s) => this.summary.set(s), error: () => {} });
      },
      error: (err) => {
        this.items.set(before);
        this.toasts.error(errorMessage(err) ?? this.i18n.t('saveError'));
      },
    });
  }

  protected async remove(o: Opportunity): Promise<void> {
    if (!(await this.confirm.ask(this.i18n.t('confirmDelete'), this.i18n.t('confirmDeleteText', { name: o.title })))) return;
    this.crm.deleteOpportunity(o.id).subscribe({
      next: () => {
        this.toasts.success(this.i18n.t('deleted'));
        this.load();
      },
      error: (err) => this.toasts.error(errorMessage(err) ?? this.i18n.t('deleteError')),
    });
  }
}
