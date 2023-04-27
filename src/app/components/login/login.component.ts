import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/app/services/security/auth.service';
import { AlertSwalService } from 'src/app/services/utils/alert-swal.service';
import { CurrentLangService } from 'src/app/services/utils/current-lang.service';
import { GestionMsgAndStatusService } from 'src/app/services/utils/gestion-msg-and-status.service';
import { Login } from './../../interfaces/login';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  /********************************************************************************************/
  /**************************************** The attributes  ***********************************/
  /********************************************************************************************/
  loading : boolean = false;
  token: string = "";
  formLogin: FormGroup;
  isSubmitLogin = false;
  messageError: string = "";
  currentLang : string = "";

  /********************************************************************************************/
  /************************************* Initialization functions  ****************************/
  /*******************************************************************************************/

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private toastr : ToastrService,
    private alertServ : AlertSwalService,
    private route: Router,
    private messageServ : GestionMsgAndStatusService,
    private currnetLangService: CurrentLangService,
    public transtale : TranslateService,//pour utiliser dans View


  ) {
        //initialize  Form
        this.formLogin = this.formBuilder.group({
          username: ["", Validators.required],
          password: ["", Validators.required],
        })
  }

  ngOnInit() : void {
    //user is connected or not
    this.doAuthUser();

    // get current lang
    this.currentLang = localStorage.getItem('currentLang_client_mng') || 'fr';
    this.currentLang = this.currnetLangService.currentLang(this.currentLang);
     //init gestionMsg
     this.messageServ.initMessage();
  }

  /********************************************************************************************/
  /**************************************  The functions **************************************/
  /********************************************************************************************/

  onFormSubmit(form : FormGroup): void {
    this.loading = true;// start Loading
    this.isSubmitLogin = true;
    if (this.formLogin.invalid) { return }

    let user: Login = {...form.value};
    user.username = user.username.trim();
    user.password = user.password.trim();

    this.authService.login(user)
    .pipe(
    map(response => {
      return response.headers.get("Authorization");
    }))
      .subscribe(
        (response : any) => {
          if(response ){

            let token = response;
            this.authService.saveToken(token);
            this.route.navigate(["/home"]);
            console.log('navigate / okay');

          }
          else{
            this.toastr.error("",this.messageServ.getMessage("MSGERROR-MAIL-NOT-EXIST") || '',this.alertServ.configToastr);

          }
          this.loading = false;// end Loading

        },
        error => {
          if(error.status === 401){
            this.toastr.error("",this.messageServ.getMessage("MSGERROR-UNKNOWN-USERNAME-PASSWORD") || '',this.alertServ.configToastr);
          }
          else{
            this.toastr.error("",this.messageServ.getMessage("MSGERROR-CONNECTION-REFUSED") || '',this.alertServ.configToastr);
          }
          this.loading = false;// end Loading
        }
      );
  }

  doAuthUser(){
    let isAuth = this.authService.isConnected();
    console.log("login doAuthUser " + isAuth);
    if(isAuth){
      this.route.navigate(["/home"]);
    }
  }

  changeCurrentLang(lang : string){
    this.currentLang =this.currnetLangService.currentLang(lang);
  }


}
