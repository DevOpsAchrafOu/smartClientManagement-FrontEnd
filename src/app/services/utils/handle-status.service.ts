import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../security/auth.service';
import { AlertSwalService } from './alert-swal.service';
import { GestionMsgAndStatusService } from './gestion-msg-and-status.service';

@Injectable({
  providedIn: 'root'
})
export class HandleStatusService {



  constructor(
    private toastr: ToastrService,
    private alertSwalServ : AlertSwalService,//property for alert(toastr and Swal)
    private authService:AuthService,
    private messageServ : GestionMsgAndStatusService,
    private route: Router
    ) { }

    onHandleCodeStatus(error : any){

      if(error.status){
        var regexp = new RegExp("5[0-9][0-9]");
        let test = regexp.test(error.status);
        if(test == true){
          //msg : Une erreur s'est produite !
          this.toastr.error("", this.messageServ.getMessage('MSGERROR-ANY-500'),this.alertSwalServ.configToastr);
          this.route.navigate(["/"]);
        }else{
          switch(error.status) {

            case 409: {
              //msg : élément déjà existé
              this.toastr.error("", this.messageServ.elementExists,this.alertSwalServ.configToastr);;
               break;
            }
            case 400 || 404  : {
              //msg : Une erreur s'est produite !
              this.toastr.error("", this.messageServ.bodyToastrAny,this.alertSwalServ.configToastr);
              break;
           }
            case  403  : {
              //msg : Veuillez réessayer plus tard
              this.authService.onLogout();
              this.toastr.error("", this.messageServ.connectionRefused,this.alertSwalServ.configToastr);
              break;
            }
            case  401  : {
              //msg : Vous n'êtes pas autorisé à accéder à cette ressource
              this.authService.onLogout();
              this.toastr.error("", this.messageServ.unauthorized,this.alertSwalServ.configToastr);
              break;
            }
            default: { // or status 0
              this.authService.deleteLocalStorage();
              this.toastr.error("", this.messageServ.connectionRefused,this.alertSwalServ.configToastr);
            }
         }
        }

      }
      else{
        this.authService.deleteLocalStorage();
        this.toastr.error("", this.messageServ.connectionRefused,this.alertSwalServ.configToastr);
      }


      }
}
