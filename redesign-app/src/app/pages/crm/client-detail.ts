import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api';
import { Activity, ClientDetail, Contact, Crm, CrmRights, HistoryEntry, Opportunity, STAGE_TONE, formatMad } from '../../core/crm';
import { I18n } from '../../core/i18n';
import { Confirm, Toasts } from '../../core/toast';
import { ActivityForm, ActivityItem, ClientForm, StatusChip } from '../../ui/crm-ui';
import { Icon } from '../../ui/icon';
import { Modal } from '../../ui/modal';
import { HistoryList } from '../../ui/history-ui';
import { OpportunityForm, stageKey } from '../../ui/pipeline-ui';
import { ListState } from '../../ui/states';

@Component({
  selector: 'app-crm-client-detail',
  imports: [RouterLink, DatePipe, ReactiveFormsModule, Icon, Modal, StatusChip, ClientForm, ActivityForm, ActivityItem, ListState, OpportunityForm, HistoryList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a routerLink="/crm/clients" class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-strong">
      <app-icon name="arrowLeft" [size]="16" class="rtl:rotate-180" />{{ i18n.t('backToClients') }}
    </a>

    @if (state() !== 'ready') {
      <div class="card"><app-list-state [state]="state()" (retry)="load()" /></div>
    } @else if (client(); as c) {
      <!-- Header -->
      <section class="card animate-rise mb-6 p-6">
        <div class="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span class="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-2 text-xl font-bold text-white">{{ initials(c.name) }}</span>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-3">
              <h1 class="text-2xl font-bold tracking-tight text-strong sm:text-3xl">{{ c.name }}</h1>
              <app-status-chip [status]="c.status" />
            </div>
            <p class="mt-1 text-muted">{{ c.sector || '—' }}@if (c.city) { · {{ c.city.label }}@if (c.country) {, {{ c.country }}} }</p>
            <div class="mt-4 flex flex-wrap gap-2">
              @if (c.phone) { <a class="btn btn-ghost min-h-10" [href]="'tel:' + c.phone"><app-icon name="phone" [size]="16" /><span dir="ltr">{{ c.phone }}</span></a> }
              @if (c.email) { <a class="btn btn-ghost min-h-10 max-w-full" [href]="'mailto:' + c.email"><app-icon name="mail" [size]="16" /><span class="truncate" dir="ltr">{{ c.email }}</span></a> }
              @if (c.website) { <a class="btn btn-ghost min-h-10" [href]="c.website" target="_blank" rel="noopener"><app-icon name="globeLink" [size]="16" />{{ i18n.t('website') }}</a> }
            </div>
          </div>
          <div class="flex gap-2">
            @if (rights.canEdit()) {
              <button type="button" class="btn btn-primary" (click)="editing.set(true)"><app-icon name="edit" [size]="16" />{{ i18n.t('edit') }}</button>
            }
            @if (rights.canDeleteClient()) {
              <button type="button" class="icon-btn border border-line hover:!bg-rose-50 hover:!text-rose-600 dark:hover:!bg-rose-500/10" (click)="remove(c)" [attr.aria-label]="i18n.t('delete') + ' ' + c.name"><app-icon name="trash" /></button>
            }
          </div>
        </div>
        <dl class="mt-6 grid gap-4 border-t border-line pt-5 text-sm sm:grid-cols-3">
          <div><dt class="text-muted">{{ i18n.t('owner') }}</dt><dd class="mt-0.5 font-medium text-strong">{{ c.owner?.label || '—' }}</dd></div>
          <div><dt class="text-muted">{{ i18n.t('address') }}</dt><dd class="mt-0.5 font-medium text-strong">{{ c.address || '—' }}</dd></div>
          <div><dt class="text-muted">{{ i18n.t('createdOn') }}</dt><dd class="mt-0.5 font-medium text-strong">{{ c.createdAt | date: 'longDate' : undefined : i18n.lang() }}</dd></div>
          @if (c.notes) {
            <div class="sm:col-span-3"><dt class="text-muted">{{ i18n.t('notes') }}</dt><dd class="mt-0.5 whitespace-pre-line text-body">{{ c.notes }}</dd></div>
          }
        </dl>
      </section>

      <div class="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <!-- Contacts -->
        <section class="card self-start">
          <div class="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 class="font-semibold text-strong">{{ i18n.t('contacts') }} <span class="font-normal text-muted">({{ c.contacts.length }})</span></h2>
            @if (rights.canEdit()) {
        <button type="button" class="btn btn-ghost min-h-9 px-3" (click)="openContact(null)"><app-icon name="plus" [size]="16" />{{ i18n.t('add') }}</button>
      }
          </div>
          <ul class="px-2 pb-2">
            @for (p of c.contacts; track p.id) {
              <li class="group flex items-start gap-3 rounded-2xl px-3 py-3 hover:bg-soft/60">
                <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-soft text-sm font-bold text-strong">{{ initials((p.firstName ?? '') + ' ' + p.lastName) }}</span>
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-strong">{{ p.firstName }} {{ p.lastName }}
                    @if (p.primary) { <span class="ms-1 inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 align-middle text-[11px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"><app-icon name="star" [size]="11" />{{ i18n.t('primaryContact') }}</span> }
                  </p>
                  <p class="text-sm text-muted">{{ p.jobTitle || '—' }}</p>
                  <p class="mt-1 flex flex-wrap gap-x-3 text-sm">
                    @if (p.phone) { <a [href]="'tel:' + p.phone" class="text-body hover:text-brand" dir="ltr">{{ p.phone }}</a> }
                    @if (p.email) { <a [href]="'mailto:' + p.email" class="truncate text-body hover:text-brand" dir="ltr">{{ p.email }}</a> }
                  </p>
                </div>
                <div class="flex shrink-0 gap-1 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  @if (rights.canEdit()) {
                  <button type="button" class="icon-btn size-9" (click)="openContact(p)" [attr.aria-label]="i18n.t('edit') + ' ' + p.lastName"><app-icon name="edit" [size]="16" /></button>
                  <button type="button" class="icon-btn size-9 hover:!bg-rose-50 hover:!text-rose-600 dark:hover:!bg-rose-500/10" (click)="removeContact(p)" [attr.aria-label]="i18n.t('delete') + ' ' + p.lastName"><app-icon name="trash" [size]="16" /></button>
                  }
                </div>
              </li>
            } @empty {
              <li class="px-3 py-6 text-center text-muted">{{ i18n.t('noContacts') }}</li>
            }
          </ul>
        </section>

        <!-- Activities -->
        <section class="card self-start overflow-hidden">
          <div class="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 class="font-semibold text-strong">{{ i18n.t('activities') }} <span class="font-normal text-muted">({{ activities().length }})</span></h2>
            @if (rights.canEdit()) {
        <button type="button" class="btn btn-primary min-h-9 px-3" (click)="openActivity(null)"><app-icon name="plus" [size]="16" />{{ i18n.t('newActivity') }}</button>
      }
          </div>
          <div class="divide-y divide-line border-t border-line">
            @for (a of activities(); track a.id) {
              <app-activity-item [activity]="a" [showClient]="false" (toggle)="toggle($event)" (edit)="openActivity($event)" (remove)="removeActivity($event)" />
            } @empty {
              <p class="px-5 py-8 text-center text-muted">{{ i18n.t('noActivities') }}</p>
            }
          </div>
        </section>
      </div>

      <!-- Opportunities -->
      <section class="card mt-6 overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-2 px-5 pt-5 pb-3">
          <div>
            <h2 class="font-semibold text-strong">{{ i18n.t('opportunities') }} <span class="font-normal text-muted">({{ opportunities().length }})</span></h2>
            @if (openAmount() > 0) { <p class="text-sm text-muted">{{ i18n.t('openPipeline') }} : <span class="font-semibold text-strong tabular-nums">{{ money(openAmount()) }}</span></p> }
          </div>
          @if (rights.canEdit()) {
            <button type="button" class="btn btn-primary min-h-9 px-3" (click)="opportunityEditing.set(null)"><app-icon name="plus" [size]="16" />{{ i18n.t('newOpportunity') }}</button>
          }
        </div>
        <ul class="divide-y divide-line border-t border-line">
          @for (o of opportunities(); track o.id) {
            <li class="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3">
              <button type="button" class="min-w-0 flex-1 basis-48 truncate text-start font-medium text-strong hover:text-brand disabled:hover:text-strong"
                [disabled]="!rights.canEdit()" (click)="opportunityEditing.set(o)">{{ o.title }}</button>
              <span class="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold" [class]="stageTone[o.stage]">{{ i18n.t(stageKey(o.stage)) }}</span>
              <span class="w-32 text-end font-semibold text-strong tabular-nums">{{ money(o.amount) }}</span>
              <span class="w-24 text-end text-sm text-muted" [class.!text-rose-600]="o.overdue">{{ o.expectedClose ? (o.expectedClose | date: 'd MMM y' : undefined : i18n.lang()) : '—' }}</span>
            </li>
          } @empty {
            <li class="px-5 py-8 text-center text-muted">{{ i18n.t('noOpportunities') }}</li>
          }
        </ul>
      </section>
      <!-- History -->
      <section class="card mt-6 p-5 sm:p-6">
        <div class="mb-5 flex items-center justify-between gap-2">
          <h2 class="font-semibold text-strong">{{ i18n.t('history') }} <span class="font-normal text-muted">({{ historyTotal() }})</span></h2>
          <button type="button" class="icon-btn size-9" (click)="loadHistory(true)" [attr.aria-label]="i18n.t('refresh')"><app-icon name="clock" [size]="16" /></button>
        </div>
        @if (historyItems().length) {
          <app-history-list [items]="historyItems()" [showClient]="false" />
          @if (historyItems().length < historyTotal()) {
            <div class="mt-5 text-center"><button type="button" class="btn btn-ghost min-h-9 px-3" (click)="loadHistory(false)">{{ i18n.t('showMore') }}</button></div>
          }
        } @else {
          <p class="py-4 text-center text-muted">{{ i18n.t('noHistory') }}</p>
        }
      </section>

      @if (opportunityEditing() !== undefined) {
        <app-opportunity-form [opportunity]="opportunityEditing()!" [fixedClient]="c.id" [contacts]="c.contacts"
          (closed)="opportunityEditing.set(undefined)" (saved)="opportunitySaved()" />
      }

      @if (editing()) {
        <app-client-form [client]="c" (closed)="editing.set(false)" (saved)="client.set($event); editing.set(false); loadHistory(true)" />
      }
      @if (activityEditing() !== undefined) {
        <app-activity-form [activity]="activityEditing()!" [fixedClient]="c.id" [contacts]="c.contacts" (closed)="activityEditing.set(undefined)" (saved)="activitySaved()" />
      }
      @if (contactEditing() !== undefined) {
        <app-modal [title]="contactEditing() ? i18n.t('editContact') : i18n.t('newContact')" (closed)="contactEditing.set(undefined)">
          <form id="contact-form" [formGroup]="contactForm" (ngSubmit)="saveContact(c)" novalidate class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="label" for="ct-first">{{ i18n.t('firstName') }}</label>
              <input id="ct-first" class="input" formControlName="firstName" />
            </div>
            <div>
              <label class="label" for="ct-last">{{ i18n.t('lastName') }}</label>
              <input id="ct-last" class="input" formControlName="lastName" />
              @if (contactForm.controls.lastName.touched && contactForm.controls.lastName.invalid) { <p class="field-error">{{ i18n.t('required') }}</p> }
            </div>
            <div class="sm:col-span-2">
              <label class="label" for="ct-job">{{ i18n.t('jobTitle') }}</label>
              <input id="ct-job" class="input" formControlName="jobTitle" />
            </div>
            <div>
              <label class="label" for="ct-email">{{ i18n.t('email') }}</label>
              <input id="ct-email" class="input" type="email" formControlName="email" dir="ltr" />
              @if (contactForm.controls.email.touched && contactForm.controls.email.invalid) { <p class="field-error">{{ i18n.t('invalidEmail') }}</p> }
            </div>
            <div>
              <label class="label" for="ct-phone">{{ i18n.t('phone') }}</label>
              <input id="ct-phone" class="input" type="tel" formControlName="phone" dir="ltr" />
            </div>
            <label class="flex items-center gap-3 text-sm font-medium text-strong sm:col-span-2">
              <input type="checkbox" class="size-4.5 accent-brand" formControlName="primary" />{{ i18n.t('primaryContact') }}
            </label>
          </form>
          <ng-container modal-actions>
            <button type="button" class="btn btn-ghost" (click)="contactEditing.set(undefined)">{{ i18n.t('cancel') }}</button>
            <button type="submit" form="contact-form" class="btn btn-primary" [disabled]="saving()">
              @if (saving()) { <app-icon name="loader" class="animate-spin" />{{ i18n.t('saving') }} } @else { <app-icon name="check" />{{ i18n.t('save') }} }
            </button>
          </ng-container>
        </app-modal>
      }
    }
  `,
})
export class CrmClientDetailPage {
  protected i18n = inject(I18n);
  protected rights = inject(CrmRights);
  private crm = inject(Crm);
  private router = inject(Router);
  private toasts = inject(Toasts);
  private confirm = inject(Confirm);

  /** Route parameter :id. */
  readonly id = input.required<string>();

  protected client = signal<ClientDetail | null>(null);
  protected activities = signal<Activity[]>([]);
  protected opportunities = signal<Opportunity[]>([]);
  protected historyItems = signal<HistoryEntry[]>([]);
  protected historyTotal = signal(0);
  private historyPage = 0;
  /** undefined = closed, null = new opportunity. */
  protected opportunityEditing = signal<Opportunity | null | undefined>(undefined);
  protected openAmount = computed(() =>
    this.opportunities().filter((o) => o.stage !== 'WON' && o.stage !== 'LOST').reduce((sum, o) => sum + o.amount, 0),
  );
  protected stageTone = STAGE_TONE;
  protected stageKey = stageKey;
  protected money = (v: number) => formatMad(v, this.i18n.lang());
  protected state = signal<'loading' | 'error' | 'ready'>('loading');
  protected editing = signal(false);
  protected activityEditing = signal<Activity | null | undefined>(undefined);
  protected contactEditing = signal<Contact | null | undefined>(undefined);
  protected saving = signal(false);

  protected contactForm = inject(FormBuilder).nonNullable.group({
    firstName: [''],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    jobTitle: [''],
    email: ['', Validators.email],
    phone: [''],
    primary: [false],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = Number(this.id());
    this.state.set('loading');
    this.crm.client(id).subscribe({
      next: (c) => {
        this.client.set(c);
        this.state.set('ready');
        this.loadActivities();
        this.loadOpportunities();
      },
      error: () => this.state.set('error'),
    });
  }

  /** Activities, and the history that goes with them. */
  private loadActivities(): void {
    this.crm.activities({ clientId: Number(this.id()), size: 100 }).subscribe({ next: (p) => this.activities.set(p.items), error: () => {} });
    this.loadHistory(true);
  }

  /** First page (reset) or the next one. */
  protected loadHistory(reset: boolean): void {
    this.historyPage = reset ? 0 : this.historyPage + 1;
    this.crm.clientHistory(Number(this.id()), this.historyPage, 10).subscribe({
      next: (p) => {
        this.historyItems.update((list) => (reset ? p.items : [...list, ...p.items]));
        this.historyTotal.set(p.total);
      },
      error: () => {},
    });
  }

  private loadOpportunities(): void {
    this.crm.opportunities({ clientId: Number(this.id()) }).subscribe({ next: (list) => this.opportunities.set(list), error: () => {} });
  }

  /** Winning a deal can turn the prospect into a client, so the client is reloaded too. */
  protected opportunitySaved(): void {
    this.opportunityEditing.set(undefined);
    this.loadOpportunities();
    this.reloadClient();
  }

  private reloadClient(): void {
    this.crm.client(Number(this.id())).subscribe({ next: (c) => this.client.set(c), error: () => {} });
    this.loadHistory(true);
  }

  protected initials(name: string): string {
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }

  protected async remove(c: ClientDetail): Promise<void> {
    if (!(await this.confirm.ask(this.i18n.t('confirmDelete'), this.i18n.t('confirmDeleteText', { name: c.name })))) return;
    this.crm.deleteClient(c.id).subscribe({
      next: () => {
        this.toasts.success(this.i18n.t('deleted'));
        this.router.navigateByUrl('/crm/clients');
      },
      error: (err) => this.toasts.error(errorMessage(err) ?? this.i18n.t('deleteError')),
    });
  }

  protected openContact(p: Contact | null): void {
    this.contactForm.reset({
      firstName: p?.firstName ?? '',
      lastName: p?.lastName ?? '',
      jobTitle: p?.jobTitle ?? '',
      email: p?.email ?? '',
      phone: p?.phone ?? '',
      primary: p?.primary ?? !this.client()?.contacts.length,
    });
    this.contactEditing.set(p);
  }

  protected saveContact(c: ClientDetail): void {
    this.contactForm.markAllAsTouched();
    if (this.contactForm.invalid || this.saving()) return;
    const v = this.contactForm.getRawValue();
    const body = {
      firstName: v.firstName.trim() || null,
      lastName: v.lastName.trim(),
      jobTitle: v.jobTitle.trim() || null,
      email: v.email.trim() || null,
      phone: v.phone.trim() || null,
      primary: v.primary,
    };
    const current = this.contactEditing();
    this.saving.set(true);
    (current ? this.crm.updateContact(current.id, body) : this.crm.addContact(c.id, body)).subscribe({
      next: () => {
        this.saving.set(false);
        this.contactEditing.set(undefined);
        this.toasts.success(this.i18n.t('saved'));
        this.reloadClient();
      },
      error: (err) => {
        this.saving.set(false);
        this.toasts.error(errorMessage(err) ?? this.i18n.t('saveError'));
      },
    });
  }

  protected async removeContact(p: Contact): Promise<void> {
    const name = `${p.firstName ?? ''} ${p.lastName}`.trim();
    if (!(await this.confirm.ask(this.i18n.t('confirmDelete'), this.i18n.t('confirmDeleteText', { name })))) return;
    this.crm.deleteContact(p.id).subscribe({
      next: () => {
        this.toasts.success(this.i18n.t('deleted'));
        this.reloadClient();
      },
      error: (err) => this.toasts.error(errorMessage(err) ?? this.i18n.t('deleteError')),
    });
  }

  protected openActivity(a: Activity | null): void {
    this.activityEditing.set(a);
  }

  protected activitySaved(): void {
    this.activityEditing.set(undefined);
    this.loadActivities();
  }

  protected toggle(a: Activity): void {
    this.crm.setDone(a.id, !a.done).subscribe({
      next: (updated) => {
        this.activities.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
        this.loadHistory(true);
      },
      error: (err) => this.toasts.error(errorMessage(err) ?? this.i18n.t('saveError')),
    });
  }

  protected async removeActivity(a: Activity): Promise<void> {
    if (!(await this.confirm.ask(this.i18n.t('confirmDelete'), this.i18n.t('confirmDeleteText', { name: a.subject })))) return;
    this.crm.deleteActivity(a.id).subscribe({
      next: () => {
        this.toasts.success(this.i18n.t('deleted'));
        this.activities.update((list) => list.filter((x) => x.id !== a.id));
        this.loadHistory(true);
      },
      error: (err) => this.toasts.error(errorMessage(err) ?? this.i18n.t('deleteError')),
    });
  }
}
