import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, catchError, forkJoin, of } from 'rxjs';
import { Api, errorMessage, menuTree } from '../core/api';
import { SUPER_ADMIN } from '../core/config';
import { I18n } from '../core/i18n';
import { Menu, Role } from '../core/models';
import { Confirm, Toasts } from '../core/toast';
import { Icon, iconFor } from '../ui/icon';
import { Modal } from '../ui/modal';
import { ListState, PageHeader } from '../ui/states';

@Component({
  selector: 'app-roles',
  imports: [ReactiveFormsModule, Icon, Modal, ListState, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header [title]="i18n.t('roles')" [subtitle]="i18n.t('rolesSubtitle')">
      <button type="button" class="btn btn-primary" (click)="open(null)"><app-icon name="plus" />{{ i18n.t('newRole') }}</button>
    </app-page-header>

    @if (state() !== 'ready') {
      <div class="card"><app-list-state [state]="state()" (retry)="load()" /></div>
    } @else {
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        @for (r of roles(); track r.id; let i = $index) {
          <article class="card animate-rise flex flex-col p-6" [style.animation-delay.ms]="i * 40">
            <div class="flex items-start gap-4">
              <span class="grid size-12 shrink-0 place-items-center rounded-2xl" [class]="r.code === superAdmin ? 'bg-gradient-to-br from-brand to-brand-2 text-white' : 'bg-soft text-strong'"><app-icon name="shield" /></span>
              <div class="min-w-0 flex-1">
                <h2 class="truncate text-lg font-semibold text-strong">{{ r.title }}</h2>
                <p class="truncate font-mono text-xs text-muted">{{ r.code }}</p>
              </div>
            </div>
            <div class="mt-5 flex flex-wrap gap-2">
              <span class="chip"><app-icon name="users" [size]="13" />{{ counts()[r.id] ?? '…' }} {{ i18n.t('usersCount') }}</span>
              <span class="chip"><app-icon name="list" [size]="13" />{{ r.menus?.length ?? 0 }} {{ i18n.t('menusCount') }}</span>
            </div>
            <div class="mt-4 flex flex-wrap gap-1.5">
              @for (m of menuNames(r); track m) { <span class="rounded-md border border-line px-1.5 py-0.5 text-xs text-muted">{{ m }}</span> }
            </div>
            <div class="mt-auto flex gap-2 pt-6">
              <button type="button" class="btn btn-ghost flex-1" (click)="open(r)"><app-icon name="edit" [size]="16" />{{ i18n.t('edit') }}</button>
              <button type="button" class="icon-btn border border-line hover:!bg-rose-50 hover:!text-rose-600 dark:hover:!bg-rose-500/10" (click)="remove(r)" [attr.aria-label]="i18n.t('delete') + ' ' + r.title"><app-icon name="trash" /></button>
            </div>
          </article>
        } @empty {
          <div class="card sm:col-span-2 xl:col-span-3"><app-list-state state="empty" /></div>
        }
      </div>
    }

    @if (editing() !== undefined) {
      <app-modal [title]="editing() ? i18n.t('editRole') : i18n.t('newRole')" size="lg" (closed)="close()">
        <form id="role-form" [formGroup]="form" (ngSubmit)="save()" novalidate class="space-y-5">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="label" for="r-title">{{ i18n.t('title') }}</label>
              <input id="r-title" class="input" formControlName="title" />
              @if (form.controls.title.touched && form.controls.title.invalid) { <p class="field-error">{{ i18n.t('required') }}</p> }
            </div>
            <div>
              <label class="label" for="r-code">{{ i18n.t('code') }}</label>
              <input id="r-code" class="input font-mono uppercase" formControlName="code" placeholder="ROLE_…" dir="ltr" />
              @if (form.controls.code.touched && form.controls.code.invalid) { <p class="field-error">{{ i18n.t('required') }}</p> }
            </div>
          </div>

          <fieldset>
            <div class="mb-2 flex items-center justify-between">
              <legend class="label !mb-0">{{ i18n.t('accessibleMenus') }} <span class="font-normal text-muted">({{ selected().size }})</span></legend>
              <button type="button" class="text-sm font-medium text-brand hover:underline dark:text-indigo-300" (click)="toggleAll()">{{ i18n.t('selectAll') }}</button>
            </div>
            <div class="space-y-3">
              @for (p of tree(); track p.id) {
                <div class="rounded-2xl border border-line p-3">
                  <label class="flex min-h-10 items-center gap-3 font-medium text-strong">
                    <input type="checkbox" class="size-4.5 accent-brand" [checked]="selected().has(p.id)" (change)="toggleParent(p.id, p.children)" />
                    <app-icon [name]="icon(p.icon)" class="text-muted" />{{ i18n.label(p) }}
                  </label>
                  @if (p.children.length) {
                    <div class="mt-1 grid gap-1 ps-7 sm:grid-cols-2">
                      @for (c of p.children; track c.id) {
                        <label class="flex min-h-10 items-center gap-3 rounded-xl px-2 text-sm text-body hover:bg-soft">
                          <input type="checkbox" class="size-4 accent-brand" [checked]="selected().has(c.id)" (change)="toggle(c.id, p.id)" />
                          <app-icon [name]="icon(c.icon)" [size]="16" class="text-muted" />{{ i18n.label(c) }}
                        </label>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </fieldset>
        </form>
        <ng-container modal-actions>
          <button type="button" class="btn btn-ghost" (click)="close()">{{ i18n.t('cancel') }}</button>
          <button type="submit" form="role-form" class="btn btn-primary" [disabled]="saving()">
            @if (saving()) { <app-icon name="loader" class="animate-spin" />{{ i18n.t('saving') }} } @else { <app-icon name="check" />{{ i18n.t('save') }} }
          </button>
        </ng-container>
      </app-modal>
    }
  `,
})
export class RolesPage {
  protected i18n = inject(I18n);
  private api = inject(Api);
  private toasts = inject(Toasts);
  private confirm = inject(Confirm);

  protected superAdmin = SUPER_ADMIN;
  protected roles = signal<Role[]>([]);
  protected menus = signal<Menu[]>([]);
  protected counts = signal<Record<number, number>>({});
  protected state = signal<'loading' | 'error' | 'ready'>('loading');
  protected editing = signal<Role | null | undefined>(undefined);
  protected saving = signal(false);
  protected selected = signal(new Set<number>());
  protected tree = computed(() => menuTree(this.menus()));
  protected icon = iconFor;

  protected form = inject(FormBuilder).nonNullable.group({
    title: ['', Validators.required],
    code: ['', Validators.required],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.state.set('loading');
    forkJoin({ roles: this.api.roles.list(), menus: this.api.menus.list().pipe(catchError(() => of([] as Menu[]))) }).subscribe({
      next: ({ roles, menus }) => {
        this.roles.set(roles);
        this.menus.set(menus);
        this.state.set('ready');
        this.loadCounts(roles);
      },
      error: () => this.state.set('error'),
    });
  }

  private loadCounts(roles: Role[]): void {
    if (!roles.length) return;
    forkJoin(roles.map((r) => this.api.usersInRole(r.id).pipe(catchError(() => of(0))))).subscribe((values) =>
      this.counts.set(Object.fromEntries(roles.map((r, i) => [r.id, Number(values[i]) || 0]))),
    );
  }

  protected menuNames(role: Role): string[] {
    const ids = new Set(role.menus ?? []);
    return this.tree().filter((p) => ids.has(p.id)).map((p) => this.i18n.label(p));
  }

  open(role: Role | null): void {
    this.form.reset({ title: role?.title ?? '', code: role?.code ?? 'ROLE_' });
    this.selected.set(new Set(role?.menus ?? []));
    this.editing.set(role);
  }

  close(): void {
    this.editing.set(undefined);
  }

  protected toggle(id: number, parentId?: number): void {
    const next = new Set(this.selected());
    if (next.has(id)) next.delete(id);
    else {
      next.add(id);
      if (parentId) next.add(parentId); // a sub-menu needs its parent to be visible
    }
    this.selected.set(next);
  }

  protected toggleParent(id: number, children: Menu[]): void {
    const next = new Set(this.selected());
    const on = !next.has(id);
    [id, ...children.map((c) => c.id)].forEach((m) => (on ? next.add(m) : next.delete(m)));
    this.selected.set(next);
  }

  protected toggleAll(): void {
    const all = this.tree().flatMap((p) => [p.id, ...p.children.map((c) => c.id)]);
    this.selected.set(this.selected().size === all.length ? new Set() : new Set(all));
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    const v = this.form.getRawValue();
    const body = { title: v.title.trim(), code: v.code.trim().toUpperCase(), menus: [...this.selected()] };
    const current = this.editing();
    this.saving.set(true);
    const request: Observable<unknown> = current ? this.api.roles.update({ ...body, id: current.id }) : this.api.roles.create(body);
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

  async remove(role: Role): Promise<void> {
    if ((this.counts()[role.id] ?? 0) > 0) {
      this.toasts.error(this.i18n.t('roleInUse'));
      return;
    }
    if (!(await this.confirm.ask(this.i18n.t('confirmDelete'), this.i18n.t('confirmDeleteText', { name: role.title })))) return;
    this.api.roles.remove(role.id).subscribe({
      next: () => {
        this.roles.update((list) => list.filter((r) => r.id !== role.id));
        this.toasts.success(this.i18n.t('deleted'));
      },
      error: (err) => this.toasts.error(errorMessage(err) ?? this.i18n.t('deleteError')),
    });
  }
}
