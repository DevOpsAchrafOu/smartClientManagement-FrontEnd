import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Crm, ImportReport } from '../core/crm';
import { ImportClientsDialog } from './csv-ui';

describe('ImportClientsDialog', () => {
  const checked: ImportReport = { dryRun: true, rows: 3, created: 2, skipped: 1, errors: [{ line: 3, message: '« Atlas » existe déjà : ligne ignorée.' }] };
  const done: ImportReport = { ...checked, dryRun: false };

  function setup() {
    const crm = { importClients: vi.fn((_f: File, dryRun: boolean) => of(dryRun ? checked : done)), importTemplate: vi.fn(() => of(undefined)) };
    TestBed.configureTestingModule({ imports: [ImportClientsDialog], providers: [{ provide: Crm, useValue: crm }] });
    const fixture = TestBed.createComponent(ImportClientsDialog);
    fixture.detectChanges();
    return { fixture, crm, dialog: fixture.componentInstance as any };
  }

  it('checks the file first, then imports only when asked', () => {
    const { fixture, crm, dialog } = setup();
    const imported = vi.fn();
    dialog.imported.subscribe(imported);
    const file = new File(['nom\nA\nB\nAtlas'], 'clients.csv', { type: 'text/csv' });

    dialog.pick(file);
    dialog.send(true);
    fixture.detectChanges();
    expect(crm.importClients).toHaveBeenLastCalledWith(file, true);
    expect(imported).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('existe déjà');

    dialog.send(false);
    expect(crm.importClients).toHaveBeenLastCalledWith(file, false);
    expect(imported).toHaveBeenCalledWith(2);
  });

  it('forgets the previous check when another file is chosen', () => {
    const { dialog } = setup();
    dialog.pick(new File(['nom\nA'], 'a.csv'));
    dialog.send(true);
    expect(dialog.report()).not.toBeNull();
    dialog.pick(new File(['nom\nB'], 'b.csv'));
    expect(dialog.report()).toBeNull();
  });
});
