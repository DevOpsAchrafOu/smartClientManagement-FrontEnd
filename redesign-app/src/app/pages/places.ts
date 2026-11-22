import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { errorMessage } from '../core/api';
import { I18n, I18nKey } from '../core/i18n';
import { Confirm, Toasts } from '../core/toast';
import { Icon } from '../ui/icon';
import { ListState } from '../ui/states';

/** A row with French and Arabic labels (countries, cities). */
export interface Place {
  id: number;
  titleFr: string;
  titleAr: string;
  idPays?: number;
}

/** Shared list + form for countries and cities. */
@Component({
  selector: 'app-place-list',
  imports: [ReactiveFormsModule, Icon, ListState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card overflow-hidden">
      <div class="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
        <div class="relative flex-1">
          <app-icon name="search" class="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input class="input ps-10" type="search" [placeholder]="i18n.t('search')" [value]="query()" (input)="query.set($any($event.target).value)" [attr.aria-label]="i18n.t('search')" />
        </div>
        <ng-content select="[filters]" />
      </div>

      @if (state() !== 'ready') {
        <app-list-state [state]="state()" (retry)="retry.emit()" />
      } @else {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>{{ i18n.t('titleFr') }}</th>
                <th>{{ i18n.t('titleAr') }}</th>
                @if (extraHeader()) { <th class="hidden sm:table-cell">{{ extraHeader() }}</th> }
                <th class="text-end"><span class="sr-only">{{ i18n.t('actions') }}</span></th>
              </tr>
            </thead>
            <tbody>
              @for (p of filtered(); track p.id) {
                <tr>
                  <td>
                    <div class="flex items-center gap-3">
                      <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-soft text-muted"><app-icon [name]="icon()" [size]="16" /></span>
                      <span class="font-medium text-strong" dir="ltr">{{ p.titleFr }}</span>
                    </div>
                  </td>
                  <td class="text-body" dir="rtl" lang="ar">{{ p.titleAr }}</td>
                  @if (extraHeader()) { <td class="hidden sm:table-cell"><span class="chip">{{ extra()(p) }}</span></td> }
                  <td>
                    <div class="flex justify-end gap-1">
                      <button type="button" class="icon-btn" (click)="edit.emit(p)" [attr.aria-label]="i18n.t('edit') + ' ' + p.titleFr"><app-icon name="edit" /></button>
                      <button type="button" class="icon-btn hover:!bg-rose-50 hover:!text-rose-600 dark:hover:!bg-rose-500/10" (click)="remove.emit(p)" [attr.aria-label]="i18n.t('delete') + ' ' + p.titleFr"><app-icon name="trash" /></button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td [attr.colspan]="extraHeader() ? 4 : 3"><app-list-state state="empty" /></td></tr>
              }
            </tbody>
          </table>
        </div>
        <p class="border-t border-line px-5 py-3 text-sm text-muted">{{ filtered().length }} / {{ items().length }} {{ i18n.t('total') }}</p>
      }
    </div>
  `,
})
export class PlaceList {
  protected i18n = inject(I18n);
  readonly items = input.required<Place[]>();
  readonly state = input.required<'loading' | 'error' | 'ready'>();
  readonly icon = input('globe');
  readonly extraHeader = input('');
  readonly extra = input<(p: Place) => string>(() => '');
  readonly edit = output<Place>();
  readonly remove = output<Place>();
  readonly retry = output<void>();

  protected query = signal('');
  protected filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q ? this.items().filter((p) => p.titleFr?.toLowerCase().includes(q) || p.titleAr?.includes(q)) : this.items();
  });
}

/** Helpers shared by the countries and cities pages: form, save and delete. */
export class PlaceEditor {
  readonly i18n = inject(I18n);
  private toasts = inject(Toasts);
  private confirm = inject(Confirm);

  readonly editing = signal<Place | null | undefined>(undefined);
  readonly saving = signal(false);
  readonly form = inject(FormBuilder).nonNullable.group({
    titleFr: ['', Validators.required],
    titleAr: ['', Validators.required],
    idPays: [0],
  });

  open(place: Place | null, idPays = 0): void {
    this.form.reset({ titleFr: place?.titleFr ?? '', titleAr: place?.titleAr ?? '', idPays: place?.idPays ?? idPays });
    this.editing.set(place);
  }

  close(): void {
    this.editing.set(undefined);
  }

  save(request: (body: Partial<Place>, current: Place | null) => Observable<unknown>, done: () => void): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    const v = this.form.getRawValue();
    this.saving.set(true);
    request({ titleFr: v.titleFr.trim(), titleAr: v.titleAr.trim(), idPays: Number(v.idPays) }, this.editing() ?? null).subscribe({
      next: () => {
        this.saving.set(false);
        this.close();
        this.toasts.success(this.i18n.t('saved'));
        done();
      },
      error: (err) => {
        this.saving.set(false);
        this.toasts.error(errorMessage(err) ?? this.i18n.t('saveError'));
      },
    });
  }

  async remove(place: Place, request: () => Observable<unknown>, done: () => void): Promise<void> {
    if (!(await this.confirm.ask(this.i18n.t('confirmDelete'), this.i18n.t('confirmDeleteText', { name: this.i18n.label(place) })))) return;
    request().subscribe({
      next: () => {
        this.toasts.success(this.i18n.t('deleted'));
        done();
      },
      error: (err) => this.toasts.error(errorMessage(err) ?? this.i18n.t('deleteError')),
    });
  }

  title(newKey: I18nKey, editKey: I18nKey): string {
    return this.i18n.t(this.editing() ? editKey : newKey);
  }
}
