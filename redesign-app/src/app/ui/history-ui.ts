import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HistoryChange, HistoryEntry, HistoryEntityType, formatMad } from '../core/crm';
import { I18n, I18nKey } from '../core/i18n';
import { Icon } from './icon';

/** Name of each followed field. */
const FIELD: Record<string, I18nKey> = {
  name: 'companyName', sector: 'sector', status: 'status', email: 'email', phone: 'phone', website: 'website',
  address: 'address', city: 'city', owner: 'owner', notes: 'notes', firstName: 'firstName', lastName: 'lastName',
  jobTitle: 'jobTitle', primary: 'primaryContact', type: 'type', subject: 'subject', contact: 'contact', dueAt: 'dueAt',
  done: 'doneLabel', details: 'details', title: 'opportunityTitle', stage: 'stage', amount: 'amountMad',
  probability: 'probability', expectedClose: 'expectedClose', lostReason: 'lostReason',
};

const ICON: Record<HistoryEntityType, string> = { CLIENT: 'building', CONTACT: 'user', ACTIVITY: 'calendar', OPPORTUNITY: 'trending' };
const TONE: Record<string, string> = {
  CREATED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  UPDATED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  DELETED: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

/** A timeline of CRM changes: who did what, when, and the old → new value of each changed field. */
@Component({
  selector: 'app-history-list',
  imports: [Icon, DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="relative space-y-4 border-s border-line ps-6">
      @for (h of items(); track h.id) {
        <li class="relative">
          <span class="absolute -start-[37px] top-0 grid size-7 place-items-center rounded-full ring-4 ring-surface" [class]="tone[h.action]">
            <app-icon [name]="icon[h.entityType]" [size]="14" />
          </span>
          <p class="text-sm text-body">
            <span class="font-semibold text-strong">{{ h.user?.label ?? i18n.t('histSystem') }}</span>
            {{ i18n.t(actionKey(h)) }}
            <span class="font-medium text-strong">« {{ h.summary }} »</span>
            @if (showClient() && h.client && h.entityType !== 'CLIENT') {
              · <a [routerLink]="['/crm/clients', h.client.id]" class="text-brand hover:underline dark:text-indigo-300">{{ h.client.label }}</a>
            }
          </p>
          <p class="mt-0.5 text-xs text-muted">{{ h.createdAt | date: 'd MMM y, HH:mm' : undefined : i18n.lang() }}</p>
          @if (h.changes.length) {
            <ul class="mt-2 space-y-1 rounded-xl bg-soft/70 px-3 py-2 text-sm">
              @for (c of h.changes; track c.field) {
                <li class="flex flex-wrap items-baseline gap-x-1.5">
                  <span class="text-muted">{{ fieldLabel(c.field) }} :</span>
                  @if (c.field === 'notes' || c.field === 'details') {
                    <span class="text-body">{{ i18n.t('histTextChanged') }}</span>
                  } @else {
                    <span class="text-muted line-through decoration-1">{{ value(c.field, c.from) }}</span>
                    <span class="text-muted rtl:rotate-180" aria-hidden="true">→</span>
                    <span class="font-medium text-strong">{{ value(c.field, c.to) }}</span>
                  }
                </li>
              }
            </ul>
          }
        </li>
      }
    </ol>
  `,
})
export class HistoryList {
  protected i18n = inject(I18n);
  readonly items = input.required<HistoryEntry[]>();
  /** Show the client's name (in the CRM journal; not on the client page). */
  readonly showClient = input(true);
  protected icon = ICON;
  protected tone = TONE;

  protected actionKey(h: HistoryEntry): I18nKey {
    return ('hist' + h.action + '_' + h.entityType) as I18nKey;
  }

  protected fieldLabel(field: string): string {
    return FIELD[field] ? this.i18n.t(FIELD[field]) : field;
  }

  /** A stored value as people read it: translated codes, MAD amounts, dates, yes/no. */
  protected value(field: string, v: HistoryChange['from']): string {
    if (v === null || v === undefined || v === '') return '—';
    const t = (key: string) => this.i18n.t(key as I18nKey);
    switch (field) {
      case 'status': return t('status' + v);
      case 'stage': return t('stage' + v);
      case 'type': return t('type' + v);
      case 'done': return v === 'true' ? t('histDone') : t('histOpen');
      case 'primary': return v === 'true' ? t('histYes') : t('histNo');
      case 'amount': return formatMad(Number(v), this.i18n.lang());
      case 'probability': return v + ' %';
      case 'dueAt':
      case 'expectedClose': {
        const d = new Date(v);
        return isNaN(d.getTime()) ? v
          : new Intl.DateTimeFormat(this.i18n.lang() === 'ar' ? 'ar-MA' : 'fr-MA', field === 'dueAt'
            ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
      }
      default: return v;
    }
  }
}
