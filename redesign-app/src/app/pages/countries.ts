import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { Api } from '../core/api';
import { City, Country } from '../core/models';
import { Icon } from '../ui/icon';
import { Modal } from '../ui/modal';
import { PageHeader } from '../ui/states';
import { Place, PlaceEditor, PlaceList } from './places';

@Component({
  selector: 'app-countries',
  imports: [ReactiveFormsModule, Icon, Modal, PageHeader, PlaceList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header [title]="e.i18n.t('countries')" [subtitle]="e.i18n.t('countriesSubtitle')">
      <button type="button" class="btn btn-primary" (click)="e.open(null)"><app-icon name="plus" />{{ e.i18n.t('newCountry') }}</button>
    </app-page-header>

    <app-place-list [items]="countries()" [state]="state()" icon="globe" [extraHeader]="e.i18n.t('cities')" [extra]="cityCount"
      (edit)="e.open($event)" (remove)="remove($event)" (retry)="load()" />

    @if (e.editing() !== undefined) {
      <app-modal [title]="e.title('newCountry', 'editCountry')" (closed)="e.close()">
        <form id="country-form" [formGroup]="e.form" (ngSubmit)="save()" novalidate class="space-y-4">
          <div>
            <label class="label" for="c-fr">{{ e.i18n.t('titleFr') }}</label>
            <input id="c-fr" class="input" formControlName="titleFr" dir="ltr" />
            @if (e.form.controls.titleFr.touched && e.form.controls.titleFr.invalid) { <p class="field-error">{{ e.i18n.t('required') }}</p> }
          </div>
          <div>
            <label class="label" for="c-ar">{{ e.i18n.t('titleAr') }}</label>
            <input id="c-ar" class="input" formControlName="titleAr" dir="rtl" lang="ar" />
            @if (e.form.controls.titleAr.touched && e.form.controls.titleAr.invalid) { <p class="field-error">{{ e.i18n.t('required') }}</p> }
          </div>
        </form>
        <ng-container modal-actions>
          <button type="button" class="btn btn-ghost" (click)="e.close()">{{ e.i18n.t('cancel') }}</button>
          <button type="submit" form="country-form" class="btn btn-primary" [disabled]="e.saving()">
            @if (e.saving()) { <app-icon name="loader" class="animate-spin" />{{ e.i18n.t('saving') }} } @else { <app-icon name="check" />{{ e.i18n.t('save') }} }
          </button>
        </ng-container>
      </app-modal>
    }
  `,
})
export class CountriesPage {
  private api = inject(Api);
  protected e = new PlaceEditor();
  protected countries = signal<Country[]>([]);
  protected cities = signal<City[]>([]);
  protected state = signal<'loading' | 'error' | 'ready'>('loading');
  protected cityCount = (p: Place) => String(this.cities().filter((c) => c.idPays === p.id).length);

  constructor() {
    this.load();
  }

  load(): void {
    this.state.set('loading');
    forkJoin({ countries: this.api.countries.list(), cities: this.api.cities.list().pipe(catchError(() => of([] as City[]))) }).subscribe({
      next: ({ countries, cities }) => {
        this.countries.set(countries);
        this.cities.set(cities);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  save(): void {
    this.e.save(
      (body, current) => (current ? this.api.countries.update({ ...body, id: current.id }) : this.api.countries.create(body)),
      () => this.load(),
    );
  }

  remove(p: Place): void {
    this.e.remove(p, () => this.api.countries.remove(p.id), () => this.load());
  }
}
