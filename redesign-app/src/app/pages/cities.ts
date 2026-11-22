import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { Api } from '../core/api';
import { City, Country } from '../core/models';
import { Icon } from '../ui/icon';
import { Modal } from '../ui/modal';
import { PageHeader } from '../ui/states';
import { Place, PlaceEditor, PlaceList } from './places';

@Component({
  selector: 'app-cities',
  imports: [ReactiveFormsModule, Icon, Modal, PageHeader, PlaceList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header [title]="e.i18n.t('cities')" [subtitle]="e.i18n.t('citiesSubtitle')">
      <button type="button" class="btn btn-primary" (click)="e.open(null, countryFilter())"><app-icon name="plus" />{{ e.i18n.t('newCity') }}</button>
    </app-page-header>

    <app-place-list [items]="filtered()" [state]="state()" icon="pin" [extraHeader]="e.i18n.t('country')" [extra]="countryName"
      (edit)="e.open($event)" (remove)="remove($event)" (retry)="load()">
      <select filters class="input sm:w-56" [value]="countryFilter()" (change)="countryFilter.set(+$any($event.target).value)" [attr.aria-label]="e.i18n.t('country')">
        <option value="0">{{ e.i18n.t('allCountries') }}</option>
        @for (c of countries(); track c.id) { <option [value]="c.id">{{ e.i18n.label(c) }}</option> }
      </select>
    </app-place-list>

    @if (e.editing() !== undefined) {
      <app-modal [title]="e.title('newCity', 'editCity')" (closed)="e.close()">
        <form id="city-form" [formGroup]="e.form" (ngSubmit)="save()" novalidate class="space-y-4">
          <div>
            <label class="label" for="v-pays">{{ e.i18n.t('country') }}</label>
            <select id="v-pays" class="input" formControlName="idPays">
              <option [ngValue]="0" disabled>{{ e.i18n.t('chooseCountry') }}</option>
              @for (c of countries(); track c.id) { <option [ngValue]="c.id">{{ e.i18n.label(c) }}</option> }
            </select>
            @if (e.form.controls.idPays.touched && e.form.controls.idPays.invalid) { <p class="field-error">{{ e.i18n.t('required') }}</p> }
          </div>
          <div>
            <label class="label" for="v-fr">{{ e.i18n.t('titleFr') }}</label>
            <input id="v-fr" class="input" formControlName="titleFr" dir="ltr" />
            @if (e.form.controls.titleFr.touched && e.form.controls.titleFr.invalid) { <p class="field-error">{{ e.i18n.t('required') }}</p> }
          </div>
          <div>
            <label class="label" for="v-ar">{{ e.i18n.t('titleAr') }}</label>
            <input id="v-ar" class="input" formControlName="titleAr" dir="rtl" lang="ar" />
            @if (e.form.controls.titleAr.touched && e.form.controls.titleAr.invalid) { <p class="field-error">{{ e.i18n.t('required') }}</p> }
          </div>
        </form>
        <ng-container modal-actions>
          <button type="button" class="btn btn-ghost" (click)="e.close()">{{ e.i18n.t('cancel') }}</button>
          <button type="submit" form="city-form" class="btn btn-primary" [disabled]="e.saving()">
            @if (e.saving()) { <app-icon name="loader" class="animate-spin" />{{ e.i18n.t('saving') }} } @else { <app-icon name="check" />{{ e.i18n.t('save') }} }
          </button>
        </ng-container>
      </app-modal>
    }
  `,
})
export class CitiesPage {
  private api = inject(Api);
  protected e = new PlaceEditor();
  protected cities = signal<City[]>([]);
  protected countries = signal<Country[]>([]);
  protected state = signal<'loading' | 'error' | 'ready'>('loading');
  protected countryFilter = signal(0);
  protected filtered = computed(() => {
    const id = this.countryFilter();
    return id ? this.cities().filter((c) => c.idPays === id) : this.cities();
  });
  protected countryName = (p: Place) => this.e.i18n.label(this.countries().find((c) => c.id === p.idPays));

  constructor() {
    // A city must belong to a country.
    this.e.form.controls.idPays.setValidators([Validators.required, Validators.min(1)]);
    this.load();
  }

  load(): void {
    this.state.set('loading');
    forkJoin({ cities: this.api.cities.list(), countries: this.api.countries.list().pipe(catchError(() => of([] as Country[]))) }).subscribe({
      next: ({ cities, countries }) => {
        this.cities.set(cities);
        this.countries.set(countries);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  save(): void {
    this.e.save(
      (body, current) => (current ? this.api.cities.update({ ...body, id: current.id }) : this.api.cities.create(body)),
      () => this.load(),
    );
  }

  remove(p: Place): void {
    this.e.remove(p, () => this.api.cities.remove(p.id), () => this.load());
  }
}
