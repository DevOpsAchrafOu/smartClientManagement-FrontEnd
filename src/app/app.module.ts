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
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SidebarComponent,
    HeaderComponent,
    LayoutComponent,
    FooterComponent,
    HomeComponent,
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
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

//the files 'fr'/'ar' loader with http
export function createTranslateLoader(http : HttpClient){

  return new TranslateHttpLoader(http,"assets/i18n/",".json");//reposetory to file with extension
}
