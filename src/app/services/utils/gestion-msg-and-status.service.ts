import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GestionMsgAndStatusService {


  /********************************************************************************************/
  /************************************* Initialization functions  ****************************/
  /*******************************************************************************************/
  constructor(
    private translate : TranslateService
  ) {

   }

  /********************************************************************************************/
  /******************************************* Messages  **************************************/
  /********************************************************************************************/


  //Map message
  translateMapMsg = new Map<string,string>();

  private mapMsg = new Map< string,any>();

  /* start title Toastr */
  titleToastrError : string = '';//'Error';
  titleToastrSuccess : string = '';// 'Success';
  titleToastrWarning : string = '';// 'Warning';

  bodyToastrAny = "Une erreur s'est produite ";

  titleAlertFileError = "Un des documents de format pdf incorrect";
  unauthorized = "Vous n'êtes pas autorisé à accéder à cette ressource";
  elementExists = "Élément existe déjà";
  connectionRefused =  "Veuillez réessayer plus tard";
  unknownUsernamePassword = "Identifiant inconnu ou mot de passe incorrect";
  mailNotExist = "votre Email n'existe pas";

  //Swal alert
  confirmButtonText = 'Oui';
  cancelButtonText = 'Annuler';
  confirmButtonTextReason = 'Valider';


  /*------------------------  Utilisateur ------------------------*/
  /* start body Toastr */
  bodyToastrUtilisateurAdd : string = "Compte utilisateur a été bien enregistré ";
  bodyToastrUtilisateurUpdate : string = "Compte utilisateur a été bien modifié ";
  bodyToastrUtilisateurDelete : string = "Compte utilisateur a été bien supprimé ";

  bodyToastrDemaInscripValid : string = "Demande d'inscription a été bien traité ";

  /*------------------------  Role ------------------------*/
  /* start body Toastr */
  bodyToastrRoleAdd : string = "Rôle a été bien enregistré ";
  bodyToastrRoleUpdate : string = "Rôle a été bien modifié ";
  bodyToastrRoleDelete : string = "Rôle a été bien supprimé ";

  /*------------------------  Menu ------------------------*/
  /* start body Toastr */
  bodyToastrMenuAdd : string = "Menu a été bien enregistré ";
  bodyToastrMenuUpdate : string = "Menu a été bien modifié ";
  bodyToastrMenuDelete : string = "Menu a été bien supprimé ";


  /*------------------------  Pays ------------------------*/
  /* start body Toastr */
  bodyToastrPaysAdd : string = "Pays a été bien enregistré ";
  bodyToastrPaysUpdate : string = "Pays a été bien modifié ";
  bodyToastrPaysDelete : string = "Pays a été bien supprimé ";

  /*------------------------  Ville ------------------------*/
  /* start body Toastr */
  bodyToastrVilleAdd : string = "Ville a été bien enregistré ";
  bodyToastrVilleUpdate : string = "Ville a été bien modifié ";
  bodyToastrVilleDelete : string = "Ville a été bien supprimé ";


  /**************************************************************************************************/
  /*********************************************** Swal *********************************************/
  /**************************************************************************************************/


  /* start title confirmation Swal */
  titleSwal : string =  "";
  titleSwalMotifRejet = "";
  titleSwalMotifComplement = "";
  textSwalMotif = "";


  /*------------------------  user ------------------------*/
  getBodySwalConfirmUtilisateurDelete(name : any){
    return "Vous êtes sur le point de supprimer le compte utilisateur '"+name+"' ";
  };

  getBodySwalConfirmUtilisateurDeleteImpossible(name : any){
    return "Impossible de supprimer ce compte. Le compte a plusieurs des dépendances.";
  }

  /*------------------------  role ------------------------*/
  getBodySwalConfirmRoleDelete(name : any){
    return "Vous êtes sur le point de supprimer le rôle '"+name+"' ";
  };

  getBodySwalConfirmRoleDeleteImpossible(name : any){
    return "Impossible de supprimer le rôle < <b>"+name+" </b>>. Certain(s) utilisateurs ont toujours ce rôle dans l'application.";
  }

  /*------------------------  menu ------------------------*/
  getBodySwalConfirmMenuDelete(name : any){
    return "Vous êtes sur le point de supprimer le menu '"+name+"' ";
  };


  /*------------------------  Pays ------------------------*/

  getBodySwalConfirmPaysDelete(name : any){
    return "Vous êtes sur le point de supprimer le pays '"+name+"' ";
  };

  /*------------------------  Ville ------------------------*/

  getBodySwalConfirmVilleDelete(name : any){
    return "Vous êtes sur le point de supprimer la ville '"+name+"' ";
  };

  /*------------------------  Account ------------------------*/
  //message de confirmation
  getBodySwalConfirmAcountChangeStatus(status: string, name : any){

    let bodySwalConfirm : any = "";
    let titleWf : any= "";

    console.log('getBodySwalConfirmAcountChangeStatus/status =>'+status)
    switch(status) {
      case "DEACTIVATED": {
        bodySwalConfirm =  name+" "+ this.getMessage("ACCOUNT-SWAL-VALID-BODY-DEACTIVATED-1")+
        this.getMessage("ACCOUNT-SWAL-VALID-BODY-DEACTIVATED-2");
         break;
      }
      case "PENDING": {
        console.log("getBodySwalConfirmAcountChangeStatus/PENDING")
        bodySwalConfirm =  name+" "+ this.getMessage("ACCOUNT-SWAL-VALID-BODY-PENDING-1")+
        this.getMessage("ACCOUNT-SWAL-VALID-BODY-PENDING-2");
         break;
      }
      case "ACTIVATED": {
        bodySwalConfirm =  name+" "+ this.getMessage("ACCOUNT-SWAL-VALID-BODY-ACTIVATED-1")+
        this.getMessage("ACCOUNT-SWAL-VALID-BODY-ACTIVATED-2");
         break;
      }
      case "DELETED": {
        bodySwalConfirm = name+" "+ this.getMessage("ACCOUNT-SWAL-VALID-BODY-DELETED-1")+
        this.getMessage("ACCOUNT-SWAL-VALID-BODY-DELETED-2");
         break;
      }
      case "BLOCKED": {
        bodySwalConfirm =name+" "+ this.getMessage("ACCOUNT-SWAL-VALID-BODY-BLOCKED-1")+
        this.getMessage("ACCOUNT-SWAL-VALID-BODY-BLOCKED-2");
         break;
      }
      default: {
         //statements;
         break;
      }
   }

   return bodySwalConfirm;

  };


  getBodySwalConfirmDemandeInscripValid(isAccepter: boolean, name : any){
    if(isAccepter == true)
      return "Vous êtes sur le point d'accepter la demande d'inscription pour l'utilisateur '"+name+"' ";
    else
      return "Vous êtes sur le point de rejeter la demande d'inscription pour l'utilisateur '"+name+"' ";
  };


  //init Message for step
  initMessage(){

    this.translate.get('MSGERROR-ANY-500')
    .subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('MSGERROR-ANY-500', valueText);
    });

    this.translate.get('MSGERROR-ANY')
    .subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('MSGERROR-ANY', valueText);
    });



    this.translate.get('MSGERROR-UN-AUTHORIZED')
    .subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('MSGERROR-UN-AUTHORIZED', valueText);
    });
    this.translate.get('MSGERROR-CONNECTION-REFUSED')
    .subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('MSGERROR-CONNECTION-REFUSED', valueText);
    });
    this.translate.get('MSGERROR-UNKNOWN-USERNAME-PASSWORD')
    .subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('MSGERROR-UNKNOWN-USERNAME-PASSWORD', valueText);
    });
    this.translate.get('MSGERROR-MAIL-NOT-EXIST')
    .subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('MSGERROR-MAIL-NOT-EXIST', valueText);
    });
    this.translate.get('MSGERROR-ELEMENT-EXISTS')
    .subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('MSGERROR-MAIL-NOT-EXIST', valueText);
    });

    /*----------------------- account -------------------------*/
    this.translate.get('validation-oldPassword-and-oldPassword-incorrect')
    .subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('validation-oldPassword-and-oldPassword-incorrect', valueText);
    });
    this.translate.get('validation-password-valid')
    .subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('validation-password-valid', valueText);
    });



    this.translate.get('TOASTR-ADD')
    .subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('TOASTR-ADD', valueText);
    });
    this.translate.get('TOASTR-EDIT')
    .subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('TOASTR-EDIT', valueText);
    });
    this.translate.get('TOASTR-SEND').subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('TOASTR-SEND', valueText);
    });

    this.translate.get('MSGERROR-FILE-EMPTY').subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('MSGERROR-FILE-EMPTY', valueText);
    });
    this.translate.get('MSGERROR-FILE-EMPTY-OR-BAD').subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('MSGERROR-FILE-EMPTY-OR-BAD', valueText);
    });
    this.translate.get('MSGERROR-TABLE-EMPTY').subscribe((valueText: string) => {
      //init msg
      this.translateMapMsg.set('MSGERROR-TABLE-EMPTY', valueText);
      });


    /*---------------- account -----------------*/
    this.translate.get('ACCOUNT-SWAL-VALID-BODY-PENDING-1')
    .subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('ACCOUNT-SWAL-VALID-BODY-PENDING-1', valueText);
    });
    this.translate.get('ACCOUNT-SWAL-VALID-BODY-PENDING-2')
    .subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('ACCOUNT-SWAL-VALID-BODY-PENDING-2', valueText);
    });

    this.translate.get('ACCOUNT-SWAL-VALID-BODY-ACTIVATED-1')
    .subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('ACCOUNT-SWAL-VALID-BODY-ACTIVATED-1', valueText);
    });
    this.translate.get('ACCOUNT-SWAL-VALID-BODY-ACTIVATED-2')
    .subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('ACCOUNT-SWAL-VALID-BODY-ACTIVATED-2', valueText);
    });

    this.translate.get('ACCOUNT-SWAL-VALID-BODY-DEACTIVATED-1').subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('ACCOUNT-SWAL-VALID-BODY-DEACTIVATED-1', valueText);
    });
    this.translate.get('ACCOUNT-SWAL-VALID-BODY-DEACTIVATED-2').subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('ACCOUNT-SWAL-VALID-BODY-DEACTIVATED-2', valueText);
    });

    this.translate.get('ACCOUNT-SWAL-VALID-BODY-DELETED-1').subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('ACCOUNT-SWAL-VALID-BODY-DELETED-1', valueText);
    });
    this.translate.get('ACCOUNT-SWAL-VALID-BODY-DELETED-2').subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('ACCOUNT-SWAL-VALID-BODY-DELETED-2', valueText);
    });

    this.translate.get('ACCOUNT-SWAL-VALID-BODY-BLOCKED-1').subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('ACCOUNT-SWAL-VALID-BODY-BLOCKED-1', valueText);
    });
    this.translate.get('ACCOUNT-SWAL-VALID-BODY-BLOCKED-2').subscribe((valueText: string) => {
    //init msg
    this.translateMapMsg.set('ACCOUNT-SWAL-VALID-BODY-BLOCKED-2', valueText);
    });


    this.translate.get('ACCOUNT-DET-TITLE')
    .pipe(
      tap((valueText: string) => {
        this.mapMsg.set('ACCOUNT-DET-TITLE', valueText);
      }),
      switchMap((selNode) => this.translate.get('TOASTR-VALID-BODY-TRAITE')),
      // takeUntil(this.onDestroy),
    )
    .subscribe((valueText: string) => {
      //init msg
      this.bodyToastrDemaInscripValid =   this.mapMsg.get('ACCOUNT-DET-TITLE') +" "+ valueText;
      });



    /*---------------- Alert -----------------*/
    this.translate.get('BTN-YES')
    .subscribe((valueText: string) => {
    //init msg
    this.confirmButtonText = valueText;
    });
    this.translate.get('BTN-CANCEL')
    .subscribe((valueText: string) => {
    //init msg
    this.cancelButtonText = valueText;
    });
    this.translate.get('BTN-VALID')
    .subscribe((valueText: string) => {
    //init msg
    this.confirmButtonTextReason = valueText;
    });


    }

  getMessage(keyMsg: string) {
    return this.translateMapMsg.get(keyMsg);
  }


}
