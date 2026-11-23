import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api, errorMessage } from '../core/api';
import {
  ACTIVITY_ICON, ACTIVITY_TONE, ACTIVITY_TYPES, Activity, ActivityType, CLIENT_STATUSES, ClientDetail, ClientStatus, Contact,
  Crm, CrmRights, Ref, STATUS_TONE, fromLocalInput, toLocalInput,
} from '../core/crm';
import { I18n, I18nKey } from '../core/i18n';
import { City } from '../core/models';
import { Toasts } from '../core/toast';
import { Icon } from './icon';
import { Modal } from './modal';

/** Coloured status chip of a client. */
@Component({
  selector: 'app-status-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold whitespace-nowrap" [class]="tone()">
    <span class="size-1.5 rounded-full bg-current"></span>{{ i18n.t(key()) }}</span>`,
})
export class StatusChip {
  protected i18n = inject(I18n);
  readonly status = input.required<ClientStatus>();
  protected tone = computed(() => STATUS_TONE[this.status()]);
  protected key = computed(() => ('status' + this.status()) as I18nKey);
}

/** One activity: done checkbox, type icon, subject, client, due date, owner. */
@Component({
  selector: 'app-activity-item',
  imports: [Icon, DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let a = activity();
    <div class="group flex items-start gap-3 px-4 py-3 transition hover:bg-soft/60" [class.opacity-60]="a.done">
      <button type="button" class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-2 transition"
        [class]="a.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-line hover:border-emerald-500'"
        [class.pointer-events-none]="!rights.canEdit()" [disabled]="!rights.canEdit()"
        (click)="toggle.emit(a)" [attr.aria-label]="a.done ? i18n.t('markOpen') : i18n.t('markDone')" [attr.aria-pressed]="a.done">
        @if (a.done) { <app-icon name="check" [size]="14" /> }
      </button>
      <span class="grid size-9 shrink-0 place-items-center rounded-xl" [class]="tone[a.type]"><app-icon [name]="icon[a.type]" [size]="16" /></span>
      <div class="min-w-0 flex-1">
        <p class="font-medium text-strong" [class.line-through]="a.done">{{ a.subject }}</p>
        <p class="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span>{{ i18n.t(typeKey(a.type)) }}</span>
          @if (showClient() && a.client) { <a [routerLink]="['/crm/clients', a.client.id]" class="font-medium text-body hover:text-brand hover:underline">{{ a.client.label }}</a> }
          @if (a.contact) { <span>· {{ a.contact.label }}</span> }
          @if (a.dueAt) {
            <span class="inline-flex items-center gap-1" [class]="a.late ? 'font-semibold text-rose-600 dark:text-rose-400' : ''">
              <app-icon name="clock" [size]="13" />{{ a.dueAt | date: 'd MMM, HH:mm' : undefined : i18n.lang() }}
              @if (a.late) { · {{ i18n.t('late') }} }
            </span>
          }
          @if (a.owner) { <span class="inline-flex items-center gap-1"><app-icon name="user" [size]="13" />{{ a.owner.label }}</span> }
        </p>
        @if (a.details) { <p class="mt-1 line-clamp-2 text-sm text-body">{{ a.details }}</p> }
      </div>
      @if (rights.canEdit()) {
        <div class="flex shrink-0 gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <button type="button" class="icon-btn size-9" (click)="edit.emit(a)" [attr.aria-label]="i18n.t('edit') + ' ' + a.subject"><app-icon name="edit" [size]="16" /></button>
          <button type="button" class="icon-btn size-9 hover:!bg-rose-50 hover:!text-rose-600 dark:hover:!bg-rose-500/10" (click)="remove.emit(a)" [attr.aria-label]="i18n.t('delete') + ' ' + a.subject"><app-icon name="trash" [size]="16" /></button>
        </div>
      }
    </div>
  `,
})
export class ActivityItem {
  protected i18n = inject(I18n);
  protected rights = inject(CrmRights);
  readonly activity = input.required<Activity>();
  readonly showClient = input(true);
  readonly toggle = output<Activity>();
  readonly edit = output<Activity>();
  readonly remove = output<Activity>();
  protected icon = ACTIVITY_ICON;
  protected tone = ACTIVITY_TONE;
  protected typeKey = (t: ActivityType) => ('type' + t) as I18nKey;
}

