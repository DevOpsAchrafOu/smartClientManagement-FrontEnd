import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';

const STORAGE_KEY = 'scm_theme';

function initialDark(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored === 'dark';
  } catch {}
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Light / dark mode: follows the system first, then the user's choice. */
@Injectable({ providedIn: 'root' })
export class Theme {
  private doc = inject(DOCUMENT);
  readonly dark = signal(initialDark());

  constructor() {
    effect(() => {
      const dark = this.dark();
      this.doc.documentElement.classList.toggle('dark', dark);
      this.doc.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    });
  }

  toggle(): void {
    this.dark.update((d) => !d);
    try {
      localStorage.setItem(STORAGE_KEY, this.dark() ? 'dark' : 'light');
    } catch {}
  }
}
