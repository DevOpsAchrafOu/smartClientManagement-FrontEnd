import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Crm } from '../core/crm';
import { I18n } from '../core/i18n';
import { AssistantPanel } from './assistant';

describe('AssistantPanel', () => {
  function setup(reply: 'proposal' | 'error' = 'proposal', enabled = true) {
    const crm = {
      assistantStatus: vi.fn(() => of({ enabled, model: 'gemini', canAct: true })),
      assistantChat: vi.fn(() => reply === 'error'
        ? throwError(() => new Error('down'))
        : of({
          reply: 'Je vous propose une tâche, à confirmer.',
          toolCalls: 1,
          proposals: [{ type: 'CREATE_ACTIVITY', summary: 'Relancer', payload: { type: 'TASK', subject: 'Relancer Atlas', clientId: 1, clientName: 'Atlas Distribution', dueAt: '2026-12-01T09:00', details: null } }],
        })),
      createActivity: vi.fn(() => of({})),
      moveOpportunity: vi.fn(() => of({})),
    };
    TestBed.configureTestingModule({ imports: [AssistantPanel], providers: [{ provide: Crm, useValue: crm }] });
    TestBed.inject(I18n).lang.set('fr');
    const fixture = TestBed.createComponent(AssistantPanel);
    fixture.detectChanges();
    return { fixture, crm, panel: fixture.componentInstance as any };
  }

  it('sends the conversation and saves a proposal only once confirmed', () => {
    const { fixture, crm, panel } = setup();
    panel.toggle();
    panel.send('Planifie une relance pour Atlas');
    fixture.detectChanges();
    expect(crm.assistantChat).toHaveBeenCalledWith([{ role: 'user', text: 'Planifie une relance pour Atlas' }], 'fr');
    expect(crm.createActivity).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Relancer Atlas');

    const proposal = panel.lines()[1].proposals[0];
    panel.confirm(proposal);
    expect(crm.createActivity).toHaveBeenCalledWith({
      type: 'TASK', subject: 'Relancer Atlas', clientId: 1, dueAt: '2026-12-01T09:00:00', details: null,
    });
    expect(proposal.state).toBe('done');
  });

  it('shows an error line when the assistant fails, and sends nothing when it is off', () => {
    const failing = setup('error');
    failing.panel.toggle();
    failing.panel.send('Bonjour');
    expect(failing.panel.lines()[1].error).toBe(true);

    TestBed.resetTestingModule();
    const off = setup('proposal', false);
    off.panel.toggle();
    off.panel.send('Bonjour');
    expect(off.crm.assistantChat).not.toHaveBeenCalled();
  });
});
