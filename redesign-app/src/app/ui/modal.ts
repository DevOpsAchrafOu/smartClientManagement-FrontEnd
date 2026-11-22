import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { I18n } from '../core/i18n';
import { Icon } from './icon';

/** Centered dialog (bottom sheet on phones). Closes with Escape or a click on the backdrop. */
@Component({
  selector: 'app-modal',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" [attr.aria-label]="title()">
      <div class="animate-fade absolute inset-0 bg-slate-950/50 backdrop-blur-sm" (click)="closed.emit()"></div>
      <div class="animate-pop relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-line bg-surface shadow-2xl sm:rounded-3xl"
        [class.sm:max-w-lg]="size() === 'md'" [class.sm:max-w-2xl]="size() === 'lg'">
        <header class="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <h2 class="text-lg font-semibold text-strong">{{ title() }}</h2>
          <button type="button" class="icon-btn" (click)="closed.emit()" [attr.aria-label]="i18n.t('cancel')"><app-icon name="x" /></button>
        </header>
        <div class="overflow-y-auto px-6 py-5"><ng-content /></div>
        <footer class="flex flex-col-reverse gap-2 border-t border-line px-6 py-4 sm:flex-row sm:justify-end">
          <ng-content select="[modal-actions]" />
        </footer>
      </div>
    </div>
  `,
})
export class Modal {
  readonly title = input.required<string>();
  readonly size = input<'md' | 'lg'>('md');
  readonly closed = output<void>();
  constructor(protected i18n: I18n) {}
}
