import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HistoryEntry } from '../core/crm';
import { I18n } from '../core/i18n';
import { HistoryList } from './history-ui';

// The app registers its locales at start-up (main.ts); the test does it itself.
registerLocaleData(localeFr);

describe('HistoryList', () => {
  const won: HistoryEntry = {
    id: 1, entityType: 'OPPORTUNITY', entityId: 7, client: { id: 2, label: 'Rif Digital' }, action: 'UPDATED',
    summary: 'Licence équipe', user: { id: 3, label: 'Sara Mansouri' }, createdAt: '2026-11-23T10:00:00',
    changes: [{ field: 'stage', from: 'NEGOTIATION', to: 'WON' }, { field: 'amount', from: '40000', to: '45000' }, { field: 'notes', from: 'a', to: 'b' }],
  };
  const created: HistoryEntry = {
    id: 2, entityType: 'CLIENT', entityId: 2, client: { id: 2, label: 'Rif Digital' }, action: 'CREATED',
    summary: 'Rif Digital', user: null, createdAt: '2026-11-20T09:00:00', changes: [],
  };

  function render(items: HistoryEntry[], showClient = true): HTMLElement {
    TestBed.configureTestingModule({ imports: [HistoryList], providers: [provideRouter([])] });
    TestBed.inject(I18n).lang.set('fr');
    const fixture = TestBed.createComponent(HistoryList);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('showClient', showClient);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('says who changed what, with readable old and new values', () => {
    const text = render([won]).textContent!.replace(/\s+/g, ' ');
    expect(text).toContain('Sara Mansouri a modifié l’opportunité « Licence équipe »');
    expect(text).toContain('Négociation');
    expect(text).toContain('Gagné');
    expect(text).toMatch(/45.?000 MAD/);
    expect(text).toContain('texte modifié');
    expect(text).toContain('Rif Digital');
  });

  it('shows "Système" when nobody was signed in, and hides the client on its own page', () => {
    const el = render([created], false);
    expect(el.textContent).toContain('Système a créé le client');
    expect(el.querySelector('a')).toBeNull();
  });
});
