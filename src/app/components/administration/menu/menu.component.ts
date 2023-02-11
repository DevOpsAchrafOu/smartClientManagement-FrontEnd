import { Component, ComponentFactoryResolver, ComponentRef, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Menu } from 'src/app/interfaces/administration/menu';
import { AlertSwalService } from 'src/app/services/utils/alert-swal.service';
import { MenuService } from 'src/app/services/administration/menu.service';
import { GestionMsgAndStatusService } from 'src/app/services/utils/gestion-msg-and-status.service';
import Swal from 'sweetalert2';
import { AddMenuComponent } from './add-menu/add-menu.component';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { HandleStatusService } from 'src/app/services/utils/handle-status.service';


@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {


  /********************************************************************************************/
  /**************************************** The attributes  ***********************************/
  /********************************************************************************************/
  rtl: boolean = false; //par défaul Francais (false)

  today = new Date();
  public value: string ="";



  /* start property table */
  page = 1;
  pageSize = 10;
  collectionSize = 0;

  menus : Menu[] = [];
  messageError: string = "";

  @ViewChild('componentModal', { static: false, read: ViewContainerRef }) entry: any ;
  isCreated: boolean = false;
  isNotCreated: boolean = false;
  message: string = ""

  /********************************************************************************************/
  /************************************* Initialization functions  ****************************/
  /*******************************************************************************************/

  constructor(private menuService: MenuService,
    private resolver: ComponentFactoryResolver,
    private toastr: ToastrService,
    private alertServ : AlertSwalService,//property for alert(toastr and Swal)
    private messageServ : GestionMsgAndStatusService,//massagae for alert(toastr and Swal)
    private handleErrorServ : HandleStatusService,
    ) {


    }

  ngOnInit(): void {

    this.refreshMenus();

  }

  /********************************************************************************************/
  /**************************************  The functions **************************************/
  /********************************************************************************************/


  /* add menu */
  addMenu() {
    this.entry.clear();
    const factory = this.resolver.resolveComponentFactory(AddMenuComponent);// initialser component
    let componentRef = this.entry.createComponent(factory);//create component
    componentRef.instance.menu = { };//initialser les inputs

    componentRef.instance.outputEvent.subscribe( //récu data de component fils
      (val: any) => {
        if ('error' in val) {
          this.toastr.error(this.messageServ.titleToastrError, val.error.message,this.alertServ.configToastr);
        }
        else {
          this.refreshMenus();
          this.message = this.messageServ.bodyToastrMenuAdd;
          this.toastr.success(this.messageServ.titleToastrSuccess, this.message,this.alertServ.configToastr);
          this.destroyComponent(componentRef);//delete component
        }

      }
    );
  }

  /* update menu */
  updateMenu(menu: Menu) {
    this.entry.clear();
    const factory = this.resolver.resolveComponentFactory(AddMenuComponent);
    let componentRef = this.entry.createComponent(factory);
    componentRef.instance.menu = menu;
    componentRef.instance.outputEvent.subscribe(//récu data de component fils
      (val:any) => {
        if ('error' in val) {//attrubier 'error' in objet
          this.toastr.error(this.messageServ.titleToastrError, val.error.message,this.alertServ.configToastr);
        }
        else {
          this.refreshMenus();
          this.message = this.messageServ.bodyToastrMenuUpdate;
          this.toastr.success(this.messageServ.titleToastrSuccess, this.message,this.alertServ.configToastr);
          this.destroyComponent(componentRef);//delete component
        }
      }
    );
  }

  /* delete menu */
  deleteMenu(id: number | undefined, name : any ){

    Swal.fire({
      title: this.messageServ.titleSwal,
      text: this.messageServ.getBodySwalConfirmMenuDelete(name),
      showCancelButton: this.alertServ.showCancelButton,
      confirmButtonColor: this.alertServ.confirmButtonColor,
      cancelButtonColor: this.alertServ.cancelButtonColor,
      confirmButtonText: this.messageServ.confirmButtonText,
      cancelButtonText: this.messageServ.cancelButtonText
  }).then((result) => {
      console.log(result);
      if (result.value && id) {
        //  delete menu  //
        this.menuService.deleteMenuByIdFromBack(id).subscribe(
          iteam =>{
            this.message = this.messageServ.bodyToastrMenuDelete;
            this.toastr.success(this.messageServ.titleToastrSuccess, this.message,this.alertServ.configToastr);
            this.refreshMenus();
          },
          error => {
            // this.messageError = error.message;
            this.handleErrorServ.onHandleCodeStatus(error);          }
        );
      }
  });
  }

/* get all menu */
  refreshMenus() {
      this.menuService.getAllMenusFromBack().subscribe(
        (listMenu : Menu[]) => {
          console.log(listMenu);
          if(!UtilsService.isEmptyArray(listMenu))
          this.menus = listMenu
          .map((country, i) => ({id: i + 1, ...country}))
          .slice((this.page - 1) * this.pageSize, (this.page - 1) * this.pageSize + this.pageSize);
          this.collectionSize = listMenu.length;
        },
        error => {
          // this.messageError = error.message;
          this.handleErrorServ.onHandleCodeStatus(error);         }
      );

  }


  /* delete component */
destroyComponent(componentRef : ComponentRef<AddMenuComponent>) {
    componentRef.destroy();
}

}
