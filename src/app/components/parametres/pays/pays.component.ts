import { Component, ComponentFactoryResolver, ComponentRef, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Pays } from 'src/app/interfaces/paramètres/pays';
import { PaysService } from 'src/app/services/paramètres/pays.service';
import { AlertSwalService } from 'src/app/services/utils/alert-swal.service';
import { GestionMsgAndStatusService } from 'src/app/services/utils/gestion-msg-and-status.service';
import { HandleStatusService } from 'src/app/services/utils/handle-status.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import Swal from 'sweetalert2';
import { AddPaysComponent } from '../pays/add-pays/add-pays.component';



@Component({
  selector: 'app-pays',
  templateUrl: './pays.component.html',
  styleUrls: ['./pays.component.css']
})
export class PaysComponent implements OnInit {



  /********************************************************************************************/
  /**************************************** The attributes  ***********************************/
  /********************************************************************************************/

  today = new Date();
  public value: string ="";



  /* start property table */
  page = 1;
  pageSize = 10;
  collectionSize = 0;

  payss : Pays[] = [];
  messageError: string = "";

  @ViewChild('componentModal', { static: false, read: ViewContainerRef }) entry: any ;
  isCreated: boolean = false;
  isNotCreated: boolean = false;
  message: string = "";



  /********************************************************************************************/
  /************************************* Initialization payss  ****************************/
  /*******************************************************************************************/

  constructor(private paysService: PaysService,
    private resolver: ComponentFactoryResolver,
    private toastr: ToastrService,
    private alertServ : AlertSwalService,//property for alert(toastr and Swal)
    private messageServ : GestionMsgAndStatusService,//massagae for alert(toastr and Swal)
    private handleErrorServ : HandleStatusService
    ) {
    }

  ngOnInit(): void {

    this.refreshPayss();

  }

  /********************************************************************************************/
  /**************************************  The payss **************************************/
  /********************************************************************************************/


  /* add pays */
  addPays() {
    this.entry.clear();
    const factory = this.resolver.resolveComponentFactory(AddPaysComponent);// initialser component
    let componentRef = this.entry.createComponent(factory);//create component
    componentRef.instance.pays = { };//initialser les inputs

    componentRef.instance.outputEvent.subscribe( //récu data de component fils
      (response: any) => {
        if ('error' in response) {
          this.toastr.error(this.messageServ.bodyToastrAny, response.error.message,this.alertServ.configToastr);
        }
        else {
          this.refreshPayss();
          this.message = this.messageServ.bodyToastrPaysAdd;
          this.toastr.success(this.messageServ.titleToastrSuccess, this.message,this.alertServ.configToastr);
          this.destroyComponent(componentRef);//delete component
        }

      }
    );
  }

  /* update pays */
  updatePays(pays: Pays) {
    this.entry.clear();
    const factory = this.resolver.resolveComponentFactory(AddPaysComponent);
    let componentRef = this.entry.createComponent(factory);
    componentRef.instance.pays = pays;
    componentRef.instance.outputEvent.subscribe(//récu data de component fils
      (response:any) => {
        if ('error' in response) {//attrubier 'error' in objet
          this.toastr.error(this.messageServ.bodyToastrAny, response.error.message,this.alertServ.configToastr);
        }
        else {
          this.refreshPayss();
          this.message = this.messageServ.bodyToastrPaysUpdate;
          this.toastr.success(this.messageServ.titleToastrSuccess, this.message,this.alertServ.configToastr);
          this.destroyComponent(componentRef);//delete component
        }
      }
    );
  }

  /* delete pays */
  deletePays(id: number | undefined, name : any ){

    Swal.fire({
      title: this.messageServ.titleSwal,
      text: this.messageServ.getBodySwalConfirmPaysDelete(name),
      showCancelButton: this.alertServ.showCancelButton,
      confirmButtonColor: this.alertServ.confirmButtonColor,
      cancelButtonColor: this.alertServ.cancelButtonColor,
      confirmButtonText: this.messageServ.confirmButtonText,
      cancelButtonText: this.messageServ.cancelButtonText
  }).then((result) => {
      console.log(result);
      if (result.value && id) {
        //  delete pays  //
        this.paysService.deletePaysByIdFromBack(id).subscribe(
          response =>{
            this.message = this.messageServ.bodyToastrPaysDelete;
            this.toastr.success(this.messageServ.titleToastrSuccess, this.message,this.alertServ.configToastr);
            this.refreshPayss();
          },
          error => {
            this.handleErrorServ.onHandleCodeStatus(error);
          }
        );
      }
  });
  }

/* get all pays */
  refreshPayss() {
      this.paysService.getAllPayssFromBack().subscribe(
        (dataList : Pays[]) => {
          if(!UtilsService.isEmptyArray(dataList))
          this.payss = dataList
          .map((country, i) => ({id: i + 1, ...country}))
          .slice((this.page - 1) * this.pageSize, (this.page - 1) * this.pageSize + this.pageSize);
          this.collectionSize = dataList.length;
        },
        error => {
          this.handleErrorServ.onHandleCodeStatus(error);
         }
      );

  }


/* delete component */
destroyComponent(componentRef : ComponentRef<AddPaysComponent>) {
    componentRef.destroy();
}

}
