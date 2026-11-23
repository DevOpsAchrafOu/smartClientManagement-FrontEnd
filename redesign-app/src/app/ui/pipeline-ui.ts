import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../core/api';
import {
  Contact, Crm, CrmRights, Opportunity, OpportunityStage, Ref, STAGE_COLOR, STAGE_PROBABILITY, STAGES, formatMad,
} from '../core/crm';
import { I18n, I18nKey } from '../core/i18n';
import { Toasts } from '../core/toast';
import { Icon } from './icon';
import { Modal } from './modal';

export const stageKey = (s: OpportunityStage) => ('stage' + s) as I18nKey;

/** One opportunity on the board: drag it to another column, or use its stage menu (keyboard and touch). */
@Component({
  selector: 'app-opportunity-card',
  imports: [Icon, DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let o = opportunity();
    <article class="group rounded-xl border border-line bg-surface p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:hover:border-slate-600"
      [class.cursor-grab]="rights.canEdit()" [attr.draggable]="rights.canEdit()" (dragstart)="dragStart($event)">
      <div class="flex items-start gap-2">
        <button type="button" class="min-w-0 flex-1 text-start font-medium leading-snug text-strong hover:text-brand disabled:hover:text-strong"
          [disabled]="!rights.canEdit()" (click)="edit.emit(o)">{{ o.title }}</button>
        <span class="shrink-0 rounded-md bg-soft px-1.5 py-0.5 text-[11px] font-semibold text-muted tabular-nums">{{ o.probability }}%</span>
      </div>
      <a [routerLink]="['/crm/clients', o.client.id]" class="mt-1 block truncate text-sm text-body hover:text-brand hover:underline">{{ o.client.label }}</a>
      <p class="mt-2 text-base font-bold text-strong tabular-nums">{{ money(o.amount) }}</p>
      <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        @if (o.stage === 'WON' || o.stage === 'LOST') {
          @if (o.closedAt) { <span class="inline-flex items-center gap-1"><app-icon name="check" [size]="12" />{{ o.closedAt | date: 'd MMM' : undefined : i18n.lang() }}</span> }
          @if (o.lostReason) { <span class="truncate" [title]="o.lostReason">{{ o.lostReason }}</span> }
        } @else if (o.expectedClose) {
          <span class="inline-flex items-center gap-1" [class]="o.overdue ? 'font-semibold text-rose-600 dark:text-rose-400' : ''">
            <app-icon name="clock" [size]="12" />{{ o.expectedClose | date: 'd MMM' : undefined : i18n.lang() }}@if (o.overdue) { · {{ i18n.t('overdue') }} }
          </span>
        }
        @if (o.owner) { <span class="inline-flex items-center gap-1"><app-icon name="user" [size]="12" />{{ o.owner.label }}</span> }
      </div>
      @if (rights.canEdit()) {
        <div class="mt-2.5 flex items-center gap-1.5 border-t border-line pt-2.5">
          <select class="h-8 min-w-0 flex-1 rounded-lg border border-line bg-surface px-2 text-xs text-body"
            (change)="move.emit({ opportunity: o, stage: $any($event.target).value })" [attr.aria-label]="i18n.t('moveTo') + ' — ' + o.title">
            @for (s of stages; track s) { <option [value]="s" [selected]="s === o.stage">{{ i18n.t(stageKey(s)) }}</option> }
          </select>
          <button type="button" class="icon-btn size-8 hover:!bg-rose-50 hover:!text-rose-600 dark:hover:!bg-rose-500/10" (click)="remove.emit(o)" [attr.aria-label]="i18n.t('delete') + ' ' + o.title"><app-icon name="trash" [size]="14" /></button>
        </div>
      }
    </article>
  `,
})
export class OpportunityCard {
  protected i18n = inject(I18n);
  protected rights = inject(CrmRights);
  readonly opportunity = input.required<Opportunity>();
  readonly edit = output<Opportunity>();
  readonly remove = output<Opportunity>();
  readonly move = output<{ opportunity: Opportunity; stage: OpportunityStage }>();
  protected stages = STAGES;
  protected stageKey = stageKey;
  protected money = (v: number) => formatMad(v, this.i18n.lang());

  protected dragStart(event: DragEvent): void {
    event.dataTransfer?.setData('text/plain', String(this.opportunity().id));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }
}

/** Create or edit an opportunity. With a fixed client, its contacts can be picked. */
@Component({
  selector: 'app-opportunity-form',
  imports: [ReactiveFormsModule, Modal, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [title]="opportunity() ? i18n.t('editOpportunity') : i18n.t('newOpportunity')" size="lg" (closed)="closed.emit()">
      <form id="opportunity-form" [formGroup]="form" (ngSubmit)="save()" novalidate class="grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label class="label" for="o-title">{{ i18n.t('opportunityTitle') }}</label>
          <input id="o-title" class="input" formControlName="title" />
          @if (form.controls.title.touched && form.controls.title.invalid) { <p class="field-error">{{ i18n.t('required') }}</p> }
        </div>
        @if (!fixedClient()) {
          <div>
            <label class="label" for="o-client">{{ i18n.t('client') }}</label>
            <select id="o-client" class="input" formControlName="clientId">
              <option [ngValue]="null" disabled>{{ i18n.t('chooseClient') }}</option>
              @for (c of clientOptions(); track c.id) { <option [ngValue]="c.id">{{ c.label }}</option> }
            </select>
            @if (form.controls.clientId.touched && form.controls.clientId.invalid) { <p class="field-error">{{ i18n.t('required') }}</p> }
          </div>
        } @else if (contacts().length) {
          <div>
            <label class="label" for="o-contact">{{ i18n.t('contact') }}</label>
            <select id="o-contact" class="input" formControlName="contactId">
              <option [ngValue]="null">{{ i18n.t('noContact') }}</option>
              @for (c of contacts(); track c.id) { <option [ngValue]="c.id">{{ (c.firstName ?? '') + ' ' + c.lastName }}</option> }
            </select>
          </div>
        }
        <div>
          <label class="label" for="o-amount">{{ i18n.t('amountMad') }}</label>
          <input id="o-amount" class="input tabular-nums" type="number" min="0" step="100" formControlName="amount" dir="ltr" />
          @if (form.controls.amount.touched && form.controls.amount.invalid) { <p class="field-error">{{ i18n.t('invalidAmount') }}</p> }
        </div>
        <fieldset class="sm:col-span-2">
          <legend class="label">{{ i18n.t('stage') }}</legend>
          <div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
            @for (s of stages; track s) {
              <button type="button" class="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-medium transition"
                [class]="form.controls.stage.value === s ? 'border-brand bg-brand/10 text-brand dark:text-indigo-300' : 'border-line text-muted hover:text-strong'"
                (click)="pickStage(s)" [attr.aria-pressed]="form.controls.stage.value === s">
                <span class="size-2 shrink-0 rounded-full" [style.background]="color[s]"></span>{{ i18n.t(stageKey(s)) }}
              </button>
            }
          </div>
        </fieldset>
        <div>
          <label class="label" for="o-prob">{{ i18n.t('probability') }} (%)</label>
          <input id="o-prob" class="input tabular-nums" type="number" min="0" max="100" formControlName="probability" dir="ltr"
            [readOnly]="isClosed()" />
        </div>
        <div>
          <label class="label" for="o-close">{{ i18n.t('expectedClose') }}</label>
          <input id="o-close" class="input" type="date" formControlName="expectedClose" />
        </div>
        @if (rights.canAssign()) {
          <div>
            <label class="label" for="o-owner">{{ i18n.t('owner') }}</label>
            <select id="o-owner" class="input" formControlName="ownerId">
              <option [ngValue]="null">{{ i18n.t('ownerMe') }}</option>
              @for (o of owners(); track o.id) { <option [ngValue]="o.id">{{ o.label }}</option> }
            </select>
          </div>
        }
        @if (form.controls.stage.value === 'LOST') {
          <div class="sm:col-span-2">
            <label class="label" for="o-lost">{{ i18n.t('lostReason') }}</label>
            <input id="o-lost" class="input" formControlName="lostReason" />
          </div>
        }
        <div class="sm:col-span-2">
          <label class="label" for="o-notes">{{ i18n.t('notes') }}</label>
          <textarea id="o-notes" class="input min-h-20 py-2.5" formControlName="notes" rows="3"></textarea>
        </div>
      </form>
      <ng-container modal-actions>
        <button type="button" class="btn btn-ghost" (click)="closed.emit()">{{ i18n.t('cancel') }}</button>
        <button type="submit" form="opportunity-form" class="btn btn-primary" [disabled]="saving()">
          @if (saving()) { <app-icon name="loader" class="animate-spin" />{{ i18n.t('saving') }} } @else { <app-icon name="check" />{{ i18n.t('save') }} }
        </button>
      </ng-container>
    </app-modal>
  `,
})
export class OpportunityForm {
  protected i18n = inject(I18n);
  protected rights = inject(CrmRights);
  private crm = inject(Crm);
  private toasts = inject(Toasts);

  /** The opportunity to edit, or null for a new one. */
  readonly opportunity = input<Opportunity | null>(null);
  /** When set, the opportunity is for this client (its contacts can be chosen). */
  readonly fixedClient = input<number | null>(null);
  readonly contacts = input<Contact[]>([]);
  /** Stage of a new opportunity (e.g. the column it is created from). */
  readonly initialStage = input<OpportunityStage>('NEW');
  readonly saved = output<Opportunity>();
  readonly closed = output<void>();

  protected stages = STAGES;
  protected stageKey = stageKey;
  protected color = STAGE_COLOR;
  protected saving = signal(false);
  protected clientOptions = signal<Ref[]>([]);
  protected owners = signal<Ref[]>([]);
  protected isClosed = signal(false);

  protected form = inject(FormBuilder).group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    clientId: [null as number | null, Validators.required],
    contactId: [null as number | null],
    amount: [0 as number | null, [Validators.min(0), Validators.max(999_999_999_999)]],
    stage: ['NEW' as OpportunityStage],
    probability: [10 as number | null, [Validators.min(0), Validators.max(100)]],
    expectedClose: [''],
    ownerId: [null as number | null],
    lostReason: [''],
    notes: [''],
  });

  ngOnInit(): void {
    const o = this.opportunity();
    const stage = o?.stage ?? this.initialStage();
    this.form.reset({
      title: o?.title ?? '',
      clientId: this.fixedClient() ?? o?.client.id ?? null,
      contactId: o?.contact?.id ?? null,
      amount: o?.amount ?? 0,
      stage,
      probability: o?.probability ?? STAGE_PROBABILITY[stage],
      expectedClose: o?.expectedClose ?? '',
      ownerId: o?.owner?.id ?? null,
      lostReason: o?.lostReason ?? '',
      notes: o?.notes ?? '',
    });
    this.isClosed.set(stage === 'WON' || stage === 'LOST');
    if (!this.fixedClient()) {
      this.crm.clients({ size: 100, sort: 'name' }).subscribe({
        next: (p) => this.clientOptions.set(p.items.map((c) => ({ id: c.id, label: c.name }))),
        error: () => {},
      });
    }
    if (this.rights.canAssign()) {
      this.crm.owners().subscribe({ next: (list) => this.owners.set(list), error: () => {} });
    }
  }

  /** Choosing a stage also proposes its usual probability. */
  protected pickStage(s: OpportunityStage): void {
    this.form.controls.stage.setValue(s);
    this.form.controls.probability.setValue(STAGE_PROBABILITY[s]);
    this.isClosed.set(s === 'WON' || s === 'LOST');
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    const v = this.form.getRawValue();
    const body = {
      title: v.title!.trim(),
      clientId: this.fixedClient() ?? v.clientId!,
      contactId: this.fixedClient() ? v.contactId : null,
      ownerId: this.rights.canAssign() ? v.ownerId : null,
      stage: v.stage!,
      amount: v.amount ?? 0,
      probability: v.probability,
      expectedClose: v.expectedClose || null,
      lostReason: v.stage === 'LOST' ? v.lostReason?.trim() || null : null,
      notes: v.notes?.trim() || null,
    };
    const current = this.opportunity();
    this.saving.set(true);
    (current ? this.crm.updateOpportunity(current.id, body) : this.crm.createOpportunity(body)).subscribe({
      next: (o) => {
        this.saving.set(false);
        this.toasts.success(this.i18n.t('saved'));
        this.saved.emit(o);
      },
      error: (err) => {
        this.saving.set(false);
        this.toasts.error(errorMessage(err) ?? this.i18n.t('saveError'));
      },
    });
  }
}
