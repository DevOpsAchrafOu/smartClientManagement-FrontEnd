import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { AssistantEvent, Crm, parseSse } from '../core/crm';
import { I18n } from '../core/i18n';
import { AssistantPanel, clientIdOf } from './assistant';

const PROPOSAL = {
  type: 'CREATE_ACTIVITY' as const,
  summary: 'Relancer',
  payload: { type: 'TASK', subject: 'Relancer Atlas', clientId: 1, clientName: 'Atlas Distribution', dueAt: '2026-12-01T09:00', details: null },
};

describe('AssistantPanel', () => {
  function setup(reply: 'proposal' | 'error' | 'subject' = 'proposal', enabled = true) {
    const stream = new Subject<AssistantEvent>();
    const crm = {
      assistantStatus: vi.fn(() => of({ enabled, model: 'gemini', canAct: true })),
      assistantStream: vi.fn(() =>
        reply === 'error'
          ? throwError(() => ({ status: 503, error: { message: 'Gemini is busy right now.' } }))
          : reply === 'subject'
            ? stream
            : of<AssistantEvent[]>(
                { type: 'delta', text: 'Je vous propose ' },
                { type: 'delta', text: 'une tâche, à confirmer.' },
                { type: 'done', proposals: [PROPOSAL], toolCalls: 1 },
              ),
      ),
      createActivity: vi.fn(() => of({})),
      moveOpportunity: vi.fn(() => of({})),
    };
    TestBed.configureTestingModule({ imports: [AssistantPanel], providers: [provideRouter([{ path: 'crm/clients/:id', children: [] }]), { provide: Crm, useValue: crm }] });
    TestBed.inject(I18n).lang.set('fr');
    const fixture = TestBed.createComponent(AssistantPanel);
    fixture.detectChanges();
    return { fixture, crm, stream, panel: fixture.componentInstance as any };
  }

  it('streams the reply and saves a proposal only once confirmed', () => {
    const { fixture, crm, panel } = setup();
    panel.toggle();
    panel.send('Planifie une relance pour Atlas');
    fixture.detectChanges();
    expect(crm.assistantStream).toHaveBeenCalledWith({
      messages: [{ role: 'user', text: 'Planifie une relance pour Atlas' }], lang: 'fr', clientId: null, brief: false,
    });
    expect(panel.lines()[1].text).toBe('Je vous propose une tâche, à confirmer.');
    expect(panel.lines()[1].streaming).toBe(false);
    expect(crm.createActivity).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Relancer Atlas');

    const proposal = panel.lines()[1].proposals[0];
    panel.confirm(proposal);
    expect(crm.createActivity).toHaveBeenCalledWith({
      type: 'TASK', subject: 'Relancer Atlas', clientId: 1, dueAt: '2026-12-01T09:00:00', details: null,
    });
    expect(proposal.state).toBe('done');
  });

  it('shows the text as it arrives, then keeps it', () => {
    const { fixture, stream, panel } = setup('subject');
    panel.toggle();
    panel.send('Bonjour');
    fixture.detectChanges();
    expect(panel.thinking()).toBe(true);

    stream.next({ type: 'delta', text: 'Bon' });
    fixture.detectChanges();
    expect(panel.thinking()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Bon');
    expect(panel.busy()).toBe(true);

    stream.next({ type: 'delta', text: 'jour !' });
    stream.next({ type: 'done', proposals: [], toolCalls: 0 });
    expect(panel.lines()[1].text).toBe('Bonjour !');
    expect(panel.busy()).toBe(false);
  });

  it('sends the open client page and asks for the brief', async () => {
    const { crm, panel } = setup();
    await TestBed.inject(Router).navigateByUrl('/crm/clients/4');
    panel.toggle();
    panel.brief();
    expect(crm.assistantStream).toHaveBeenCalledWith({ messages: [], lang: 'fr', clientId: 4, brief: true });
    expect(panel.lines()[0].text).toBe('Mon brief du jour');
  });

  it('shows an error line when the assistant fails, and sends nothing when it is off', () => {
    const failing = setup('error');
    failing.panel.toggle();
    failing.panel.send('Bonjour');
    expect(failing.panel.lines()[1].error).toBe(true);
    expect(failing.panel.lines()[1].text).toBe('Gemini is busy right now.');

    TestBed.resetTestingModule();
    const off = setup('proposal', false);
    off.panel.toggle();
    off.panel.send('Bonjour');
    off.panel.brief();
    expect(off.crm.assistantStream).not.toHaveBeenCalled();
  });
});

describe('assistant helpers', () => {
  it('finds the client id of a client page', () => {
    expect(clientIdOf('/crm/clients/12')).toBe(12);
    expect(clientIdOf('/crm/clients')).toBeNull();
    expect(clientIdOf('/crm/pipeline')).toBeNull();
  });

  it('reads Server-Sent Events', () => {
    expect(parseSse('event:delta\ndata:{"type":"delta","text":"Bon"}')).toEqual({ type: 'delta', text: 'Bon' });
    expect(parseSse('event:done\ndata:{"proposals":[],"toolCalls":2}')).toEqual({ type: 'done', proposals: [], toolCalls: 2 });
    expect(parseSse('event:error\ndata:{"message":"busy"}')).toEqual({ type: 'error', message: 'busy' });
    expect(parseSse(':keep-alive')).toBeNull();
  });
});
