import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { Api, errorMessage } from '../core/api';
import { Auth } from '../core/auth';
import { SUPER_ADMIN } from '../core/config';
import { I18n } from '../core/i18n';
import { Role, User } from '../core/models';
import { Confirm, Toasts } from '../core/toast';
import { Icon } from '../ui/icon';
import { Modal } from '../ui/modal';
import { ListState, PageHeader } from '../ui/states';

const samePasswords = (group: AbstractControl): ValidationErrors | null =>
  group.get('password')?.value === group.get('confirm')?.value ? null : { differ: true };

@Component({
  selector: 'app-users',
  imports: [ReactiveFormsModule, DatePipe, UpperCasePipe, Icon, Modal, ListState, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header [title]="i18n.t('users')" [subtitle]="i18n.t('usersSubtitle')">
      <button type="button" class="btn btn-primary" (click)="open(null)"><app-icon name="plus" />{{ i18n.t('newUser') }}</button>
    </app-page-header>

    <div class="card overflow-hidden">
      <div class="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
        <div class="relative flex-1">
          <app-icon name="search" class="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input class="input ps-10" type="search" [placeholder]="i18n.t('search')" [value]="query()" (input)="query.set($any($event.target).value)" [attr.aria-label]="i18n.t('search')" />
        </div>
        <select class="input sm:w-56" [value]="roleFilter()" (change)="roleFilter.set($any($event.target).value)" [attr.aria-label]="i18n.t('role')">
          <option value="">{{ i18n.t('allRoles') }}</option>
          @for (r of roles(); track r.id) { <option [value]="r.code">{{ r.title }}</option> }
        </select>
      </div>

      @if (state() !== 'ready') {
        <app-list-state [state]="state()" (retry)="load()" />
      } @else {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>{{ i18n.t('users') }}</th>
                <th class="hidden md:table-cell">{{ i18n.t('phone') }}</th>
                <th class="hidden sm:table-cell">{{ i18n.t('role') }}</th>
                <th class="hidden lg:table-cell">{{ i18n.t('createdAt') }}</th>
                <th class="hidden sm:table-cell">{{ i18n.t('state') }}</th>
                <th class="text-end"><span class="sr-only">{{ i18n.t('actions') }}</span></th>
              </tr>
            </thead>
            <tbody>
              @for (u of filtered(); track u.id) {
                <tr>
                  <td>
                    <div class="flex items-center gap-3">
                      <span class="grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold text-white" [style.background]="avatarColor(u.id)">{{ (u.prenom?.[0] ?? '') + (u.nom?.[0] ?? '') | uppercase }}</span>
                      <div class="min-w-0">
                        <p class="truncate font-semibold text-strong">{{ u.prenom }} {{ u.nom }}</p>
                        <p class="truncate text-muted">{{ u.email || u.login }}</p>
                        <p class="mt-1 text-xs font-medium text-muted sm:hidden">{{ roleTitle(u.role) }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="hidden text-body md:table-cell" dir="ltr">{{ u.phone }}</td>
                  <td class="hidden sm:table-cell">
                    <span class="chip" [class]="u.role === superAdmin ? '!bg-indigo-100 !text-indigo-700 dark:!bg-indigo-500/15 dark:!text-indigo-300' : ''">
                      @if (u.role === superAdmin) { <app-icon name="shield" [size]="13" /> }{{ roleTitle(u.role) }}
                    </span>
                  </td>
                  <td class="hidden text-muted lg:table-cell">{{ u.creationDate | date: 'mediumDate' : undefined : i18n.lang() }}</td>
                  <td class="hidden sm:table-cell">
                    @if (u.state === 'ACTIVATED') {
                      <span class="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><span class="size-2 rounded-full bg-current"></span>{{ i18n.t('active') }}</span>
                    } @else {
                      <span class="inline-flex items-center gap-1.5 text-muted"><span class="size-2 rounded-full bg-current"></span>{{ i18n.t('inactive') }}</span>
                    }
                  </td>
                  <td>
                    <div class="flex justify-end gap-1">
                      <button type="button" class="icon-btn" (click)="open(u)" [attr.aria-label]="i18n.t('edit') + ' ' + u.login"><app-icon name="edit" /></button>
                      <button type="button" class="icon-btn hover:!bg-rose-50 hover:!text-rose-600 dark:hover:!bg-rose-500/10" (click)="remove(u)" [disabled]="u.id === auth.user()?.id" [class.invisible]="u.id === auth.user()?.id" [attr.aria-label]="i18n.t('delete') + ' ' + u.login"><app-icon name="trash" /></button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6"><app-list-state state="empty" /></td></tr>
              }
            </tbody>
          </table>
        </div>
        <p class="border-t border-line px-5 py-3 text-sm text-muted">{{ filtered().length }} / {{ users().length }} {{ i18n.t('total') }}</p>
      }
    </div>

    @if (editing() !== undefined) {
      <app-modal [title]="editing() ? i18n.t('editUser') : i18n.t('newUser')" size="lg" (closed)="close()">
        <form id="user-form" [formGroup]="form" (ngSubmit)="save()" novalidate class="grid gap-4 sm:grid-cols-2">
          @if (locked()) {
            <p class="flex items-center gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-800 sm:col-span-2 dark:bg-amber-500/10 dark:text-amber-300"><app-icon name="shield" [size]="16" />{{ i18n.t('superAdminOnly') }}</p>
          }
          <div>
            <label class="label" for="u-prenom">{{ i18n.t('firstName') }}</label>
            <input id="u-prenom" class="input" formControlName="prenom" autocomplete="given-name" />
            @if (invalid('prenom')) { <p class="field-error">{{ i18n.t('required') }}</p> }
          </div>
          <div>
            <label class="label" for="u-nom">{{ i18n.t('lastName') }}</label>
            <input id="u-nom" class="input" formControlName="nom" autocomplete="family-name" />
            @if (invalid('nom')) { <p class="field-error">{{ i18n.t('required') }}</p> }
          </div>
          <div>
            <label class="label" for="u-login">{{ i18n.t('login') }}</label>
            <input id="u-login" class="input" formControlName="login" autocapitalize="none" spellcheck="false" />
            @if (invalid('login')) { <p class="field-error">{{ i18n.t('required') }}</p> }
          </div>
          <div>
            <label class="label" for="u-role">{{ i18n.t('role') }}</label>
            <select id="u-role" class="input" formControlName="role">
              <option value="" disabled>{{ i18n.t('chooseRole') }}</option>
              @for (r of roles(); track r.id) { <option [value]="r.code">{{ r.title }}</option> }
            </select>
            @if (invalid('role')) { <p class="field-error">{{ i18n.t('required') }}</p> }
          </div>
          <div>
            <label class="label" for="u-email">{{ i18n.t('email') }}</label>
            <input id="u-email" class="input" type="email" formControlName="email" autocomplete="email" dir="ltr" />
            @if (invalid('email')) { <p class="field-error">{{ i18n.t('invalidEmail') }}</p> }
          </div>
          <div>
            <label class="label" for="u-phone">{{ i18n.t('phone') }}</label>
            <input id="u-phone" class="input" type="tel" formControlName="phone" autocomplete="tel" dir="ltr" />
            @if (invalid('phone')) { <p class="field-error">{{ i18n.t('required') }}</p> }
          </div>
          @if (!editing()) {
          <div>
            <label class="label" for="u-pass">{{ i18n.t('password') }}</label>
            <input id="u-pass" class="input" type="password" formControlName="password" autocomplete="new-password" />
            @if (invalid('password')) { <p class="field-error">{{ i18n.t('required') }}</p> }
          </div>
          <div>
            <label class="label" for="u-confirm">{{ i18n.t('confirmPassword') }}</label>
            <input id="u-confirm" class="input" type="password" formControlName="confirm" autocomplete="new-password" />
            @if (form.hasError('differ') && form.controls.confirm.touched) { <p class="field-error">{{ i18n.t('passwordsDiffer') }}</p> }
          </div>
          }
        </form>
        <ng-container modal-actions>
          <button type="button" class="btn btn-ghost" (click)="close()">{{ i18n.t('cancel') }}</button>
          <button type="submit" form="user-form" class="btn btn-primary" [disabled]="saving() || locked()">
            @if (saving()) { <app-icon name="loader" class="animate-spin" />{{ i18n.t('saving') }} } @else { <app-icon name="check" />{{ i18n.t('save') }} }
          </button>
        </ng-container>
      </app-modal>
    }
  `,
})
export class UsersPage {
  protected i18n = inject(I18n);
  protected auth = inject(Auth);
  private api = inject(Api);
  private toasts = inject(Toasts);
  private confirm = inject(Confirm);
  private fb = inject(FormBuilder).nonNullable;

  protected superAdmin = SUPER_ADMIN;
  protected users = signal<User[]>([]);
  protected roles = signal<Role[]>([]);
  protected state = signal<'loading' | 'error' | 'ready'>('loading');
  protected query = signal('');
  protected roleFilter = signal('');
  /** undefined = closed, null = new user, User = editing. */
  protected editing = signal<User | null | undefined>(undefined);
  protected saving = signal(false);

  protected form = this.fb.group(
    {
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      login: ['', Validators.required],
      role: ['', Validators.required],
      email: ['', Validators.email],
      phone: ['', Validators.required],
      password: [''],
      confirm: [''],
    },
    { validators: samePasswords },
  );

  protected filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const role = this.roleFilter();
    return this.users().filter(
      (u) =>
        (!role || u.role === role) &&
        (!q || [u.prenom, u.nom, u.login, u.email, u.phone].some((v) => v?.toLowerCase().includes(q))),
    );
  });

  /** A super admin account can only be changed by a super admin (same rule as the old app). */
  protected locked = computed(() => {
    const u = this.editing();
    return !!u && u.role === SUPER_ADMIN && !this.auth.isSuperAdmin();
  });

  constructor() {
    this.load();
    this.api.roles.list().subscribe({ next: (r) => this.roles.set(r), error: () => {} });
  }

  load(): void {
    this.state.set('loading');
    this.api.users.list().subscribe({
      next: (list) => {
        this.users.set(list);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  protected roleTitle(code: string): string {
    return this.roles().find((r) => r.code === code)?.title ?? code;
  }

  protected avatarColor(id: number): string {
    const colors = ['#4f46e5', '#0891b2', '#d97706', '#059669', '#db2777', '#7c3aed'];
    return colors[id % colors.length];
  }

  protected invalid(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }

  open(user: User | null): void {
    this.form.reset({
      prenom: user?.prenom ?? '',
      nom: user?.nom ?? '',
      login: user?.login ?? '',
      role: user?.role ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      password: '',
      confirm: '',
    });
    // The login is set at creation; the password is required only for a new account.
    if (user) this.form.controls.login.disable();
    else this.form.controls.login.enable();
    this.form.controls.password.setValidators(user ? [] : [Validators.required]);
    this.form.controls.password.updateValueAndValidity();
    this.editing.set(user);
  }

  close(): void {
    this.editing.set(undefined);
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving() || this.locked()) return;
    const v = this.form.getRawValue();
    const current = this.editing();
    const body: Partial<User> = {
      prenom: v.prenom.trim(),
      nom: v.nom.trim(),
      email: v.email.trim(),
      phone: v.phone.trim(),
      role: v.role,
      state: current?.state ?? 'ACTIVATED',
      password: v.password,
    };
    this.saving.set(true);
    const request: Observable<unknown> = current
      ? this.api.users.update({ ...body, id: current.id, login: current.login })
      : this.api.users.create({ ...body, login: v.login.trim(), creationDate: new Date().toISOString().slice(0, 16) });
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.close();
        this.toasts.success(this.i18n.t('saved'));
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.toasts.error(errorMessage(err) ?? this.i18n.t('saveError'));
      },
    });
  }

  async remove(user: User): Promise<void> {
    const name = `${user.prenom} ${user.nom}`.trim() || user.login;
    if (!(await this.confirm.ask(this.i18n.t('confirmDelete'), this.i18n.t('confirmDeleteText', { name })))) return;
    this.api.users.remove(user.id).subscribe({
      next: () => {
        this.users.update((list) => list.filter((u) => u.id !== user.id));
        this.toasts.success(this.i18n.t('deleted'));
      },
      error: (err) => this.toasts.error(errorMessage(err) ?? this.i18n.t('deleteError')),
    });
  }
}
