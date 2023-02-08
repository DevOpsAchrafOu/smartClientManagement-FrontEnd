import { Component, OnInit } from '@angular/core';

import { AuthService } from 'src/app/services/security/auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { UtilisateurService } from 'src/app/services/administration/utilisateur.service';
import { Utilisateur } from 'src/app/interfaces/administration/utilisateur';
import { SharedService } from 'src/app/services/utils/shared.service';
import { AlertSwalService } from 'src/app/services/utils/alert-swal.service';
import { HandleStatusService } from 'src/app/services/utils/handle-status.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {



 /********************************************************************************************/
  /**************************************** The attributes  ***********************************/
  /********************************************************************************************/

  rtl: boolean = false; //par défaul Francais (false)

  today = new Date();
  vBool1 = false;
  vBool2 = false;
  chart:any ;
  resultat : any;

  /********************************************************************************************/
  /************************************* Initialization functions  ****************************/
  /*******************************************************************************************/


  constructor(
    private authService:AuthService,
    private userService:UtilisateurService,
    private route: Router,
    private toastr : ToastrService,
    private translate: TranslateService,
    private sharedData : SharedService,
    private alertServ : AlertSwalService,
    private handleErrorServ : HandleStatusService,
  ) {}



  ngOnInit(): void {

    this.doAuthUser();

  }
  /********************************************************************************************/
  /**************************************  The functions **************************************/
  /********************************************************************************************/


     //user is load or not
     doAuthUser(){
      let isAuth = this.authService.isloadConnectedUser();
      console.log("home doAuthUser " + isAuth);
      if(isAuth == false){
        this.userService.getConnectedUtilisateurFromBack()
        .subscribe(
            (res : any) => {
              // //console.log(res);
              if(res){
                if (res.status === 200) {

                  let user : Utilisateur= res?.body;
                  if(user){
                    //console.log(user);
                    this.authService.saveCurrentUser(user);
                    let connectedUser = user;
                    //set CurrentUserName And AvatarLogo
                    this.sharedData.setCurrentUserNameAndAvatarLogo(connectedUser);

                    this.route.navigate(["/home"]);
                  }
                  else{
                  // this.route.navigate(["/edit-profile"]);
                  //"S'il vous plaît entrez les informations nécessaires à l'inscription"
                  this.toastr.warning("", "AccountDto is null",this.alertServ.configToastr);
                  }

                  // this.route.navigate(["/"]);
                }else if (res.status === 202) {
                  //"S'il vous plaît entrez les informations nécessaires à l'inscription"
                  this.toastr.warning("", "code status 202",this.alertServ.configToastr);
                  // this.route.navigate(["/edit-profile"]);
                }
              }

            },
            error => {
              this.handleErrorServ.onHandleCodeStatus(error);
            }
          );
      }
      else
      {
        this.userService.getConnectedUtilisateurFromBack()
        .subscribe(
            (res : any) => {
            },
            error => {
              this.handleErrorServ.onHandleCodeStatus(error);
            }
          );
      }


    }

}
