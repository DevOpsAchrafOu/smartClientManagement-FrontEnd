import { ChangeDetectionStrategy, Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { errorMessage } from '../core/api';
import { Crm, CrmExport, ImportReport } from '../core/crm';
import { I18n, I18nKey } from '../core/i18n';
import { Toasts } from '../core/toast';
import { Icon } from './icon';
import { Modal } from './modal';

const EXPORT_LABEL: Record<CrmExport, I18nKey> = {
  clients: 'clients',
  contacts: 'contacts',
  activities: 'activities',
  opportunities: 'opportunities',
};

/** "Export" button: one CSV file, or a small menu when several are offered. */
@Component({
  selector: 'app-export-button',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative inline-block' },
  template: `
    @if (kinds().length === 1) {
      <button type="button" class="btn btn-ghost" [disabled]="busy()" (click)="run(kinds()[0])">
        <app-icon [name]="busy() ? 'loader' : 'download'" [class.animate-spin]="busy()" />{{ i18n.t('exportCsv') }}
      </button>
    } @else {
      <details #menu class="group">
        <summary class="btn btn-ghost list-none [&::-webkit-details-marker]:hidden" [attr.aria-label]="i18n.t('exportCsv')">
          <app-icon [name]="busy() ? 'loader' : 'download'" [class.animate-spin]="busy()" />{{ i18n.t('exportCsv') }}
          <app-icon name="chevronDown" [size]="14" class="transition group-open:rotate-180" />
        </summary>
        <div class="absolute end-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-xl">
          @for (k of kinds(); track k) {
            <button type="button" class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm text-body hover:bg-soft hover:text-strong"
              [disabled]="busy()" (click)="run(k)">
              <app-icon name="download" [size]="14" class="text-muted" />{{ i18n.t(label[k]) }} <span class="ms-auto text-xs text-muted">CSV</span>
            </button>
          }
        </div>
      </details>
    }
  `,
})
export class ExportButton {
  protected i18n = inject(I18n);
  private crm = inject(Crm);
  private toasts = inject(Toasts);
  private menu = viewChild<ElementRef<HTMLDetailsElement>>('menu');

  /** What can be exported from this page. */
  readonly kinds = input.required<CrmExport[]>();
  protected label = EXPORT_LABEL;
  protected busy = signal(false);

  protected run(kind: CrmExport): void {
    this.busy.set(true);
    this.crm.exportCsv(kind).subscribe({
      next: () => {
        this.busy.set(false);
        if (this.menu()) this.menu()!.nativeElement.open = false;
        this.toasts.success(this.i18n.t('exportDone'));
      },
      error: (err) => {
        this.busy.set(false);
        this.toasts.error(errorMessage(err) ?? this.i18n.t('exportError'));
      },
    });
  }
}

/** Imports a client list: choose a CSV, check it (nothing saved), then import. */
@Component({
  selector: 'app-import-clients',
  imports: [Icon, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [title]="i18n.t('importClients')" size="lg" (closed)="closed.emit()">
      <div class="space-y-4">
        <p class="text-sm text-body">{{ i18n.t('importIntro') }}</p>
        <p class="rounded-xl bg-soft px-3.5 py-2.5 font-mono text-xs text-body" dir="ltr">nom ; secteur ; statut ; email ; telephone ; site_web ; adresse ; ville ; notes ; responsable</p>
        <button type="button" class="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline dark:text-indigo-300" (click)="template()">
          <app-icon name="download" [size]="14" />{{ i18n.t('importTemplate') }}
        </button>

        <label class="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line px-4 py-6 text-center transition hover:border-brand"
          [class.!border-brand]="file()">
          <app-icon name="upload" [size]="22" class="text-muted" />
          <span class="text-sm font-medium text-strong">{{ file()?.name ?? i18n.t('chooseCsv') }}</span>
          <span class="text-xs text-muted">CSV · 1 Mo max · 1000 lignes</span>
          <input type="file" accept=".csv,text/csv" class="sr-only" (change)="pick($any($event.target).files?.[0])" />
        </label>

        @if (report(); as r) {
          <div class="rounded-2xl border border-line p-4" role="status">
            <p class="font-semibold text-strong">{{ r.dryRun ? i18n.t('importChecked') : i18n.t('importDone') }}</p>
            <ul class="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
              <li class="rounded-xl bg-emerald-50 px-2 py-2 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"><b class="block text-lg tabular-nums">{{ r.created }}</b>{{ i18n.t(r.dryRun ? 'importWillCreate' : 'importCreated') }}</li>
              <li class="rounded-xl bg-amber-50 px-2 py-2 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"><b class="block text-lg tabular-nums">{{ r.skipped }}</b>{{ i18n.t('importSkipped') }}</li>
              <li class="rounded-xl bg-rose-50 px-2 py-2 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"><b class="block text-lg tabular-nums">{{ r.errors.length - r.skipped }}</b>{{ i18n.t('importErrors') }}</li>
            </ul>
            @if (r.errors.length) {
              <ul class="mt-3 max-h-48 space-y-1 overflow-y-auto text-sm">
                @for (e of r.errors; track $index) {
                  <li class="flex gap-2"><span class="shrink-0 font-mono text-xs text-muted tabular-nums">{{ i18n.t('line') }} {{ e.line }}</span><span class="text-body">{{ e.message }}</span></li>
                }
              </ul>
            }
          </div>
        }
      </div>
      <ng-container modal-actions>
        <button type="button" class="btn btn-ghost" (click)="closed.emit()">{{ report() && !report()!.dryRun ? i18n.t('close') : i18n.t('cancel') }}</button>
        @if (!report() || report()!.dryRun) {
          @if (report()?.dryRun && report()!.created > 0) {
            <button type="button" class="btn btn-primary" [disabled]="busy()" (click)="send(false)">
              <app-icon [name]="busy() ? 'loader' : 'check'" [class.animate-spin]="busy()" />{{ i18n.t('importNow', { n: '' + report()!.created }) }}
            </button>
          } @else {
            <button type="button" class="btn btn-primary" [disabled]="!file() || busy()" (click)="send(true)">
              <app-icon [name]="busy() ? 'loader' : 'search'" [class.animate-spin]="busy()" />{{ i18n.t('importCheck') }}
            </button>
          }
        }
      </ng-container>
    </app-modal>
  `,
})
export class ImportClientsDialog {
  protected i18n = inject(I18n);
  private crm = inject(Crm);
  private toasts = inject(Toasts);

  readonly imported = output<number>();
  readonly closed = output<void>();

  protected file = signal<File | null>(null);
  protected report = signal<ImportReport | null>(null);
  protected busy = signal(false);

  protected pick(file: File | undefined): void {
    this.file.set(file ?? null);
    this.report.set(null);
  }

  protected template(): void {
    this.crm.importTemplate().subscribe({ error: (err) => this.toasts.error(errorMessage(err) ?? this.i18n.t('exportError')) });
  }

  /** dryRun: check every line without saving; otherwise import for real. */
  protected send(dryRun: boolean): void {
    const file = this.file();
    if (!file) return;
    this.busy.set(true);
    this.crm.importClients(file, dryRun).subscribe({
      next: (r) => {
        this.busy.set(false);
        this.report.set(r);
        if (!dryRun) {
          this.toasts.success(this.i18n.t('importDoneToast', { n: '' + r.created }));
          this.imported.emit(r.created);
        }
      },
      error: (err) => {
        this.busy.set(false);
        this.toasts.error(errorMessage(err) ?? this.i18n.t('saveError'));
      },
    });
  }
}
