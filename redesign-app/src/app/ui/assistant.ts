import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter, map } from 'rxjs';
import { errorMessage } from '../core/api';
import { ActivityType, AssistantProposal, AssistantStatus, Crm, OpportunityStage } from '../core/crm';
import { I18n, I18nKey } from '../core/i18n';
import { Toasts } from '../core/toast';
import { Icon } from './icon';

interface Line {
  role: 'user' | 'assistant';
  text: string;
  proposals?: (AssistantProposal & { state: 'open' | 'saving' | 'done' | 'dismissed' })[];
  error?: boolean;
  /** The reply is still being written. */
  streaming?: boolean;
}

const SUGGESTIONS: I18nKey[] = ['aiSuggest1', 'aiSuggest2', 'aiSuggest3', 'aiSuggest4'];

/** The client id of a "#/crm/clients/12" page, or null. */
export function clientIdOf(url: string): number | null {
  const m = /\/crm\/clients\/(\d+)/.exec(url);
  return m ? Number(m[1]) : null;
}

/**
 * The CRM assistant (AI service: Spring AI + Google Gemini, free tier): a floating button and a chat panel. The reply
 * is shown as it is written (streaming). On a client page the assistant knows which client "this client" is. "My
 * brief" sums up the day. Actions come as cards; nothing changes until the user clicks "Confirm", which calls the
 * normal CRM endpoints.
 */
