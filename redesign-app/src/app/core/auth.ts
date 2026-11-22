import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, catchError, firstValueFrom, map, tap, throwError } from 'rxjs';
import { API, API_ORIGIN, SUPER_ADMIN } from './config';
import { I18n } from './i18n';
import { User } from './models';
import { Toasts } from './toast';

const TOKEN_KEY = 'scm_token';
const USER_KEY = 'scm_user';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
}

/** Session: JWT token (sent as "Bearer …") and the connected user. */
@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly token = signal<string | null>(read(TOKEN_KEY));
  readonly user = signal<User | null>(JSON.parse(read(USER_KEY) ?? 'null'));
  readonly isSuperAdmin = computed(() => this.user()?.role === SUPER_ADMIN);
  readonly initials = computed(() => {
    const u = this.user();
    return ((u?.prenom?.[0] ?? '') + (u?.nom?.[0] ?? '')).toUpperCase() || 'U';
  });

  /** POST /login answers with the token in the "Authorization" header. */
  login(username: string, password: string): Observable<void> {
    return this.http
      .post(`${API_ORIGIN}/login`, { username, password }, { observe: 'response', responseType: 'text' })
      .pipe(
        map((res) => {
          const token = res.headers.get('Authorization');
          if (!token) throw new HttpErrorResponse({ status: 401 });
          this.token.set(token.replace(/^Bearer /, ''));
          write(TOKEN_KEY, this.token());
        }),
      );
  }

  loadMe(): Observable<User> {
    return this.http.get<User>(`${API}/utilisateurs/me`).pipe(
      tap((user) => {
        this.user.set(user);
        write(USER_KEY, JSON.stringify(user));
      }),
    );
  }

  /** Clears the session; the backend logout call is best effort. */
  logout(): void {
    if (this.token()) firstValueFrom(this.http.get(`${API}/public/logout`, { responseType: 'text' })).catch(() => {});
    this.clear();
    this.router.navigateByUrl('/login');
  }

  clear(): void {
    this.token.set(null);
    this.user.set(null);
    write(TOKEN_KEY, null);
    write(USER_KEY, null);
  }
}

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  return auth.token() ? true : inject(Router).parseUrl('/login');
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  return auth.token() ? inject(Router).parseUrl('/dashboard') : true;
};

/** Adds the token to API calls; on 401/403 the session is closed and the user goes back to the login page. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const toasts = inject(Toasts);
  const i18n = inject(I18n);
  const token = auth.token();
  const isApi = req.url.startsWith(API);
  const authed = token && isApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(authed).pipe(
    catchError((err: HttpErrorResponse) => {
      if (isApi && token && (err.status === 401 || err.status === 403) && !req.url.includes('/public/')) {
        auth.clear();
        toasts.error(i18n.t('sessionExpired'));
        router.navigateByUrl('/login');
      }
      return throwError(() => err);
    }),
  );
};
