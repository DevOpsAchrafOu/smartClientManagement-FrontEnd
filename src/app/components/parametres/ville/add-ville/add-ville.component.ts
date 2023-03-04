import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, NgForm, Validators } from '@angular/forms';
import { Select2OptionData } from 'ng-select2';
import { Options } from 'select2';
import { Pays } from 'src/app/interfaces/paramètres/pays';
import { Ville } from 'src/app/interfaces/paramètres/ville';
import { PaysService } from 'src/app/services/paramètres/pays.service';
import { VilleService } from 'src/app/services/paramètres/ville.service';
import { HandleStatusService } from 'src/app/services/utils/handle-status.service';
import { UtilsService } from 'src/app/services/utils/utils.service';


@Component({
  selector: 'app-add-ville',
  templateUrl: './add-ville.component.html',
  styleUrls: ['./add-ville.component.css']
})
export class AddVilleComponent implements OnInit {


  /********************************************************************************************/
  /**************************************** The attributes  ***********************************/
  /********************************************************************************************/
  loading : boolean = false;
  display: string = 'block';
  isCreated : boolean = true;
  formContent: any ;
  isSubmit = false;
  @Input() ville: Ville= {} as Ville;// objet de type Ville
  @Output() outputEvent = new EventEmitter();


  public listPaysSelect: Array<Select2OptionData> = [];
  public optionsSelect: Options = {};
  listPays: Array<Pays> = [];


  /********************************************************************************************/
  /************************************* Initialization villes  ****************************/
  /*******************************************************************************************/

  constructor(private formBuilder: FormBuilder,
     private villeService: VilleService,
     private handleErrorServ : HandleStatusService,
     private paysService : PaysService) {
     }

  ngOnInit() {
    this.initForm();
    this.isCreated = ! ('id' in this.ville);//attrubier in objet

    //get all pays
    this.getAllPays();

    this.optionsSelect = {
      multiple: false,
      closeOnSelect: true,//
      minimumResultsForSearch : -1//display search
    };

  }

  /********************************************************************************************/
  /**************************************  The villes **************************************/
  /********************************************************************************************/

  formSubmit(form: NgForm) {

    this.isSubmit = true;
    if (this.formContent.invalid)
    {  return  }

    /* start create ville object part*/
    this.createVille(form);
    /* End create ville object part*/
    this.loading = true;// start Loading
    /* start add ville part*/
    if(this.isCreated){
      this.villeService.addVilleFromBack(this.ville).subscribe(
        response => {
          this.onCloseModal();
          this.outputEvent.emit(response);//emit data
          this.loading = false;// end Loading
        },
        err =>{
          //this.onCloseModal();
          this.outputEvent.emit(err);
          this.loading = false;// end Loading
        }
      );
    }
    /* End add ville part*/
    /* start update ville part*/
    else{
      this.villeService.updateVilleFromBack(this.ville).subscribe(
        response => {
          this.onCloseModal();
          this.outputEvent.emit(response);//emit data
          this.loading = false;// end Loading
        },
        err =>{
          this.outputEvent.emit(err);
          this.loading = false;// end Loading
        }
      );
    }
    /* End update ville part*/
  }

  initForm() {
    this.formContent = this.formBuilder.group({

      titleFr: [this.ville.titleFr, [Validators.required]],
      titleAr: [this.ville.titleAr, [Validators.required]],
      idPays: [this.ville.idPays, Validators.required],
    });
  }

  onCloseModal() {
    this.display = 'none';
  }

  createVille(form : NgForm){

    this.ville.titleFr = form.value['titleFr'];
    this.ville.titleAr = form.value['titleAr'];
    this.ville.idPays = +form.value["idPays"];

  }

  /* get all pays */
 getAllPays(){

  let listR : any[]= [];

  this.paysService.getAllPayssFromBack().subscribe(
    (dataList : any) =>{
      if(!UtilsService.isEmptyArray(dataList)){
        this.listPays = dataList;

        for(var i = 0; i < dataList.length; i++)
        {
          let select2 = {} as {id:string,text:string};
          select2.id = (dataList[i].id)+"";
          select2.text = dataList[i].titleFr;
          listR.push(select2);
        }
        this.listPaysSelect = listR;
      }
    }
  )
 }

}
