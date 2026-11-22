import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  kind: 'success' | 'error' | 'info';
  text: string;
}

/** Short notifications shown at the bottom of the screen. */
@Injectable({ providedIn: 'root' })
export class Toasts {
  readonly items = signal<Toast[]>([]);
  private next = 1;

  show(kind: Toast['kind'], text: string, ms = 4000): void {
    const id = this.next++;
    this.items.update((list) => [...list, { id, kind, text }]);
    setTimeout(() => this.dismiss(id), ms);
  }
  success(text: string): void {
    this.show('success', text);
  }
  error(text: string): void {
    this.show('error', text, 6000);
  }
  dismiss(id: number): void {
    this.items.update((list) => list.filter((t) => t.id !== id));
  }
}

/** One confirmation dialog at a time, answered with a promise. */
@Injectable({ providedIn: 'root' })
export class Confirm {
  readonly request = signal<{ title: string; text: string; resolve: (ok: boolean) => void } | null>(null);

  ask(title: string, text: string): Promise<boolean> {
    return new Promise((resolve) => this.request.set({ title, text, resolve }));
  }
  answer(ok: boolean): void {
    this.request()?.resolve(ok);
    this.request.set(null);
  }
}