@Component({
  selector: 'app-assistant',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!open()) {
      <button type="button" class="fixed end-4 bottom-4 z-40 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-brand to-brand-2 px-4 py-3 font-semibold text-white shadow-xl shadow-brand/30 transition hover:-translate-y-0.5 sm:end-6 sm:bottom-6"
        style="margin-bottom: env(safe-area-inset-bottom, 0px)" (click)="toggle()" [attr.aria-label]="i18n.t('aiOpen')">
        <app-icon name="sparkles" />{{ i18n.t('aiTitle') }}
      </button>
    } @else {
      <section class="fixed inset-x-2 bottom-2 z-50 flex max-h-[85dvh] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl sm:inset-x-auto sm:end-6 sm:bottom-6 sm:h-[620px] sm:w-[420px]"
        role="dialog" [attr.aria-label]="i18n.t('aiTitle')">
        <header class="flex items-center gap-3 border-b border-line px-4 py-3">
          <span class="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-white"><app-icon name="sparkles" [size]="18" /></span>
          <div class="min-w-0 flex-1">
            <h2 class="font-semibold text-strong">{{ i18n.t('aiTitle') }}</h2>
            <p class="truncate text-xs text-muted">{{ status()?.enabled ? i18n.t('aiSubtitle') : i18n.t('aiOff') }}</p>
          </div>
          @if (status()?.enabled && lines().length) {
            <button type="button" class="icon-btn size-9" (click)="brief()" [disabled]="busy()" [attr.aria-label]="i18n.t('aiBrief')" [title]="i18n.t('aiBrief')"><app-icon name="calendar" [size]="16" /></button>
          }
          @if (lines().length) {
            <button type="button" class="icon-btn size-9" (click)="clear()" [attr.aria-label]="i18n.t('aiNew')"><app-icon name="plus" [size]="16" /></button>
          }
          <button type="button" class="icon-btn size-9" (click)="toggle()" [attr.aria-label]="i18n.t('close')"><app-icon name="x" [size]="16" /></button>
        </header>

        <div #scroller class="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
          @if (!lines().length) {
            <p class="text-sm text-body">{{ i18n.t('aiHello') }}</p>
            @if (status()?.enabled) {
              <button type="button" class="flex w-full items-center gap-3 rounded-xl bg-gradient-to-br from-brand to-brand-2 px-3.5 py-3 text-start text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5" (click)="brief()">
                <app-icon name="calendar" [size]="18" />
                <span class="min-w-0"><span class="block font-semibold">{{ i18n.t('aiBrief') }}</span><span class="block text-xs text-white/80">{{ i18n.t('aiBriefHint') }}</span></span>
              </button>
              <div class="flex flex-col gap-2">
                @for (s of suggestions; track s) {
                  <button type="button" class="rounded-xl border border-line px-3 py-2 text-start text-sm text-body transition hover:border-brand hover:text-strong" (click)="send(i18n.t(s))">{{ i18n.t(s) }}</button>
                }
              </div>
            }
            <p class="text-xs text-muted">{{ i18n.t('aiPrivacy') }}</p>
          }
          @for (l of lines(); track $index) {
            @if (l.role === 'user') {
              <p class="ms-10 rounded-2xl rounded-ee-md bg-brand px-3.5 py-2 text-sm whitespace-pre-wrap text-white">{{ l.text }}</p>
            } @else if (l.text || !l.streaming) {
              <div class="me-6 space-y-2">
                <div class="group relative rounded-2xl rounded-es-md px-3.5 py-2 text-sm whitespace-pre-wrap"
                  [class]="l.error ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : 'bg-soft text-body'">{{ l.text }}@if (l.streaming) {<span class="ms-0.5 inline-block h-3.5 w-1.5 animate-pulse rounded-sm bg-brand align-middle"></span>}
                  @if (!l.error && !l.streaming) {
                    <button type="button" class="absolute -end-8 top-1 icon-btn size-7 opacity-60 hover:opacity-100" (click)="copy(l.text)" [attr.aria-label]="i18n.t('aiCopy')"><app-icon name="note" [size]="13" /></button>
                  }
                </div>
                @for (p of l.proposals ?? []; track $index) {
                  <div class="rounded-2xl border border-brand/40 bg-brand/5 p-3 text-sm dark:bg-brand/10">
                    <p class="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand uppercase dark:text-indigo-300"><app-icon name="sparkles" [size]="12" />{{ i18n.t('aiProposal') }}</p>
                    <p class="mt-1 font-medium text-strong">{{ describe(p) }}</p>
                    @if (p.state === 'done') {
                      <p class="mt-2 inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300"><app-icon name="check" [size]="14" />{{ i18n.t('aiDone') }}</p>
                    } @else if (p.state === 'dismissed') {
                      <p class="mt-2 text-muted">{{ i18n.t('aiDismissed') }}</p>
                    } @else {
                      <div class="mt-2 flex gap-2">
                        <button type="button" class="btn btn-primary min-h-9 px-3 text-xs" [disabled]="p.state === 'saving'" (click)="confirm(p)"><app-icon [name]="p.state === 'saving' ? 'loader' : 'check'" [class.animate-spin]="p.state === 'saving'" [size]="14" />{{ i18n.t('aiConfirm') }}</button>
                        <button type="button" class="btn btn-ghost min-h-9 px-3 text-xs" (click)="p.state = 'dismissed'; touch()">{{ i18n.t('aiDismiss') }}</button>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          }
          @if (thinking()) {
            <p class="inline-flex items-center gap-2 text-sm text-muted"><app-icon name="loader" class="animate-spin" [size]="14" />{{ i18n.t('aiThinking') }}</p>
          }
        </div>

        @if (clientId() && status()?.enabled) {
          <p class="flex items-center gap-1.5 border-t border-line bg-soft/60 px-4 py-1.5 text-xs text-muted"><app-icon name="building" [size]="12" />{{ i18n.t('aiContextClient') }}</p>
        }
        <form class="flex items-end gap-2 border-t border-line p-3" (submit)="$event.preventDefault(); send(input.value); input.value = ''">
          <textarea #input rows="1" class="input max-h-32 min-h-11 flex-1 resize-none py-2.5" [placeholder]="i18n.t('aiPlaceholder')" [attr.aria-label]="i18n.t('aiPlaceholder')"
            [disabled]="!status()?.enabled" maxlength="2000"
            (keydown.enter)="onEnter($any($event), input)"></textarea>
          <button type="submit" class="btn btn-primary min-h-11 px-3" [disabled]="busy() || !status()?.enabled" [attr.aria-label]="i18n.t('aiSend')"><app-icon name="arrowRight" class="rtl:rotate-180" /></button>
        </form>
      </section>
    }
  `,
})
export class AssistantPanel {
  protected i18n = inject(I18n);
  private crm = inject(Crm);
  private toasts = inject(Toasts);
  private router = inject(Router);
  private scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  private running?: Subscription;

  protected suggestions = SUGGESTIONS;
  protected open = signal(false);
  protected busy = signal(false);
  protected status = signal<AssistantStatus | null>(null);
  protected lines = signal<Line[]>([]);

  /** The client page open behind the panel, if any. */
  protected clientId = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => clientIdOf(e.urlAfterRedirects)),
    ),
    { initialValue: clientIdOf(this.router.url) },
  );

  /** Waiting for the first word of the reply. */
  protected thinking = computed(() => {
    const last = this.lines().at(-1);
    return this.busy() && (!last || last.role === 'user' || (last.streaming === true && !last.text));
  });

  constructor() {
    // Keep the newest message in view.
    effect(() => {
      this.lines();
      this.busy();
      const el = this.scroller()?.nativeElement;
      if (el) queueMicrotask(() => (el.scrollTop = el.scrollHeight));
    });
  }

  protected toggle(): void {
    this.open.update((o) => !o);
    if (this.open() && !this.status()) {
      this.crm.assistantStatus().subscribe({ next: (s) => this.status.set(s), error: () => this.status.set({ enabled: false, model: '', canAct: false }) });
    }
  }

  protected clear(): void {
    this.running?.unsubscribe();
    this.busy.set(false);
    this.lines.set([]);
  }

  /** Re-renders after a line or a proposal card changed. */
  protected touch(): void {
    this.lines.update((l) => [...l]);
  }

  /** Enter sends, Shift+Enter starts a new line. */
  protected onEnter(event: KeyboardEvent, input: HTMLTextAreaElement): void {
    if (event.shiftKey) return;
    event.preventDefault();
    this.send(input.value);
    input.value = '';
  }

  send(raw: string): void {
    const text = raw.trim();
    if (!text || this.busy() || !this.status()?.enabled) return;
    this.lines.update((l) => [...l, { role: 'user', text }]);
    this.ask(false);
  }

  /** The daily brief: late work, today's agenda and deals to watch, read with the user's rights. */
  brief(): void {
    if (this.busy() || !this.status()?.enabled) return;
    const history = this.history();
    this.lines.update((l) => [...l, { role: 'user', text: this.i18n.t('aiBrief') }]);
    this.ask(true, history);
  }

  /** The conversation the server sees: no error lines, the last 20 messages. */
  private history(): { role: 'user' | 'assistant'; text: string }[] {
    return this.lines()
      .filter((l) => !l.error && l.text)
      .slice(-20)
      .map((l) => ({ role: l.role, text: l.text.slice(0, 4000) }));
  }

  private ask(brief: boolean, history = this.history()): void {
    this.busy.set(true);
    const reply: Line = { role: 'assistant', text: '', streaming: true };
    this.lines.update((l) => [...l, reply]);
    const finish = (patch: Partial<Line>) => {
      Object.assign(reply, { streaming: false }, patch);
      this.busy.set(false);
      this.touch();
    };
    this.running = this.crm.assistantStream({ messages: history, lang: this.i18n.lang(), clientId: this.clientId(), brief }).subscribe({
      next: (event) => {
        if (event.type === 'delta') {
          reply.text += event.text;
          this.touch();
        } else if (event.type === 'done') {
          finish({ proposals: event.proposals.map((p) => ({ ...p, state: 'open' as const })) });
        } else {
          finish(reply.text ? { text: `${reply.text}\n\n${event.message}` } : { text: event.message || this.i18n.t('aiError'), error: true });
        }
      },
      error: (err) => finish({ text: errorMessage(err) ?? this.i18n.t('aiError'), error: true }),
      complete: () => {
        if (reply.streaming) finish(reply.text ? {} : { text: this.i18n.t('aiError'), error: true });
      },
    });
  }

  /** A sentence describing the proposed action. */
  protected describe(p: AssistantProposal): string {
    const d = p.payload as Record<string, string | number | null>;
    if (p.type === 'CREATE_ACTIVITY') {
      const when = d['dueAt'] ? ' · ' + new Intl.DateTimeFormat(this.i18n.lang() === 'ar' ? 'ar-MA' : 'fr-MA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(String(d['dueAt']))) : '';
      return `${this.i18n.t(('type' + d['type']) as I18nKey)} : ${d['subject']}${d['clientName'] ? ' — ' + d['clientName'] : ''}${when}`;
    }
    return `${d['title']} (${d['clientName']}) : ${this.i18n.t(('stage' + d['from']) as I18nKey)} → ${this.i18n.t(('stage' + d['stage']) as I18nKey)}`;
  }

  /** Applies a proposal through the normal CRM endpoints (the API checks the user's rights again). */
  protected confirm(p: AssistantProposal & { state: string }): void {
    const d = p.payload as Record<string, string | number | null>;
    p.state = 'saving';
    this.touch();
    const done = {
      next: () => {
        p.state = 'done';
        this.touch();
        this.toasts.success(this.i18n.t('saved'));
      },
      error: (err: unknown) => {
        p.state = 'open';
        this.touch();
        this.toasts.error(errorMessage(err) ?? this.i18n.t('saveError'));
      },
    };
    if (p.type === 'CREATE_ACTIVITY') {
      this.crm
        .createActivity({
          type: d['type'] as ActivityType,
          subject: String(d['subject']),
          clientId: (d['clientId'] as number | null) ?? null,
          dueAt: (d['dueAt'] as string | null) ? `${d['dueAt']}:00`.slice(0, 19) : null,
          details: (d['details'] as string | null) ?? null,
        })
        .subscribe(done);
    } else {
      this.crm.moveOpportunity(Number(d['opportunityId']), d['stage'] as OpportunityStage, (d['lostReason'] as string | null) ?? null).subscribe(done);
    }
  }

  protected copy(text: string): void {
    navigator.clipboard?.writeText(text).then(
      () => this.toasts.success(this.i18n.t('aiCopied')),
      () => {},
    );
  }
}
