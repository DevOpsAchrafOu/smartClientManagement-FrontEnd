import { Component, ComponentFactoryResolver, ComponentRef, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Ville } from 'src/app/interfaces/paramètres/ville';
import { VilleService } from 'src/app/services/paramètres/ville.service';
import { AlertSwalService } from 'src/app/services/utils/alert-swal.service';
import { GestionMsgAndStatusService } from 'src/app/services/utils/gestion-msg-and-status.service';
import { HandleStatusService } from 'src/app/services/utils/handle-status.service';
import { UtilsService } from 'src/app/services/utils/utils.service';

import Swal from 'sweetalert2';
import { AddVilleComponent } from '../ville/add-ville/add-ville.component';



@Component({
  selector: 'app-ville',
  templateUrl: './ville.component.html',
  styleUrls: ['./ville.component.css']
})
export class VilleComponent implements OnInit {



  /********************************************************************************************/
  /**************************************** The attributes  ***********************************/
  /********************************************************************************************/
  loading : boolean = false;
  today = new Date();
  public value: string ="";



  /* start property table */
  page = 1;
  pageSize = 10;
  collectionSize = 0;

  villes : Ville[] = [];
  messageError: string = "";

  @ViewChild('componentModal', { static: false, read: ViewContainerRef }) entry: any ;
  isCreated: boolean = false;
  isNotCreated: boolean = false;
  message: string = "";



  /********************************************************************************************/
  /************************************* Initialization villes  ****************************/
  /*******************************************************************************************/

  constructor(private villeService: VilleService,
    private resolver: ComponentFactoryResolver,
    private toastr: ToastrService,
    private alertServ : AlertSwalService,//property for alert(toastr and Swal)
    private messageServ : GestionMsgAndStatusService,//massagae for alert(toastr and Swal)
    private handleErrorServ : HandleStatusService
    ) {
    }

  ngOnInit(): void {

    this.refreshVilles();

  }

  /********************************************************************************************/
  /**************************************  The villes **************************************/
  /********************************************************************************************/


  /* add ville */
  addVille() {
    this.entry.clear();
    const factory = this.resolver.resolveComponentFactory(AddVilleComponent);// initialser component
    let componentRef = this.entry.createComponent(factory);//create component
    componentRef.instance.ville = { };//initialser les inputs

    componentRef.instance.outputEvent.subscribe( //récu data de component fils
      (response: any) => {
        if ('error' in response) {
          this.toastr.error(this.messageServ.bodyToastrAny, response.error.message,this.alertServ.configToastr);
        }
        else {
          this.refreshVilles();
          this.message = this.messageServ.bodyToastrVilleAdd;
          this.toastr.success(this.messageServ.titleToastrSuccess, this.message,this.alertServ.configToastr);
          this.destroyComponent(componentRef);//delete component
        }

      }
    );
  }

  /* update ville */
  updateVille(ville: Ville) {
    this.entry.clear();
    const factory = this.resolver.resolveComponentFactory(AddVilleComponent);
    let componentRef = this.entry.createComponent(factory);
    componentRef.instance.ville = ville;
    componentRef.instance.outputEvent.subscribe(//récu data de component fils
      (response:any) => {
        if ('error' in response) {//attrubier 'error' in objet
          this.toastr.error(this.messageServ.bodyToastrAny, response.error.message,this.alertServ.configToastr);
        }
        else {
          this.refreshVilles();
          this.message = this.messageServ.bodyToastrVilleUpdate;
          this.toastr.success(this.messageServ.titleToastrSuccess, this.message,this.alertServ.configToastr);
          this.destroyComponent(componentRef);//delete component
        }
      }
    );
  }

  /* delete ville */
  deleteVille(id: number | undefined, name : any ){

    Swal.fire({
      title: this.messageServ.titleSwal,
      text: this.messageServ.getBodySwalConfirmVilleDelete(name),
      showCancelButton: this.alertServ.showCancelButton,
      confirmButtonColor: this.alertServ.confirmButtonColor,
      cancelButtonColor: this.alertServ.cancelButtonColor,
      confirmButtonText: this.messageServ.confirmButtonText,
      cancelButtonText: this.messageServ.cancelButtonText
  }).then((result) => {
      console.log(result);
      if (result.value && id) {
        this.loading = true;// end Loading
        //  delete ville  //
        this.villeService.deleteVilleByIdFromBack(id).subscribe(
          response =>{
            this.message = this.messageServ.bodyToastrVilleDelete;
            this.toastr.success(this.messageServ.titleToastrSuccess, this.message,this.alertServ.configToastr);
            this.refreshVilles();
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

/* get all ville */
  refreshVilles() {
    this.loading = true;// start Loading
      this.villeService.getAllVillesFromBack().subscribe(
        (dataList : Ville[]) => {
          if(!UtilsService.isEmptyArray(dataList))
          this.villes = dataList
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
destroyComponent(componentRef : ComponentRef<AddVilleComponent>) {
    componentRef.destroy();
}

}
