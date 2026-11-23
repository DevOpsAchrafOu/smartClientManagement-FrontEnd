import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Auth } from '../../core/auth';
import { Crm, Opportunity, OpportunityStage, PipelineSummary } from '../../core/crm';
import { CrmPipelinePage } from './pipeline';

function deal(id: number, stage: OpportunityStage, amount: number): Opportunity {
  return {
    id, title: 'Deal ' + id, client: { id: 1, label: 'Atlas Distribution' }, contact: null, owner: { id: 2, label: 'Sara Mansouri' },
    stage, amount, probability: 10, weighted: 0, expectedClose: null, closedAt: null, lostReason: null, notes: null,
    overdue: false, createdAt: '2026-11-01T10:00:00', updatedAt: '2026-11-01T10:00:00',
  };
}

const SUMMARY: PipelineSummary = {
  openCount: 2, openAmount: 150000, weightedAmount: 40000, wonThisMonth: 0, winRate: null, averageWon: null, overdue: 0, stages: [],
};

function setup(role: string, moveResult: 'ok' | 'error' = 'ok') {
  const crm = {
    opportunities: vi.fn(() => of([deal(1, 'NEW', 100000), deal(2, 'NEW', 50000), deal(3, 'WON', 70000)])),
    pipelineSummary: vi.fn(() => of(SUMMARY)),
    moveOpportunity: vi.fn((id: number, stage: OpportunityStage) =>
      moveResult === 'ok' ? of({ ...deal(id, stage, 100000), probability: 25 }) : throwError(() => new Error('boom'))),
  };
  TestBed.configureTestingModule({
    imports: [CrmPipelinePage],
    providers: [provideRouter([]), { provide: Crm, useValue: crm }, { provide: Auth, useValue: { user: signal({ role }) } }],
  });
  const fixture = TestBed.createComponent(CrmPipelinePage);
  fixture.detectChanges();
  return { fixture, crm, page: fixture.componentInstance as any };
}

describe('CrmPipelinePage', () => {
  it('puts each deal in its stage column with the column total', () => {
    const { page } = setup('ROLE_MANAGER');
    const columns = page.columns();
    expect(columns.map((c: any) => c.stage)).toEqual(['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']);
    expect(columns[0].items.length).toBe(2);
    expect(columns[0].total).toBe(150000);
    expect(columns[4].items.length).toBe(1);
  });

  it('moves a card at once, then keeps what the API answers', () => {
    const { page, crm } = setup('ROLE_MANAGER');
    page.move(page.items()[0], 'QUALIFIED');
    expect(crm.moveOpportunity).toHaveBeenCalledWith(1, 'QUALIFIED');
    const moved = page.items().find((o: Opportunity) => o.id === 1);
    expect(moved.stage).toBe('QUALIFIED');
    expect(moved.probability).toBe(25);
  });

  it('puts the card back when saving fails', () => {
    const { page } = setup('ROLE_MANAGER', 'error');
    page.move(page.items()[0], 'WON');
    expect(page.items().find((o: Opportunity) => o.id === 1).stage).toBe('NEW');
  });

  it('shows no move menu or new button to read-only users', () => {
    const { fixture } = setup('ROLE_VIEWER');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('app-opportunity-card').length).toBe(3);
    expect(el.querySelectorAll('app-opportunity-card select').length).toBe(0);
    expect(el.textContent).not.toContain('Nouvelle opportunité');
  });
});
