import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { switchMap } from 'rxjs';
import { Auth } from '../core/auth';
import { I18n, I18nKey } from '../core/i18n';
import { Server } from '../core/server';
import { Theme } from '../core/theme';
import { Icon } from '../ui/icon';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <!-- Brand panel -->
      <aside class="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col">
        <div class="pointer-events-none absolute -top-40 -start-40 size-[34rem] rounded-full bg-brand/40 blur-3xl"></div>
        <div class="pointer-events-none absolute -bottom-48 end-[-10rem] size-[30rem] rounded-full bg-brand-2/30 blur-3xl"></div>
        <div class="pointer-events-none absolute inset-0 opacity-[.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:44px_44px]"></div>

        <div class="relative flex items-center gap-3">
          <img src="favicon.svg" alt="" class="size-10" />
          <span class="text-lg font-bold tracking-tight">{{ i18n.t('appName') }}</span>
        </div>

        <div class="relative my-auto max-w-lg">
          <h1 class="text-4xl leading-tight font-extrabold tracking-tight text-balance xl:text-5xl">{{ i18n.t('tagline') }}</h1>
          <ul class="mt-10 space-y-4">
            @for (p of points; track p.key) {
              <li class="flex items-center gap-3 text-slate-200">
                <span class="grid size-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15"><app-icon [name]="p.icon" /></span>
                {{ i18n.t(p.key) }}
              </li>
            }
          </ul>
        </div>

        <!-- Mini preview of the dashboard -->
        <div class="relative grid grid-cols-3 gap-3">
          @for (s of preview; track s.icon) {
            <div class="rounded-2xl bg-white/[.06] p-4 ring-1 ring-white/10 backdrop-blur">
              <app-icon [name]="s.icon" class="text-cyan-300" />
              <p class="mt-3 font-semibold">{{ i18n.t(s.key) }}</p>
            </div>
          }
        </div>
      </aside>

      <!-- Form -->
      <main class="flex flex-col px-5 py-6 sm:px-10">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2 lg:invisible">
            <img src="favicon.svg" alt="" class="size-9" />
            <span class="font-bold text-strong">{{ i18n.t('appName') }}</span>
          </div>
          <div class="flex items-center gap-1">
            <button type="button" class="btn btn-ghost min-h-10 px-3" (click)="i18n.toggle()"><app-icon name="languages" [size]="16" />{{ i18n.t('language') }}</button>
            <button type="button" class="icon-btn" (click)="theme.toggle()" [attr.aria-label]="theme.dark() ? i18n.t('lightMode') : i18n.t('darkMode')">
              <app-icon [name]="theme.dark() ? 'sun' : 'moon'" />
            </button>
          </div>
        </div>

        <div class="animate-rise mx-auto my-auto w-full max-w-sm py-10">
          <h2 class="text-3xl font-bold tracking-tight text-strong">{{ i18n.t('loginTitle') }}</h2>
          <p class="mt-2 text-muted">{{ i18n.t('loginSubtitle') }}</p>

          <div class="mt-6 flex items-center gap-2.5 rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-sm" role="status">
            @switch (server.state()) {
              @case ('ready') { <span class="size-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px] shadow-emerald-500/20"></span>{{ i18n.t('serverReady') }} }
              @case ('waking') { <app-icon name="loader" [size]="16" class="animate-spin text-amber-500" /><span>{{ i18n.t('serverWaking') }}</span> }
              @case ('down') { <span class="size-2.5 rounded-full bg-rose-500"></span>{{ i18n.t('serverUnreachable') }} }
              @default { <app-icon name="loader" [size]="16" class="animate-spin text-muted" />{{ i18n.t('serverChecking') }} }
            }
          </div>

          <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div>
              <label class="label" for="username">{{ i18n.t('username') }}</label>
              <div class="relative">
                <app-icon name="user" class="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input id="username" class="input ps-10" formControlName="username" autocomplete="username" autocapitalize="none" spellcheck="false" />
              </div>
              @if (form.controls.username.touched && form.controls.username.invalid) { <p class="field-error">{{ i18n.t('required') }}</p> }
            </div>
            <div>
              <label class="label" for="password">{{ i18n.t('password') }}</label>
              <div class="relative">
                <app-icon name="key" class="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input id="password" class="input ps-10 pe-11" formControlName="password" autocomplete="current-password" [type]="showPassword() ? 'text' : 'password'" />
                <button type="button" class="absolute end-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-strong" (click)="showPassword.set(!showPassword())" [attr.aria-pressed]="showPassword()" [attr.aria-label]="i18n.t('password')">
                  <app-icon [name]="showPassword() ? 'eyeOff' : 'eye'" />
                </button>
              </div>
              @if (form.controls.password.touched && form.controls.password.invalid) { <p class="field-error">{{ i18n.t('required') }}</p> }
            </div>

            @if (error()) {
              <p class="animate-pop flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" role="alert">
                <app-icon name="alert" [size]="16" class="mt-0.5" />{{ i18n.t(error()!) }}
              </p>
            }

            <button type="submit" class="btn btn-primary w-full" [disabled]="loading()">
              @if (loading()) { <app-icon name="loader" class="animate-spin" />{{ i18n.t('signingIn') }} } @else { {{ i18n.t('signIn') }}<app-icon name="arrowRight" class="rtl:rotate-180" /> }
            </button>
          </form>
        </div>

        <footer class="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <span>{{ i18n.t('footer') }}</span>
          <a href="../" class="inline-flex items-center gap-1.5 font-medium hover:text-strong">{{ i18n.t('oldVersion') }}<app-icon name="external" [size]="14" /></a>
        </footer>
      </main>
    </div>
  `,
})
export class LoginPage {
  protected i18n = inject(I18n);
  protected theme = inject(Theme);
  protected server = inject(Server);
  private auth = inject(Auth);
  private router = inject(Router);

  protected form = inject(FormBuilder).nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  protected loading = signal(false);
  protected error = signal<I18nKey | null>(null);
  protected showPassword = signal(false);

  protected points: { icon: string; key: I18nKey }[] = [
    { icon: 'shield', key: 'heroPoint1' },
    { icon: 'layers', key: 'heroPoint2' },
    { icon: 'globe', key: 'heroPoint3' },
  ];
  protected preview: { icon: string; key: I18nKey }[] = [
    { icon: 'users', key: 'users' },
    { icon: 'shield', key: 'roles' },
    { icon: 'pin', key: 'cities' },
  ];

  constructor() {
    this.server.wake();
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;
    const { username, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);
    this.auth
      .login(username.trim(), password)
      .pipe(switchMap(() => this.auth.loadMe()))
      .subscribe({
        next: () => this.router.navigateByUrl('/dashboard'),
        error: (err: HttpErrorResponse) => {
          this.auth.clear();
          this.loading.set(false);
          this.error.set(err.status === 401 || err.status === 403 ? 'badCredentials' : 'serverUnreachable');
        },
      });
  }
}
