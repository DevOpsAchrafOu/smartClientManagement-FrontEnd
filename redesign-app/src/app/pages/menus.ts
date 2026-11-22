import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { NgTemplateOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Api, errorMessage, flattenMenus, menuTree } from '../core/api';
import { I18n } from '../core/i18n';
import { Menu } from '../core/models';
import { Confirm, Toasts } from '../core/toast';
import { Icon, MENU_ICON_CHOICES, iconFor } from '../ui/icon';
import { Modal } from '../ui/modal';
import { ListState, PageHeader } from '../ui/states';

@Component({
  selector: 'app-menus',
  imports: [ReactiveFormsModule, NgTemplateOutlet, Icon, Modal, ListState, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header [title]="i18n.t('menus')" [subtitle]="i18n.t('menusSubtitle')">
      <button type="button" class="btn btn-primary" (click)="open(null)"><app-icon name="plus" />{{ i18n.t('newMenu') }}</button>
    </app-page-header>

    @if (state() !== 'ready') {
      <div class="card"><app-list-state [state]="state()" (retry)="load()" /></div>
    } @else {
      <div class="space-y-4">
        @for (p of tree(); track p.id) {
          <section class="card animate-rise overflow-hidden">
            <div class="flex items-center gap-4 p-4 sm:p-5">
              <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand dark:bg-brand/20 dark:text-indigo-300"><app-icon [name]="icon(p.icon)" /></span>
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-strong">{{ p.titleFr }} <span class="font-normal text-muted">· <bdi lang="ar">{{ p.titleAr }}</bdi></span></p>
                <p class="truncate font-mono text-xs text-muted" dir="ltr">{{ p.url }} · #{{ p.order }}@if (p.children.length) { · {{ p.children.length }} {{ i18n.t('submenus') }} }</p>
              </div>
              <ng-container *ngTemplateOutlet="actions; context: { $implicit: p }" />
            </div>
            @if (p.children.length) {
              <ul class="border-t border-line bg-soft/40">
                @for (c of p.children; track c.id) {
                  <li class="flex items-center gap-4 border-b border-line px-4 py-3 ps-8 last:border-b-0 sm:ps-12">
                    <app-icon [name]="icon(c.icon)" class="text-muted" />
                    <div class="min-w-0 flex-1">
                      <p class="font-medium text-strong">{{ c.titleFr }} <span class="font-normal text-muted">· <bdi lang="ar">{{ c.titleAr }}</bdi></span></p>
                      <p class="truncate font-mono text-xs text-muted" dir="ltr">{{ c.url }} · #{{ c.order }}</p>
                    </div>
                    <ng-container *ngTemplateOutlet="actions; context: { $implicit: c }" />
                  </li>
                }
              </ul>
            }
          </section>
        } @empty {
          <div class="card"><app-list-state state="empty" /></div>
        }
      </div>
      <ng-template #actions let-m>
        <div class="flex shrink-0 gap-1">
          <button type="button" class="icon-btn" (click)="open(m)" [attr.aria-label]="i18n.t('edit') + ' ' + m.titleFr"><app-icon name="edit" /></button>
          <button type="button" class="icon-btn hover:!bg-rose-50 hover:!text-rose-600 dark:hover:!bg-rose-500/10" (click)="remove(m)" [attr.aria-label]="i18n.t('delete') + ' ' + m.titleFr"><app-icon name="trash" /></button>
        </div>
      </ng-template>
    }

    @if (editing() !== undefined) {
      <app-modal [title]="editing() ? i18n.t('editMenu') : i18n.t('newMenu')" size="lg" (closed)="close()">
        <form id="menu-form" [formGroup]="form" (ngSubmit)="save()" novalidate class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="label" for="m-fr">{{ i18n.t('titleFr') }}</label>
            <input id="m-fr" class="input" formControlName="titleFr" dir="ltr" />
            @if (form.controls.titleFr.touched && form.controls.titleFr.invalid) { <p class="field-error">{{ i18n.t('required') }}</p> }
          </div>
          <div>
            <label class="label" for="m-ar">{{ i18n.t('titleAr') }}</label>
            <input id="m-ar" class="input" formControlName="titleAr" dir="rtl" lang="ar" />
            @if (form.controls.titleAr.touched && form.controls.titleAr.invalid) { <p class="field-error">{{ i18n.t('required') }}</p> }
          </div>
          <div>
            <label class="label" for="m-url">{{ i18n.t('url') }}</label>
            <input id="m-url" class="input font-mono" formControlName="url" placeholder="/administration/list-user" dir="ltr" />
            @if (form.controls.url.touched && form.controls.url.invalid) { <p class="field-error">{{ i18n.t('required') }}</p> }
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label" for="m-order">{{ i18n.t('order') }}</label>
              <input id="m-order" class="input" type="number" min="0" formControlName="order" />
            </div>
            <div>
              <label class="label" for="m-parent">{{ i18n.t('parent') }}</label>
              <select id="m-parent" class="input" formControlName="parentId">
                <option [ngValue]="0">{{ i18n.t('noParent') }}</option>
                @for (p of parents(); track p.id) { <option [ngValue]="p.id">{{ i18n.label(p) }}</option> }
              </select>
            </div>
          </div>
          <fieldset class="sm:col-span-2">
            <legend class="label">{{ i18n.t('icon') }}</legend>
            <div class="flex flex-wrap gap-2">
              @for (choice of iconChoices; track choice) {
                <button type="button" class="grid size-11 place-items-center rounded-xl border transition"
                  [class]="iconValue() === choice ? 'border-brand bg-brand/10 text-brand dark:text-indigo-300' : 'border-line text-muted hover:text-strong'"
                  (click)="form.controls.icon.setValue(choice)" [attr.aria-pressed]="iconValue() === choice" [attr.aria-label]="choice" [title]="choice">
                  <app-icon [name]="icon(choice)" />
                </button>
              }
            </div>
          </fieldset>
        </form>
        <ng-container modal-actions>
          <button type="button" class="btn btn-ghost" (click)="close()">{{ i18n.t('cancel') }}</button>
          <button type="submit" form="menu-form" class="btn btn-primary" [disabled]="saving()">
            @if (saving()) { <app-icon name="loader" class="animate-spin" />{{ i18n.t('saving') }} } @else { <app-icon name="check" />{{ i18n.t('save') }} }
          </button>
        </ng-container>
      </app-modal>
    }
  `,
})
export class MenusPage {
  protected i18n = inject(I18n);
  private api = inject(Api);
  private toasts = inject(Toasts);
  private confirm = inject(Confirm);

  protected menus = signal<Menu[]>([]);
  protected state = signal<'loading' | 'error' | 'ready'>('loading');
  protected editing = signal<Menu | null | undefined>(undefined);
  protected saving = signal(false);
  protected tree = computed(() => menuTree(this.menus()));
  /** Top-level menus, except the one being edited (a menu cannot be its own parent). */
  protected parents = computed(() => this.tree().filter((p) => p.id !== this.editing()?.id));
  protected icon = iconFor;
  protected iconChoices = MENU_ICON_CHOICES;

  protected form = inject(FormBuilder).nonNullable.group({
    titleFr: ['', Validators.required],
    titleAr: ['', Validators.required],
    url: ['#', Validators.required],
    order: [1],
    parentId: [0],
    icon: ['fa fa-list-alt'],
  });
  protected iconValue = toSignal(this.form.controls.icon.valueChanges, { initialValue: this.form.controls.icon.value });

  constructor() {
    this.load();
  }

  load(): void {
    this.state.set('loading');
    this.api.menus.list().subscribe({
      next: (list) => {
        this.menus.set(list);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  open(menu: Menu | null): void {
    const next = Math.max(0, ...flattenMenus(this.menus()).map((m) => m.order)) + 1;
    this.form.reset({
      titleFr: menu?.titleFr ?? '',
      titleAr: menu?.titleAr ?? '',
      url: menu?.url ?? '#',
      order: menu?.order ?? next,
      parentId: menu?.parentId ?? 0,
      icon: menu?.icon ?? 'fa fa-list-alt',
    });
    this.editing.set(menu);
  }

  close(): void {
    this.editing.set(undefined);
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    const v = this.form.getRawValue();
    const body: Partial<Menu> = { ...v, titleFr: v.titleFr.trim(), titleAr: v.titleAr.trim(), url: v.url.trim(), order: Number(v.order) || 0, typeNav: 'V' };
    const current = this.editing();
    this.saving.set(true);
    const request: Observable<unknown> = current ? this.api.menus.update({ ...body, id: current.id }) : this.api.menus.create(body);
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

  async remove(menu: Menu): Promise<void> {
    if (!(await this.confirm.ask(this.i18n.t('confirmDelete'), this.i18n.t('confirmDeleteText', { name: this.i18n.label(menu) })))) return;
    this.api.menus.remove(menu.id).subscribe({
      next: () => {
        this.toasts.success(this.i18n.t('deleted'));
        this.load();
      },
      error: (err) => this.toasts.error(errorMessage(err) ?? this.i18n.t('deleteError')),
    });
  }
}
