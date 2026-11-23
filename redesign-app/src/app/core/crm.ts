import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Auth } from './auth';
import { API, SUPER_ADMIN } from './config';

/** CRM (API v2 only): types and calls. */

export type ClientStatus = 'PROSPECT' | 'CLIENT' | 'LOST';
export type ActivityType = 'CALL' | 'MEETING' | 'EMAIL' | 'NOTE' | 'TASK';
export type ActivityView = 'ALL' | 'OPEN' | 'TODAY' | 'LATE' | 'DONE';

export const CLIENT_STATUSES: ClientStatus[] = ['PROSPECT', 'CLIENT', 'LOST'];
export const ACTIVITY_TYPES: ActivityType[] = ['CALL', 'MEETING', 'EMAIL', 'NOTE', 'TASK'];

export interface Ref {
  id: number;
  label: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface ClientSummary {
  id: number;
  name: string;
  sector: string | null;
  status: ClientStatus;
  email: string | null;
  phone: string | null;
  city: Ref | null;
  country: string | null;
  owner: Ref | null;
  contacts: number;
  createdAt: string;
}

export interface Contact {
  id: number;
  clientId: number;
  firstName: string | null;
  lastName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  primary: boolean;
}

export interface ClientDetail extends Omit<ClientSummary, 'contacts'> {
  website: string | null;
  address: string | null;
  notes: string | null;
  updatedAt: string;
  contacts: Contact[];
}

export interface ClientRequest {
  name: string;
  sector?: string | null;
  status?: ClientStatus;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  cityId?: number | null;
  notes?: string | null;
  /** Only admins and sales managers can choose it; otherwise the API keeps the current owner. */
  ownerId?: number | null;
}

export type ContactRequest = Omit<Contact, 'id' | 'clientId'>;

export interface Activity {
  id: number;
  type: ActivityType;
  subject: string;
  details: string | null;
  client: Ref | null;
  contact: Ref | null;
  owner: Ref | null;
  dueAt: string | null;
  done: boolean;
  doneAt: string | null;
  late: boolean;
  createdAt: string;
}

export interface ActivityRequest {
  type: ActivityType;
  subject: string;
  details?: string | null;
  clientId?: number | null;
  contactId?: number | null;
  dueAt?: string | null;
  done?: boolean;
  ownerId?: number | null;
}

export interface ClientCounts {
  total: number;
  prospects: number;
  clients: number;
  lost: number;
}

export interface CrmDashboard {
  clients: number;
  prospects: number;
  customers: number;
  lost: number;
  newThisMonth: number;
  conversionRate: number | null;
  openActivities: number;
  lateActivities: number;
  dueToday: number;
  doneThisWeek: number;
  myOpenActivities: number;
  bySector: { label: string; value: number }[];
  byCity: { label: string; value: number }[];
  byOwner: { owner: string; clients: number; openTasks: number }[];
  upcoming: Activity[];
  recent: Activity[];
}

const CRM = `${API}/crm`;

function params(values: Record<string, string | number | boolean | null | undefined>): HttpParams {
  let p = new HttpParams();
  for (const [k, v] of Object.entries(values)) if (v !== null && v !== undefined && v !== '') p = p.set(k, String(v));
  return p;
}

@Injectable({ providedIn: 'root' })
export class Crm {
  private http = inject(HttpClient);

  clients(filter: { q?: string; status?: ClientStatus | ''; page?: number; size?: number; sort?: string }): Observable<Page<ClientSummary>> {
    return this.http.get<Page<ClientSummary>>(`${CRM}/clients`, { params: params(filter) });
  }
  clientCounts(): Observable<ClientCounts> {
    return this.http.get<ClientCounts>(`${CRM}/clients/counts`);
  }
  client(id: number): Observable<ClientDetail> {
    return this.http.get<ClientDetail>(`${CRM}/clients/${id}`);
  }
  createClient(body: ClientRequest): Observable<ClientDetail> {
    return this.http.post<ClientDetail>(`${CRM}/clients`, body);
  }
  updateClient(id: number, body: ClientRequest): Observable<ClientDetail> {
    return this.http.put<ClientDetail>(`${CRM}/clients/${id}`, body);
  }
  deleteClient(id: number): Observable<unknown> {
    return this.http.delete(`${CRM}/clients/${id}`);
  }

  addContact(clientId: number, body: ContactRequest): Observable<Contact> {
    return this.http.post<Contact>(`${CRM}/clients/${clientId}/contacts`, body);
  }
  updateContact(id: number, body: ContactRequest): Observable<Contact> {
    return this.http.put<Contact>(`${CRM}/contacts/${id}`, body);
  }
  deleteContact(id: number): Observable<unknown> {
    return this.http.delete(`${CRM}/contacts/${id}`);
  }

  activities(filter: { view?: ActivityView; clientId?: number; mine?: boolean; type?: ActivityType | ''; q?: string; page?: number; size?: number }): Observable<Page<Activity>> {
    return this.http.get<Page<Activity>>(`${CRM}/activities`, { params: params(filter) });
  }
  createActivity(body: ActivityRequest): Observable<Activity> {
    return this.http.post<Activity>(`${CRM}/activities`, body);
  }
  updateActivity(id: number, body: ActivityRequest): Observable<Activity> {
    return this.http.put<Activity>(`${CRM}/activities/${id}`, body);
  }
  setDone(id: number, done: boolean): Observable<Activity> {
    return this.http.put<Activity>(`${CRM}/activities/${id}/done`, { done });
  }
  deleteActivity(id: number): Observable<unknown> {
    return this.http.delete(`${CRM}/activities/${id}`);
  }

  dashboard(): Observable<CrmDashboard> {
    return this.http.get<CrmDashboard>(`${CRM}/dashboard`);
  }
  /** Active users who can own a client or an activity. */
  owners(): Observable<Ref[]> {
    return this.http.get<Ref[]>(`${CRM}/owners`);
  }
}

/**
 * What the connected user may do in the CRM (the API checks it again):
 * sales people (ROLE_SALES) only see their own records, read-only users (ROLE_VIEWER) change nothing,
 * admins and sales managers (ROLE_MANAGER) choose owners and delete clients.
 */
@Injectable({ providedIn: 'root' })
export class CrmRights {
  private auth = inject(Auth);
  private role = computed(() => this.auth.user()?.role ?? '');
  readonly canEdit = computed(() => this.role() !== 'ROLE_VIEWER');
  readonly canAssign = computed(() => [SUPER_ADMIN, 'ROLE_ADMIN', 'ROLE_MANAGER'].includes(this.role()));
  readonly canDeleteClient = this.canAssign;
  readonly ownOnly = computed(() => this.role() === 'ROLE_SALES');
  readonly readOnly = computed(() => this.role() === 'ROLE_VIEWER');
}

/** Icon and colours of each activity type and client status. */
export const ACTIVITY_ICON: Record<ActivityType, string> = { CALL: 'phone', MEETING: 'calendar', EMAIL: 'mail', NOTE: 'note', TASK: 'task' };
export const ACTIVITY_TONE: Record<ActivityType, string> = {
  CALL: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  MEETING: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  EMAIL: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  NOTE: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
  TASK: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
};
export const STATUS_TONE: Record<ClientStatus, string> = {
  PROSPECT: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  CLIENT: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  LOST: 'bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300',
};

/** "2026-11-23T10:00:00" → value for <input type="datetime-local"> and back. */
export const toLocalInput = (iso: string | null | undefined) => (iso ? iso.slice(0, 16) : '');
export const fromLocalInput = (value: string) => (value ? `${value.length === 16 ? value + ':00' : value}` : null);
