import { Component, ComponentFactoryResolver, ComponentRef, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Role } from 'src/app/interfaces/administration/role';
import { RoleService } from 'src/app/services/administration/role.service';
import { AlertSwalService } from 'src/app/services/utils/alert-swal.service';
import { CurrentLangService } from 'src/app/services/utils/current-lang.service';
import { GestionMsgAndStatusService } from 'src/app/services/utils/gestion-msg-and-status.service';
import { HandleStatusService } from 'src/app/services/utils/handle-status.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import Swal from 'sweetalert2';
import { AddRoleComponent } from './add-role/add-role.component';


@Component({
  selector: 'app-role',
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.css']
})
export class RoleComponent implements OnInit {


  /********************************************************************************************/
  /**************************************** The attributes  ***********************************/
  /********************************************************************************************/
  loading : boolean = false;
  rtl: boolean = false; //par défaul Francais (false)

  today = new Date();
  public value: string ="";
  roleSuperAdmin = "";

  /* start property table */
  page = 1;
  pageSize = 10;
  collectionSize = 0;

  roles : Role[] = [];
  messageError: string = "";

  @ViewChild('componentModal', { static: false, read: ViewContainerRef }) entry: any ;
  isCreated: boolean = false;
  isNotCreated: boolean = false;
  message: string = ""

  /********************************************************************************************/
  /************************************* Initialization functions  ****************************/
  /*******************************************************************************************/

  constructor(private roleService: RoleService,
    private resolver: ComponentFactoryResolver,
    private toastr: ToastrService,
    private alertServ : AlertSwalService,//property for alert(toastr and Swal)
    private messageServ : GestionMsgAndStatusService,//massagae for alert(toastr and Swal)
    private handleErrorServ : HandleStatusService,
    private currentLangService: CurrentLangService,
    private translate: TranslateService,
    ) {
      this.roleSuperAdmin = this.roleService.roleSuperAdmin;
    }

  ngOnInit(): void {

    this.refreshRoles();

    //get current lang
    //this.rtl = this.currentLangService.isRTL();

  }

  /********************************************************************************************/
  /**************************************  The functions **************************************/
  /********************************************************************************************/


  /* add role */
  addRole() {
    this.entry.clear();
    const factory = this.resolver.resolveComponentFactory(AddRoleComponent);// initialser component
    let componentRef = this.entry.createComponent(factory);//create component
    componentRef.instance.role = { };//initialser les inputs

    componentRef.instance.outputEvent.subscribe( //récu data de component fils
      (response: any) => {
        if ('error' in response) {
          this.toastr.error(this.messageServ.titleToastrError, response.error.message,this.alertServ.configToastr);
        }
        else {
          this.refreshRoles();
          this.message = this.messageServ.bodyToastrRoleAdd;
          this.toastr.success(this.messageServ.titleToastrSuccess, this.message,this.alertServ.configToastr);
          this.destroyComponent(componentRef);//delete component
        }

      }
    );
  }

  /* update role */
  updateRole(role: Role) {
    this.entry.clear();
    const factory = this.resolver.resolveComponentFactory(AddRoleComponent);
    let componentRef = this.entry.createComponent(factory);
    componentRef.instance.role = role;
    componentRef.instance.outputEvent.subscribe(//récu data de component fils
      (response :any) => {
        if ('error' in response) {//attrubier 'error' in objet
          this.toastr.error(this.messageServ.titleToastrError, response.error.message,this.alertServ.configToastr);
        }
        else {
          this.refreshRoles();
          this.message = this.messageServ.bodyToastrRoleUpdate;
          this.toastr.success(this.messageServ.titleToastrSuccess, this.message,this.alertServ.configToastr);
          this.destroyComponent(componentRef);//delete component
        }
      }
    );
  }

  /* delete role */
  deleteRole(id: number | undefined, name : any ,code : any){
    if(this.roleService.roleSuperAdmin != code)
    {

      this.roleService.countUtilisateurByRoleIdFromBack(id).subscribe(
        (data : any) =>{
         if(data != 0){
          Swal.fire({
            position: 'top-end',
            icon: 'warning',
            html: this.messageServ.getBodySwalConfirmRoleDeleteImpossible(name),
            showConfirmButton: false,
            timer: 4500
          })
         }else {
          Swal.fire({
            title: this.messageServ.titleSwal,
            text: this.messageServ.getBodySwalConfirmRoleDelete(name),
            showCancelButton: this.alertServ.showCancelButton,
            confirmButtonColor: this.alertServ.confirmButtonColor,
            cancelButtonColor: this.alertServ.cancelButtonColor,
            confirmButtonText: this.messageServ.confirmButtonText,
            cancelButtonText: this.messageServ.cancelButtonText
          }).then((result) => {
              console.log(result);
              if (result.value && id) {
                this.loading = true;// start Loading
                //  delete role  //
                this.roleService.deleteRoleByIdFromBack(id).subscribe(
                  response =>{
                    this.message = this.messageServ.bodyToastrRoleDelete;
                    this.toastr.success(this.messageServ.titleToastrSuccess, this.message,this.alertServ.configToastr);
                    this.refreshRoles();
                    this.loading = false;// end Loading
                  },
                  error => {
                    this.handleErrorServ.onHandleCodeStatus(error);
                    this.loading = false;// end Loading
                  }
                );
              }
          });
         }
        },
        error => {
          this.handleErrorServ.onHandleCodeStatus(error);          }
      );
    }

  }

/* get all role */
  refreshRoles() {
      this.loading = true;// start Loading
      this.roleService.getAllRolesFromBack().subscribe(
        (dataList : any[]) => {
          if(!UtilsService.isEmptyArray(dataList))
          this.roles = dataList
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
  destroyComponent(componentRef : ComponentRef<AddRoleComponent>) {
      componentRef.destroy();
  }




}
