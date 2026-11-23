import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Auth } from './auth';
import { CrmRights, STAGE_PROBABILITY, STAGES, formatMad, fromLocalInput, toLocalInput } from './crm';

/** CrmRights for a user with this role (only Auth.user is read). */
function rightsFor(role: string): CrmRights {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: Auth, useValue: { user: signal({ role }) } }] });
  return TestBed.inject(CrmRights);
}

describe('CrmRights', () => {
  it('lets admins and sales managers do everything', () => {
    for (const role of ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_MANAGER']) {
      const r = rightsFor(role);
      expect(r.canEdit()).toBe(true);
      expect(r.canAssign()).toBe(true);
      expect(r.canDeleteClient()).toBe(true);
      expect(r.ownOnly()).toBe(false);
    }
  });

  it('limits a sales person to their own records, without owner choice or client deletion', () => {
    const r = rightsFor('ROLE_SALES');
    expect(r.canEdit()).toBe(true);
    expect(r.ownOnly()).toBe(true);
    expect(r.canAssign()).toBe(false);
    expect(r.canDeleteClient()).toBe(false);
  });

  it('gives read-only users no change at all', () => {
    const r = rightsFor('ROLE_VIEWER');
    expect(r.readOnly()).toBe(true);
    expect(r.canEdit()).toBe(false);
    expect(r.canAssign()).toBe(false);
    expect(r.canDeleteClient()).toBe(false);
  });

  it('keeps the plain user role able to work but not to delete clients', () => {
    const r = rightsFor('ROLE_USER');
    expect(r.canEdit()).toBe(true);
    expect(r.ownOnly()).toBe(false);
    expect(r.canDeleteClient()).toBe(false);
  });
});

describe('pipeline stages', () => {
  it('lists the 6 stages in order with the same probabilities as the API', () => {
    expect(STAGES).toEqual(['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']);
    expect(STAGES.map((s) => STAGE_PROBABILITY[s])).toEqual([10, 25, 50, 75, 100, 0]);
  });
});

describe('formatMad', () => {
  // Intl uses narrow no-break spaces as group separators in some locales: compare digits only.
  const digits = (s: string) => s.replace(/[^\d]/g, '');

  it('shows French amounts in MAD and Arabic ones in dirhams', () => {
    expect(formatMad(185000, 'fr')).toMatch(/MAD$/);
    expect(digits(formatMad(185000, 'fr'))).toBe('185000');
    expect(formatMad(45000, 'ar')).toMatch(/د\.م\.$/);
  });

  it('uses a dash for a missing amount', () => {
    expect(formatMad(null, 'fr')).toBe('—');
    expect(formatMad(undefined, 'fr')).toBe('—');
  });

  it('can shorten large amounts', () => {
    // 368 500 → "368,5 k MAD"
    expect(formatMad(368500, 'fr', true)).toMatch(/^368,5\s?k MAD$/);
  });
});

describe('date inputs', () => {
  it('converts API dates to datetime-local values and back', () => {
    expect(toLocalInput('2026-11-23T10:00:00')).toBe('2026-11-23T10:00');
    expect(toLocalInput(null)).toBe('');
    expect(fromLocalInput('2026-11-23T10:00')).toBe('2026-11-23T10:00:00');
    expect(fromLocalInput('')).toBeNull();
  });
});
