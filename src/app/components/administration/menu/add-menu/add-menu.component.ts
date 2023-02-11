import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, NgForm, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Menu } from 'src/app/interfaces/administration/menu';
import { CurrentLangService } from 'src/app/services/utils/current-lang.service';
import { HandleStatusService } from 'src/app/services/utils/handle-status.service';
import { MenuService } from 'src/app/services/administration/menu.service';
import { Select2OptionData } from 'ng-select2';
import { Options } from 'select2';

@Component({
  selector: 'app-add-menu',
  templateUrl: './add-menu.component.html',
  styleUrls: ['./add-menu.component.css']
})
export class AddMenuComponent implements OnInit {

  /********************************************************************************************/
  /**************************************** The attributes  ***********************************/
  /********************************************************************************************/
  rtl: boolean = false; //par défaul Francais (false)

  public listMenuSelect: Array<Select2OptionData> = [];
  listMenu: Array<Menu> = [];
  public optionsSelect: Options = {};
  //Map
  mapMenu = new Map<number, any>();

  display: string = 'block';
  isCreated : boolean = true;
  formContent: any ;
  isSubmit = false;
  @Input() menu: Menu= {} as Menu;// objet de type Menu
  @Output() outputEvent = new EventEmitter();



  /********************************************************************************************/
  /************************************* Initialization functions  ****************************/
  /*******************************************************************************************/

  constructor(private formBuilder: FormBuilder,
     private menuService: MenuService,
     private handleErrorServ : HandleStatusService,
     private currentLangService: CurrentLangService,
     private translate: TranslateService,) {
     }

  ngOnInit() {
    this.initForm();
    this.isCreated = ! ('id' in this.menu);//attrubier in objet

    console.log(this.menu);
    this.getAllMenuParent();

    this.optionsSelect = {
      multiple: false,
      closeOnSelect: true,//
      minimumResultsForSearch : -1//display search
    };

    //get current lang
    //this.rtl = this.currentLangService.isRTL();
  }

  /********************************************************************************************/
  /**************************************  The functions **************************************/
  /********************************************************************************************/

  formSubmit(form: NgForm) {
    this.isSubmit = true;
    if (this.formContent.invalid)
    {  return  }

    /* start create menu object part*/
    this.createMenu(form);
    /* End create menu object part*/

    /* start add menu part*/
    if(this.isCreated){
      this.menuService.addMenuFromBack(this.menu).subscribe(
        data => {
          this.onCloseModal();
          this.outputEvent.emit(data);//emit data
        },
        err =>{
          //this.onCloseModal();
          this.outputEvent.emit(err);
        }
      );
    }
    /* End add menu part*/
    /* start update menu part*/
    else{
      this.menuService.updateMenuFromBack(this.menu).subscribe(
        data => {
          this.onCloseModal();
          this.outputEvent.emit(data);//emit data
        },
        err =>{
          this.outputEvent.emit(err);
        }
      );
    }
    /* End update menu part*/
  }

  initForm() {
    this.formContent = this.formBuilder.group({
      icon: [this.menu.icon, Validators.required],
      titleAr: [this.menu.titleAr, [Validators.required]],
      titleFr: [this.menu.titleFr, [Validators.required]],
      menuParent: [this.menu.parentId,[Validators.required] ],//
      url: [this.menu.url, [Validators.required]],
      typeNav: [this.menu.typeNav ? this.menu.typeNav:"V", [Validators.required]],
      order: [this.menu.order ? this.menu.order : 0, [Validators.required]],
    });
  }

  onCloseModal() {
    this.display = 'none';
  }

  createMenu(form : NgForm){

    this.menu.icon = form.value['icon'];
    this.menu.titleAr = form.value['titleAr'];
    this.menu.titleFr = form.value['titleFr'];
    this.menu.url = form.value['url'];
    this.menu.parentId = form.value['menuParent'] != 0 ? form.value['menuParent'] : null;
    this.menu.typeNav = form.value['typeNav'];
    this.menu.order = form.value['order'];


  }

   /* get all menu */
   getAllMenuParent(){

    let listM : any[]= [];

    this.menuService.getAllMenusParentFromBack().subscribe(
      (listMenu : any) =>{

        this.listMenu = listMenu;

        if(this.menu.parentId)
          this.formContent.patchValue({
            menuParent : this.listMenu.find(x=> x.parentId == this.menu.parentId)?.id
          });

        let select2 = {} as {id:string,text:string};
        select2.id = "0";
        select2.text = " ----- ";
        listM.push(select2);

      for(var i = 0; i < listMenu.length; i++)
      {
        let select2 = {} as {id:string,text:string};
        select2.id = (listMenu[i].id)+"";
        select2.text = listMenu[i].titleAr;
        listM.push(select2);
      }

        this.listMenuSelect = listM;
      }
    )
   }


}
