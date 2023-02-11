import { UtilisateurComponent } from './components/administration/utilisateur/utilisateur.component';
import { TestComponent } from './tests/test/test.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutComponent } from './components/base/layout/layout.component';
import { HomeComponent } from './components/home/home.component';

import { LoginComponent } from './components/login/login.component';
import { AuthGuardService } from './services/security/auth-guard.service';
import { RoleComponent } from './components/administration/role/role.component';
import { MenuComponent } from './components/administration/menu/menu.component';
import { PaysComponent } from './components/parametres/pays/pays.component';
import { VilleComponent } from './components/parametres/ville/ville.component';


const routes: Routes = [
  { path: "login", component: LoginComponent },
  { path: "test", component: TestComponent },
  // { path: "forgot-password", component: ForgotPasswordComponent },
  // { path: 'edit-password', component: EditPasswordComponent, canActivate: [AuthGuardService]},
  { path: '', redirectTo: '/', pathMatch: 'full' },
  {
    path: '', component: LayoutComponent, children: [
      { path: '', component: HomeComponent },
      { path: 'home', component: HomeComponent },

      { path: 'administration/list-user', component: UtilisateurComponent },
      { path: 'administration/list-role', component: RoleComponent },
      { path: 'administration/list-menu', component: MenuComponent },

      { path: 'parametres/list-pays', component: PaysComponent },
      { path: 'parametres/list-ville', component: VilleComponent },
    ]
    , canActivate: [AuthGuardService]
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
