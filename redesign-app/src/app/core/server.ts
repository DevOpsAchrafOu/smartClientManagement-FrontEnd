import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { API } from './config';

export type ServerState = 'checking' | 'waking' | 'ready' | 'down';

/**
 * Wakes the free Render backend as soon as the login page opens, and tells the user
 * when it is slow ("waking") instead of letting the app look broken.
 */
@Injectable({ providedIn: 'root' })
export class Server {
  private http = inject(HttpClient);
  readonly state = signal<ServerState>('checking');
  private started = false;

  wake(): void {
    if (this.started && this.state() !== 'down') return;
    this.started = true;
    this.state.set('checking');
    const slow = setTimeout(() => this.state() === 'checking' && this.state.set('waking'), 2500);
    const attempt = (left: number) =>
      this.http.get(`${API}/public/about`, { responseType: 'text' }).subscribe({
        next: () => {
          clearTimeout(slow);
          this.state.set('ready');
        },
        error: () => {
          if (left > 0) setTimeout(() => attempt(left - 1), 5000);
          else {
            clearTimeout(slow);
            this.state.set('down');
          }
        },
      });
    attempt(12);
  }
}
