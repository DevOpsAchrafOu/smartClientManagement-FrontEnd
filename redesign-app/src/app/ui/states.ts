import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { I18n } from '../core/i18n';
import { Icon } from './icon';

/** Loading skeleton, error with retry, or empty message for a list. */
@Component({
  selector: 'app-list-state',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (state()) {
      @case ('loading') {
        <div class="space-y-3 p-5" [attr.aria-label]="i18n.t('loading')">
          @for (i of [1, 2, 3, 4]; track i) { <div class="skeleton h-12"></div> }
        </div>
      }
      @case ('error') {
        <div class="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span class="grid size-12 place-items-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"><app-icon name="alert" /></span>
          <p class="text-muted">{{ i18n.t('loadError') }}</p>
          <button type="button" class="btn btn-ghost" (click)="retry.emit()">{{ i18n.t('retry') }}</button>
        </div>
      }
      @case ('empty') {
        <div class="flex flex-col items-center gap-3 px-6 py-14 text-center text-muted">
          <span class="grid size-12 place-items-center rounded-2xl bg-soft"><app-icon name="search" /></span>
          {{ i18n.t('noResults') }}
        </div>
      }
    }
  `,
})
export class ListState {
  readonly state = input.required<'loading' | 'error' | 'empty' | 'ready'>();
  readonly retry = output<void>();
  constructor(protected i18n: I18n) {}
}

/** Page title, subtitle and main action. */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-strong sm:text-3xl">{{ title() }}</h1>
        @if (subtitle()) { <p class="mt-1 text-muted">{{ subtitle() }}</p> }
      </div>
      <ng-content />
    </div>
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
