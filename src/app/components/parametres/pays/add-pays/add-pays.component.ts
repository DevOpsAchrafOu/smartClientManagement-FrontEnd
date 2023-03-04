import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, NgForm, Validators } from '@angular/forms';
import { Pays } from 'src/app/interfaces/paramètres/pays';
import { PaysService } from 'src/app/services/paramètres/pays.service';
import { HandleStatusService } from 'src/app/services/utils/handle-status.service';

@Component({
  selector: 'app-add-pays',
  templateUrl: './add-pays.component.html',
  styleUrls: ['./add-pays.component.css']
})
export class AddPaysComponent implements OnInit {


  /********************************************************************************************/
  /**************************************** The attributes  ***********************************/
  /********************************************************************************************/
  loading : boolean = false;
  display: string = 'block';
  isCreated : boolean = true;
  formContent: any ;
  isSubmit = false;
  @Input() pays: Pays= {} as Pays;// objet de type Pays
  @Output() outputEvent = new EventEmitter();


  /********************************************************************************************/
  /************************************* Initialization pays  *********************************/
  /*******************************************************************************************/

  constructor(private formBuilder: FormBuilder,
     private paysService: PaysService,
     private handleErrorServ : HandleStatusService) {
  }

  ngOnInit() {
    this.initForm();
    this.isCreated = ! ('id' in this.pays);//attrubier in objet
  }

  /********************************************************************************************/
  /**************************************  The functions  *************************************/
  /********************************************************************************************/

  formSubmit(form: NgForm) {

    this.isSubmit = true;
    if (this.formContent.invalid)
    {  return  }

    /* start create pays object part*/
    this.createPays(form);
    /* End create pays object part*/
    this.loading = true;// start Loading
    /* start add pays part*/
    if(this.isCreated){
      this.paysService.addPaysFromBack(this.pays).subscribe(
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
    /* End add pays part*/
    /* start update pays part*/
    else{
      this.paysService.updatePaysFromBack(this.pays).subscribe(
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
    /* End update pays part*/
  }

  initForm() {
    this.formContent = this.formBuilder.group({
      titleFr: [this.pays.titleFr, [Validators.required]],
      titleAr: [this.pays.titleAr, [Validators.required]],
    });
  }

  onCloseModal() {
    this.display = 'none';
  }

  createPays(form : NgForm){

    this.pays.titleFr = form.value['titleFr'];
    this.pays.titleAr = form.value['titleAr'];
  }


}
