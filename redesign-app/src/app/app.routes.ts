import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth';

export const routes: Routes = [
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./pages/login').then((m) => m.LoginPage) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard').then((m) => m.DashboardPage) },
      { path: 'users', loadComponent: () => import('./pages/users').then((m) => m.UsersPage) },
      { path: 'roles', loadComponent: () => import('./pages/roles').then((m) => m.RolesPage) },
      { path: 'menus', loadComponent: () => import('./pages/menus').then((m) => m.MenusPage) },
      { path: 'countries', loadComponent: () => import('./pages/countries').then((m) => m.CountriesPage) },
      { path: 'cities', loadComponent: () => import('./pages/cities').then((m) => m.CitiesPage) },
      // CRM (version 2 only)
      { path: 'crm', loadComponent: () => import('./pages/crm/crm-dashboard').then((m) => m.CrmDashboardPage) },
      { path: 'crm/clients', loadComponent: () => import('./pages/crm/clients').then((m) => m.CrmClientsPage) },
      { path: 'crm/clients/:id', loadComponent: () => import('./pages/crm/client-detail').then((m) => m.CrmClientDetailPage) },
      { path: 'crm/activities', loadComponent: () => import('./pages/crm/activities').then((m) => m.CrmActivitiesPage) },
    ],
  },
  { path: '**', redirectTo: '' },
];
