import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { SidebarComponent } from './components/base/sidebar/sidebar.component';
import { HeaderComponent } from './components/base/header/header.component';
import { FooterComponent } from './components/base/footer/footer.component';
import { HomeComponent } from './components/home/home.component';
import { LayoutComponent } from './components/base/layout/layout.component';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';
import { NgSelect2Module } from 'ng-select2';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TestComponent } from './tests/test/test.component';
import { UtilisateurComponent } from './components/administration/utilisateur/utilisateur.component';
import { RoleComponent } from './components/administration/role/role.component';
import { PaysComponent } from './components/parametres/pays/pays.component';
import { VilleComponent } from './components/parametres/ville/ville.component';
import { DatePipe } from '@angular/common';
import { TokenHtppInterceptorService } from './services/security/token-htpp-interceptor.service';
import { AddRoleComponent } from './components/administration/role/add-role/add-role.component';
import { AddUtilisateurComponent } from './components/administration/utilisateur/add-utilisateur/add-utilisateur.component';
import { MenuComponent } from './components/administration/menu/menu.component';
import { AddMenuComponent } from './components/administration/menu/add-menu/add-menu.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SidebarComponent,
    HeaderComponent,
    LayoutComponent,
    FooterComponent,
    HomeComponent,
    TestComponent,
    UtilisateurComponent,
    RoleComponent,
    PaysComponent,
    VilleComponent,
    AddRoleComponent,
    AddUtilisateurComponent,
    MenuComponent,
    AddMenuComponent,
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,//pour If for
    FormsModule,//pour ngForms
    ReactiveFormsModule,
    NgbModule,//ng boostrap
    ToastrModule.forRoot(),//Toastr
    NgSelect2Module,
    HttpClientModule,
    TranslateModule.forRoot({
      defaultLanguage : "fr",
      loader:{//for use class "TranslateLoader" like service
        provide : TranslateLoader,
        useFactory :createTranslateLoader,
        deps: [HttpClient]//argument to function  createTranslateLoader()
      }
    }),//Translate for i18n internationalization
  ],
  providers: [
    DatePipe,// for date pipe
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenHtppInterceptorService, // for Token Htpp Interceptor
      multi: true
    }
  ],
  bootstrap: [AppComponent],
  entryComponents : [AddUtilisateurComponent,AddRoleComponent,AddMenuComponent
    ]
})
export class AppModule { }

//the files 'fr'/'ar' loader with http
export function createTranslateLoader(http : HttpClient){

  return new TranslateHttpLoader(http,"assets/i18n/",".json");//reposetory to file with extension
}