/** Create or edit an activity. With a fixed client, its contacts can be picked. */
@Component({
  selector: 'app-activity-form',
  imports: [ReactiveFormsModule, Modal, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [title]="activity() ? i18n.t('editActivity') : i18n.t('newActivity')" (closed)="closed.emit()">
      <form id="activity-form" [formGroup]="form" (ngSubmit)="save()" novalidate class="space-y-4">
        <fieldset>
          <legend class="label">{{ i18n.t('type') }}</legend>
          <div class="grid grid-cols-5 gap-2">
            @for (t of types; track t) {
              <button type="button" class="flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-xs font-medium transition"
                [class]="form.controls.type.value === t ? 'border-brand bg-brand/10 text-brand dark:text-indigo-300' : 'border-line text-muted hover:text-strong'"
                (click)="form.controls.type.setValue(t)" [attr.aria-pressed]="form.controls.type.value === t">
                <app-icon [name]="icon[t]" [size]="18" />{{ i18n.t(typeKey(t)) }}
              </button>
            }
          </div>
        </fieldset>
        <div>
          <label class="label" for="a-subject">{{ i18n.t('subject') }}</label>
          <input id="a-subject" class="input" formControlName="subject" />
          @if (form.controls.subject.touched && form.controls.subject.invalid) { <p class="field-error">{{ i18n.t('required') }}</p> }
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          @if (!fixedClient()) {
            <div>
              <label class="label" for="a-client">{{ i18n.t('client') }}</label>
              <select id="a-client" class="input" formControlName="clientId">
                <option [ngValue]="null">{{ i18n.t('noClient') }}</option>
                @for (c of clientOptions(); track c.id) { <option [ngValue]="c.id">{{ c.label }}</option> }
              </select>
            </div>
          } @else if (contacts().length) {
            <div>
              <label class="label" for="a-contact">{{ i18n.t('contact') }}</label>
              <select id="a-contact" class="input" formControlName="contactId">
                <option [ngValue]="null">{{ i18n.t('noContact') }}</option>
                @for (c of contacts(); track c.id) { <option [ngValue]="c.id">{{ (c.firstName ?? '') + ' ' + c.lastName }}</option> }
              </select>
            </div>
          }
          <div>
            <label class="label" for="a-due">{{ i18n.t('dueAt') }}</label>
            <input id="a-due" class="input" type="datetime-local" formControlName="dueAt" />
          </div>
          @if (rights.canAssign()) {
            <div>
              <label class="label" for="a-owner">{{ i18n.t('owner') }}</label>
              <select id="a-owner" class="input" formControlName="ownerId">
                <option [ngValue]="null">{{ i18n.t('ownerMe') }}</option>
                @for (o of owners(); track o.id) { <option [ngValue]="o.id">{{ o.label }}</option> }
              </select>
            </div>
          }
        </div>
        <div>
          <label class="label" for="a-details">{{ i18n.t('details') }}</label>
          <textarea id="a-details" class="input min-h-24 py-2.5" formControlName="details" rows="3"></textarea>
        </div>
        <label class="flex items-center gap-3 text-sm font-medium text-strong">
          <input type="checkbox" class="size-4.5 accent-emerald-600" formControlName="done" />{{ i18n.t('doneLabel') }}
        </label>
      </form>
      <ng-container modal-actions>
        <button type="button" class="btn btn-ghost" (click)="closed.emit()">{{ i18n.t('cancel') }}</button>
        <button type="submit" form="activity-form" class="btn btn-primary" [disabled]="saving()">
          @if (saving()) { <app-icon name="loader" class="animate-spin" />{{ i18n.t('saving') }} } @else { <app-icon name="check" />{{ i18n.t('save') }} }
        </button>
      </ng-container>
    </app-modal>
  `,
})
export class ActivityForm {
  protected i18n = inject(I18n);
  protected rights = inject(CrmRights);
  private crm = inject(Crm);
  private toasts = inject(Toasts);

  /** The activity to edit, or null for a new one. */
  readonly activity = input<Activity | null>(null);
  /** When set, the activity belongs to this client (its contacts can be chosen). */
  readonly fixedClient = input<number | null>(null);
  readonly contacts = input<Contact[]>([]);
  readonly saved = output<Activity>();
  readonly closed = output<void>();

  protected types = ACTIVITY_TYPES;
  protected icon = ACTIVITY_ICON;
  protected typeKey = (t: ActivityType) => ('type' + t) as I18nKey;
  protected saving = signal(false);
  protected clientOptions = signal<Ref[]>([]);
  protected owners = signal<Ref[]>([]);

  protected form = inject(FormBuilder).group({
    type: ['TASK' as ActivityType, Validators.required],
    subject: ['', [Validators.required, Validators.maxLength(200)]],
    details: [''],
    clientId: [null as number | null],
    contactId: [null as number | null],
    dueAt: [''],
    done: [false],
    ownerId: [null as number | null],
  });

  ngOnInit(): void {
    const a = this.activity();
    this.form.reset({
      type: a?.type ?? 'TASK',
      subject: a?.subject ?? '',
      details: a?.details ?? '',
      clientId: this.fixedClient() ?? a?.client?.id ?? null,
      contactId: a?.contact?.id ?? null,
      dueAt: toLocalInput(a?.dueAt),
      done: a?.done ?? false,
      ownerId: a?.owner?.id ?? null,
    });
    if (this.rights.canAssign()) {
      this.crm.owners().subscribe({ next: (list) => this.owners.set(list), error: () => {} });
    }
    if (!this.fixedClient()) {
      this.crm.clients({ size: 100, sort: 'name' }).subscribe({
        next: (p) => this.clientOptions.set(p.items.map((c) => ({ id: c.id, label: c.name }))),
        error: () => {},
      });
    }
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    const v = this.form.getRawValue();
    const body = {
      type: v.type!,
      subject: v.subject!.trim(),
      details: v.details?.trim() || null,
      clientId: this.fixedClient() ?? v.clientId,
      contactId: this.fixedClient() ? v.contactId : null,
      dueAt: fromLocalInput(v.dueAt ?? ''),
      done: !!v.done,
      ownerId: this.rights.canAssign() ? v.ownerId : null,
    };
    const current = this.activity();
    this.saving.set(true);
    (current ? this.crm.updateActivity(current.id, body) : this.crm.createActivity(body)).subscribe({
      next: (a) => {
        this.saving.set(false);
        this.toasts.success(this.i18n.t('saved'));
        this.saved.emit(a);
      },
      error: (err) => {
        this.saving.set(false);
        this.toasts.error(errorMessage(err) ?? this.i18n.t('saveError'));
      },
    });
  }
}

/** Create or edit a client (company). */
@Component({
  selector: 'app-client-form',
  imports: [ReactiveFormsModule, Modal, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [title]="client() ? i18n.t('editClient') : i18n.t('newClient')" size="lg" (closed)="closed.emit()">
      <form id="client-form" [formGroup]="form" (ngSubmit)="save()" novalidate class="grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label class="label" for="c-name">{{ i18n.t('companyName') }}</label>
          <input id="c-name" class="input" formControlName="name" />
          @if (form.controls.name.touched && form.controls.name.invalid) { <p class="field-error">{{ i18n.t('required') }}</p> }
        </div>
        <div>
          <label class="label" for="c-sector">{{ i18n.t('sector') }}</label>
          <input id="c-sector" class="input" formControlName="sector" />
        </div>
        <fieldset>
          <legend class="label">{{ i18n.t('status') }}</legend>
          <div class="grid grid-cols-3 gap-2">
            @for (s of statuses; track s) {
              <button type="button" class="min-h-11 rounded-xl border px-2 text-sm font-medium transition"
                [class]="form.controls.status.value === s ? 'border-brand bg-brand/10 text-brand dark:text-indigo-300' : 'border-line text-muted hover:text-strong'"
                (click)="form.controls.status.setValue(s)" [attr.aria-pressed]="form.controls.status.value === s">{{ i18n.t(statusKey(s)) }}</button>
            }
          </div>
        </fieldset>
        <div>
          <label class="label" for="c-email">{{ i18n.t('email') }}</label>
          <input id="c-email" class="input" type="email" formControlName="email" dir="ltr" />
          @if (form.controls.email.touched && form.controls.email.invalid) { <p class="field-error">{{ i18n.t('invalidEmail') }}</p> }
        </div>
        <div>
          <label class="label" for="c-phone">{{ i18n.t('phone') }}</label>
          <input id="c-phone" class="input" type="tel" formControlName="phone" dir="ltr" />
        </div>
        <div>
          <label class="label" for="c-city">{{ i18n.t('city') }}</label>
          <select id="c-city" class="input" formControlName="cityId">
            <option [ngValue]="null">{{ i18n.t('noCity') }}</option>
            @for (c of cities(); track c.id) { <option [ngValue]="c.id">{{ i18n.label(c) }}</option> }
          </select>
        </div>
        <div>
          <label class="label" for="c-web">{{ i18n.t('website') }}</label>
          <input id="c-web" class="input" formControlName="website" dir="ltr" placeholder="https://" />
        </div>
        @if (rights.canAssign()) {
          <div>
            <label class="label" for="c-owner">{{ i18n.t('owner') }}</label>
            <select id="c-owner" class="input" formControlName="ownerId">
              <option [ngValue]="null">{{ i18n.t('ownerMe') }}</option>
              @for (o of owners(); track o.id) { <option [ngValue]="o.id">{{ o.label }}</option> }
            </select>
          </div>
        }
        <div class="sm:col-span-2">
          <label class="label" for="c-address">{{ i18n.t('address') }}</label>
          <input id="c-address" class="input" formControlName="address" />
        </div>
        <div class="sm:col-span-2">
          <label class="label" for="c-notes">{{ i18n.t('notes') }}</label>
          <textarea id="c-notes" class="input min-h-24 py-2.5" formControlName="notes" rows="3"></textarea>
        </div>
      </form>
      <ng-container modal-actions>
        <button type="button" class="btn btn-ghost" (click)="closed.emit()">{{ i18n.t('cancel') }}</button>
        <button type="submit" form="client-form" class="btn btn-primary" [disabled]="saving()">
          @if (saving()) { <app-icon name="loader" class="animate-spin" />{{ i18n.t('saving') }} } @else { <app-icon name="check" />{{ i18n.t('save') }} }
        </button>
      </ng-container>
    </app-modal>
  `,
})
export class ClientForm {
  protected i18n = inject(I18n);
  protected rights = inject(CrmRights);
  private crm = inject(Crm);
  private api = inject(Api);
  private toasts = inject(Toasts);

  readonly client = input<ClientDetail | null>(null);
  readonly saved = output<ClientDetail>();
  readonly closed = output<void>();

  protected statuses = CLIENT_STATUSES;
  protected statusKey = (s: ClientStatus) => ('status' + s) as I18nKey;
  protected cities = signal<City[]>([]);
  protected owners = signal<Ref[]>([]);
  protected saving = signal(false);

  protected form = inject(FormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    sector: [''],
    status: ['PROSPECT' as ClientStatus],
    email: ['', Validators.email],
    phone: [''],
    website: [''],
    address: [''],
    cityId: [null as number | null],
    notes: [''],
    ownerId: [null as number | null],
  });

  ngOnInit(): void {
    const c = this.client();
    this.form.reset({
      name: c?.name ?? '',
      sector: c?.sector ?? '',
      status: c?.status ?? 'PROSPECT',
      email: c?.email ?? '',
      phone: c?.phone ?? '',
      website: c?.website ?? '',
      address: c?.address ?? '',
      cityId: c?.city?.id ?? null,
      notes: c?.notes ?? '',
      ownerId: c?.owner?.id ?? null,
    });
    if (this.rights.canAssign()) {
      this.crm.owners().subscribe({ next: (list) => this.owners.set(list), error: () => {} });
    }
    this.api.cities.list().subscribe({
      next: (list) => this.cities.set([...list].sort((a, b) => this.i18n.label(a).localeCompare(this.i18n.label(b)))),
      error: () => {},
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    const v = this.form.getRawValue();
    const body = {
      name: v.name!.trim(),
      sector: v.sector?.trim() || null,
      status: v.status!,
      email: v.email?.trim() || null,
      phone: v.phone?.trim() || null,
      website: v.website?.trim() || null,
      address: v.address?.trim() || null,
      cityId: v.cityId,
      notes: v.notes?.trim() || null,
      ownerId: this.rights.canAssign() ? v.ownerId : null,
    };
    const current = this.client();
    this.saving.set(true);
    (current ? this.crm.updateClient(current.id, body) : this.crm.createClient(body)).subscribe({
      next: (c) => {
        this.saving.set(false);
        this.toasts.success(this.i18n.t('saved'));
        this.saved.emit(c);
      },
      error: (err) => {
        this.saving.set(false);
        this.toasts.error(errorMessage(err) ?? this.i18n.t('saveError'));
      },
    });
  }
}
