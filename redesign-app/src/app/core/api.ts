import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from './config';
import { City, Country, Menu, Role, User } from './models';

/**
 * Small typed wrapper around one REST collection.
 * PUT and DELETE answers vary (JSON or plain text), so their body is read as text and ignored.
 */
class Collection<T extends { id: number }> {
  constructor(
    private http: HttpClient,
    private path: string,
    private createPath = path,
    private slash = '/',
  ) {}

  list(): Observable<T[]> {
    return this.http.get<T[]>(`${API}${this.path}`);
  }
  create(item: Partial<T>): Observable<T> {
    return this.http.post<T>(`${API}${this.createPath}`, item);
  }
  update(item: Partial<T> & { id: number }): Observable<string> {
    return this.http.put(`${API}${this.path}/${item.id}${this.slash}`, item, { responseType: 'text' });
  }
  remove(id: number): Observable<string> {
    return this.http.delete(`${API}${this.path}/${id}${this.slash}`, { responseType: 'text' });
  }
}

@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);

  readonly users = new Collection<User>(this.http, '/utilisateurs', '/signup');
  readonly roles = new Collection<Role>(this.http, '/roles', '/roles', '');
  readonly menus = new Collection<Menu>(this.http, '/menus');
  readonly countries = new Collection<Country>(this.http, '/pays');
  readonly cities = new Collection<City>(this.http, '/villes');

  me(): Observable<User> {
    return this.http.get<User>(`${API}/utilisateurs/me`);
  }
  myMenus(): Observable<Menu[]> {
    return this.http.get<Menu[]>(`${API}/menus/userConnected`);
  }
  usersInRole(id: number): Observable<number> {
    return this.http.get<number>(`${API}/roles/utilisateur/count/${id}`);
  }
}

/** Flattens a menu list that may come as a tree (children) or flat (parentId). */
export function flattenMenus(list: Menu[]): Menu[] {
  const seen = new Map<number, Menu>();
  const walk = (items: Menu[] | undefined) =>
    items?.forEach((m) => {
      if (!seen.has(m.id)) seen.set(m.id, { ...m, children: undefined });
      walk(m.children);
    });
  walk(list);
  return [...seen.values()];
}

export type MenuNode = Menu & { children: Menu[] };

/** Builds the parent → children tree, both levels sorted by "order". */
export function menuTree(list: Menu[]): MenuNode[] {
  const flat = flattenMenus(list).sort((a, b) => a.order - b.order);
  const ids = new Set(flat.map((m) => m.id));
  return flat
    .filter((m) => !m.parentId || !ids.has(m.parentId))
    .map((p) => ({ ...p, children: flat.filter((c) => c.parentId === p.id) }));
}

/** Maps a backend menu URL (e.g. "/parametrage/list-pays") to a route of this app. */
export function routeForMenu(url: string | undefined): string | null {
  if (!url || url === '#') return null;
  const last = url.split('/').filter(Boolean).pop() ?? '';
  const map: Record<string, string> = {
    home: '/dashboard',
    'list-user': '/users',
    'list-role': '/roles',
    'list-menu': '/menus',
    'list-pays': '/countries',
    'list-ville': '/cities',
  };
  return map[last] ?? null;
}

/** Reads a readable message from an HTTP error (backend sends { message } or text). */
export function errorMessage(err: unknown): string | null {
  const e = err as { error?: unknown };
  if (typeof e?.error === 'string') {
    try {
      const parsed = JSON.parse(e.error);
      return parsed?.message ?? null;
    } catch {
      return e.error.length < 160 ? e.error : null;
    }
  }
  const msg = (e?.error as { message?: string })?.message;
  return typeof msg === 'string' ? msg : null;
}
