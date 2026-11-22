import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18n } from '../core/i18n';
import { Confirm, Toasts } from '../core/toast';
import { Icon } from './icon';
import { Modal } from './modal';

/** Toast stack + confirmation dialog, mounted once in the root component. */
@Component({
  selector: 'app-overlays',
  imports: [Icon, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      @for (t of toasts.items(); track t.id) {
        <div class="animate-pop pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-xl ring-1"
          [class]="t.kind === 'error' ? 'bg-rose-600 text-white ring-rose-700' : t.kind === 'success' ? 'bg-slate-900 text-white ring-slate-800 dark:bg-white dark:text-slate-900 dark:ring-white' : 'bg-surface text-strong ring-line'">
          <app-icon [name]="t.kind === 'error' ? 'alert' : 'check'" />
          <span class="flex-1">{{ t.text }}</span>
          <button type="button" class="opacity-70 hover:opacity-100" (click)="toasts.dismiss(t.id)" [attr.aria-label]="i18n.t('cancel')"><app-icon name="x" [size]="16" /></button>
        </div>
      }
    </div>

    @if (confirm.request(); as req) {
      <app-modal [title]="req.title" (closed)="confirm.answer(false)">
        <div class="flex gap-4">
          <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"><app-icon name="trash" /></span>
          <p class="pt-2 text-muted">{{ req.text }}</p>
        </div>
        <ng-container modal-actions>
          <button type="button" class="btn btn-ghost" (click)="confirm.answer(false)">{{ i18n.t('cancel') }}</button>
          <button type="button" class="btn btn-danger" (click)="confirm.answer(true)">{{ i18n.t('delete') }}</button>
        </ng-container>
      </app-modal>
    }
  `,
})
export class Overlays {
  protected toasts = inject(Toasts);
  protected confirm = inject(Confirm);
  protected i18n = inject(I18n);
}
