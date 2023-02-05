import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutComponent } from './components/base/layout/layout.component';
import { HomeComponent } from './components/home/home.component';

import { LoginComponent } from './components/login/login.component';
import { AuthGuardService } from './services/security/auth-guard.service';


const routes: Routes = [
  { path: "login", component: LoginComponent },
  // { path: "forgot-password", component: ForgotPasswordComponent },
  // { path: 'edit-password', component: EditPasswordComponent, canActivate: [AuthGuardService]},
  { path: '', redirectTo: '/', pathMatch: 'full' },
  {
    path: '', component: LayoutComponent, children: [
      { path: '', component: HomeComponent },
      { path: 'home', component: HomeComponent },

    ]
    , canActivate: [AuthGuardService]
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
