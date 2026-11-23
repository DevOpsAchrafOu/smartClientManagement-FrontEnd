import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withHashLocation, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    // Hash URLs (#/users): GitHub Pages has no server-side fallback for deep links in /redesign/.
    provideRouter(routes, withHashLocation(), withComponentInputBinding(), withViewTransitions(), withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
  ],
};
