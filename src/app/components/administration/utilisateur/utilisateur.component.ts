
import { Component, ComponentFactoryResolver, ComponentRef, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Utilisateur } from 'src/app/interfaces/administration/utilisateur';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { UtilisateurService } from 'src/app/services/administration/utilisateur.service';
import { AlertSwalService } from 'src/app/services/utils/alert-swal.service';
import { GestionMsgAndStatusService } from 'src/app/services/utils/gestion-msg-and-status.service';
import { HandleStatusService } from 'src/app/services/utils/handle-status.service';
import { RoleService } from 'src/app/services/administration/role.service';
import { AddUtilisateurComponent } from './add-utilisateur/add-utilisateur.component';

@Component({
  selector: 'app-utilisateur',
  templateUrl: './utilisateur.component.html',
  styleUrls: ['./utilisateur.component.css']
})
export class UtilisateurComponent implements OnInit {


  /********************************************************************************************/
  /**************************************** The attributes  ***********************************/
  /********************************************************************************************/
  loading : boolean = false;
  rtl: boolean = false; //par défaul Francais (false)

  today = new Date();
  public value: string ="";



  /* start property table */
  page = 1;
  pageSize = 10;
  collectionSize = 0;
  currentUtilisateur : Utilisateur = {};
  users : Utilisateur[] = [];
  messageError: string = "";

  @ViewChild('componentModal', { static: false, read: ViewContainerRef }) entry: any ;
  isCreated: boolean = false;
  isNotCreated: boolean = false;
  message: string = ""
  roleSuperAdmin = "";

  /********************************************************************************************/
  /************************************* Initialization functions  ****************************/
  /*******************************************************************************************/

  constructor(private userService: UtilisateurService,
    private resolver: ComponentFactoryResolver,
    private toastr: ToastrService,
    private alertServ : AlertSwalService,//property for alert(toastr and Swal)
    private messageServ : GestionMsgAndStatusService,//massagae for alert(toastr and Swal)
    private handleErrorServ : HandleStatusService,
    private roleService : RoleService

    ) {
      this.roleSuperAdmin = roleService.roleSuperAdmin;
    }

  ngOnInit(): void {

    this.refreshUsers();

    this.getCurrentUtilisateur();


    //get current lang
    //this.rtl = this.currentLangService.isRTL();
  }

  /********************************************************************************************/
  /**************************************  The functions **************************************/
  /********************************************************************************************/

  getCurrentUtilisateur(){
    this.userService.getConnectedUtilisateurFromBack()
    .subscribe(
        (data : any) => {
          console.log(data);
          if(data){
            if (data.status === 200) {
              let user : Utilisateur = data?.body;
              if(!UtilsService.isEmptyObjet(user)){
                console.log("user =>");
                console.log(user);
                this.currentUtilisateur = user;
              }
            }
          }

        },
        error => {
          this.handleErrorServ.onHandleCodeStatus(error);
        }
      );
  }

  /* add user */
  addUser() {
    this.entry.clear();
    const factory = this.resolver.resolveComponentFactory(AddUtilisateurComponent);// initialser component
    let componentRef = this.entry.createComponent(factory);//create component
    componentRef.instance.user = { };//initialser les inputs

    componentRef.instance.outputEvent.subscribe( //récu data de component fils
      (response: any) => {
        if ('error' in response) {
          this.toastr.error(this.messageServ.bodyToastrAny, response.error.message,this.alertServ.configToastr);
        }
        else {
          this.refreshUsers();
          this.message = this.messageServ.bodyToastrUtilisateurAdd;
          this.toastr.success(this.messageServ.titleToastrSuccess, this.message,this.alertServ.configToastr);
          this.destroyComponent(componentRef);//delete component
        }

      }
    );
  }

  /* update user */
  updateUser(user: Utilisateur) {
    this.entry.clear();
    const factory = this.resolver.resolveComponentFactory(AddUtilisateurComponent);
    let componentRef = this.entry.createComponent(factory);
    componentRef.instance.user = user;
    componentRef.instance.outputEvent.subscribe(//récu data de component fils
      (response:any) => {
        if ('error' in response) {//attrubier 'error' in objet
          this.toastr.error(this.messageServ.bodyToastrAny, response.error.message,this.alertServ.configToastr);
        }
        else {
          this.refreshUsers();
          this.message = this.messageServ.bodyToastrUtilisateurUpdate;
          this.toastr.success(this.messageServ.titleToastrSuccess, this.message,this.alertServ.configToastr);
          this.destroyComponent(componentRef);//delete component
        }
      }
    );
  }

  /* delete user */
  deleteUser(id: number | undefined, name : any ){

    Swal.fire({
      title: this.messageServ.titleSwal,
      text: this.messageServ.getBodySwalConfirmUtilisateurDelete(name),
      showCancelButton: this.alertServ.showCancelButton,
      confirmButtonColor: this.alertServ.confirmButtonColor,
      cancelButtonColor: this.alertServ.cancelButtonColor,
      confirmButtonText: this.messageServ.confirmButtonText,
      cancelButtonText: this.messageServ.cancelButtonText
  }).then((result) => {
      if (result.value && id) {
        this.loading = true;// start Loading
        //  delete user  //
        this.userService.deleteUtilisateurByIdFromBack(id).subscribe(
          response =>{
            this.message = this.messageServ.bodyToastrUtilisateurDelete;
            this.toastr.success(this.messageServ.titleToastrSuccess, this.message,this.alertServ.configToastr);
            this.refreshUsers();
            this.loading = false;// end Loading
          },
          error => {
            // this.messageError = error.message;
            if(error.status){
              var regexp = new RegExp("5[0-9][0-9]");
              let test = regexp.test(error.status);
              if(test == true){
                //msg : Une erreur s'est produite !
                this.toastr.error("", this.messageServ.getBodySwalConfirmUtilisateurDeleteImpossible(name),this.alertServ.configToastr10S);
                }
              }else{
                this.handleErrorServ.onHandleCodeStatus(error);
              }
              this.loading = false;// end Loading
          }
        );
      }
  });
  }

  /* get all user */
  refreshUsers() {
    this.loading = true;// start Loading
      this.userService.getAllUtilisateursFromBack().subscribe(
        (dataList : Utilisateur[]) => {
          console.log(dataList);
          if(!UtilsService.isEmptyArray(dataList))
          this.users = dataList
          .map((country, i) => ({id: i + 1, ...country}))
          .slice((this.page - 1) * this.pageSize, (this.page - 1) * this.pageSize + this.pageSize);
          this.collectionSize = dataList.length;
          this.loading = false;// end Loading
        },
        error => {
          this.handleErrorServ.onHandleCodeStatus(error);
          this.loading = false;// end Loading
         }
      );

  }


  /* delete component */
  destroyComponent(componentRef : ComponentRef<AddUtilisateurComponent>) {
      componentRef.destroy();
  }
}
