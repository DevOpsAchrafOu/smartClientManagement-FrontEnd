import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Auth, authInterceptor } from './auth';
import { AI_API, API } from './config';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: Auth;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(Auth);
    router = TestBed.inject(Router);
    auth.token.set('token-123');
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => {
    backend.verify();
    auth.clear();
  });

  it('adds the token to API calls only (API v2 and the AI service)', () => {
    http.get(`${API}/crm/clients`).subscribe();
    expect(backend.expectOne(`${API}/crm/clients`).request.headers.get('Authorization')).toBe('Bearer token-123');
    http.get(`${AI_API}/assistant/status`).subscribe();
    expect(backend.expectOne(`${AI_API}/assistant/status`).request.headers.get('Authorization')).toBe('Bearer token-123');
    http.get('https://example.com/other').subscribe();
    expect(backend.expectOne('https://example.com/other').request.headers.has('Authorization')).toBe(false);
  });

  it('signs the user out on 401 (expired session)', () => {
    http.get(`${API}/crm/clients`).subscribe({ error: () => {} });
    backend.expectOne(`${API}/crm/clients`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.token()).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('keeps the session on 403 (not allowed for this role)', () => {
    http.get(`${API}/utilisateurs`).subscribe({ error: () => {} });
    backend.expectOne(`${API}/utilisateurs`).flush({}, { status: 403, statusText: 'Forbidden' });
    expect(auth.token()).toBe('token-123');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
