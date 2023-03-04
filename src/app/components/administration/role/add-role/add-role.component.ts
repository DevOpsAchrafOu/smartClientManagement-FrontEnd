import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, NgForm, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Menu } from 'src/app/interfaces/administration/menu';
import { Role } from 'src/app/interfaces/administration/role';
import { MenuService } from 'src/app/services/administration/menu.service';
import { RoleService } from 'src/app/services/administration/role.service';
import { CurrentLangService } from 'src/app/services/utils/current-lang.service';
import { HandleStatusService } from 'src/app/services/utils/handle-status.service';


@Component({
  selector: 'app-add-role',
  templateUrl: './add-role.component.html',
  styleUrls: ['./add-role.component.css']
})
export class AddRoleComponent implements OnInit {


  /********************************************************************************************/
  /**************************************** The attributes  ***********************************/
  /********************************************************************************************/
  loading : boolean = false;
  rtl: boolean = false; //par défaul Francais (false)
  //Map
  mapMenu = new Map<number, any>();
  mapMenuToList : any[] = [];
  menus: {
    id?: number;
    icon?: string;
    title?: string;
    checked?: boolean;
        } [] = [];

  listMenuWithChildren : any = [];

  display: string = 'block';
  isCreated : boolean = true;
  formContent: any ;
  isSubmit= false;
  @Input() role: Role= {} as Role;// objet de type Role
  @Output() outputEvent = new EventEmitter();

  messageError = "";

  /********************************************************************************************/
  /************************************* Initialization functions  ****************************/
  /*******************************************************************************************/

  constructor(private formBuilder: FormBuilder,
     private roleService: RoleService,
     private menuService : MenuService,
     private handleErrorServ : HandleStatusService,
     private currentLangService: CurrentLangService,
     private translate: TranslateService,) {
     }

  ngOnInit() {

    this.initForm();
    this.isCreated = ! ('id' in this.role);//attrubier in objet
    console.log("role =>");
    console.log(this.role);

    //get all menu with selected
    this.getAllMenu();

    //get current lang
    //this.rtl = this.currentLangService.isRTL();
  }


  /********************************************************************************************/
  /**************************************  The functions **************************************/
  /********************************************************************************************/

  formSubmit(form: NgForm) {
    this.isSubmit = true;
    if (form.value['code'] == this.roleService.roleSuperAdmin)
    {
      this.messageError = "Choisir autre code pour ce rôle"
      return
    }
    if (this.formContent.invalid)
    {
      this.messageError = "Choisir autre code pour ce rôle"
      return
    }
      this.messageError = "";
    /* start create role object part*/
    this.createRole(form);
    /* End create role object part*/
    this.loading = true;// start Loading
    /* start add role part*/
    if(this.isCreated){
      this.roleService.addRoleFromBack(this.role).subscribe(
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
    /* End add role part*/
    /* start update role part*/
    else{
      this.roleService.updateRoleFromBack(this.role).subscribe(
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
    /* End update role part*/

  }

  initForm() {
    this.formContent = this.formBuilder.group({
      code:[{value:this.role.code, disabled: this.role.code == this.roleService.roleSuperAdmin ? true : false},
        [Validators.required],
      ],
      title: [this.role.title, [Validators.required]],
       // control for Checkbox exemple
      menus: new FormArray([], [Validators.required]),
    });
  }

  onCloseModal() {
    this.display = 'none';
  }

  createRole(form : NgForm){

    this.role.code = this.role.code == this.roleService.roleSuperAdmin ? this.role.code : form.value['code'];
    this.role.title = form.value['title'];


    let selectedMenuIds : number[]= [];
    // get selected menu from FormGroup value
    form.value['menus'].forEach((menu :any) => {
      //add menu checked
      if(menu.checked)
      selectedMenuIds.push(menu.id);
    });

    this.role.menus = selectedMenuIds;
    console.log("createRole =>");
    console.log(this.role);
  }


  /* get all menu */
 getAllMenu(){
  // get array control
  const formArray = this.formContent.get('menus') as FormArray;

  this.menuService.getAllMenusForRoleFromBack().subscribe(
    (dataList : Menu[]) =>{
      this.listMenuWithChildren = dataList;
      console.log('getAllMenusFromBack/listMenuWithChildren =>');
      console.log(dataList);
      this.listMenuWithChildren.map((x : any) => {
         console.log(x);
        if(x){
          if (x.id){
            //add parent
            if( x.parentId == 0){
              if(x.hasChildren){
                this.mapMenu.set(x.id, [x] );
              }else{
                if(this.mapMenu.has(x.parentId)){
                  let listMenuExist  = this.mapMenu.get(x.parentId);
                  this.mapMenu.set(x.parentId, [...listMenuExist, ...[x]]);
                }else{
                  this.mapMenu.set(x.parentId, [x] );
                }
              }
            }
            //add children
            if(x?.children && x?.children.length > 0)
              x?.children.map((xChildren : any) => {
                if(this.mapMenu.has(xChildren.parentId)){
                  let listMenuExist  = this.mapMenu.get(xChildren.parentId);
                  this.mapMenu.set(xChildren.parentId, [...listMenuExist, ...[xChildren]]);
                }else{
                  this.mapMenu.set(xChildren.parentId, [xChildren] );
                }
              });

          }
        }

      });

      // map to array
      this.mapMenuToList = Array.from(this.mapMenu.values())

      // loop for each existing value
      this.listMenuWithChildren.forEach((menu : any) => {
        // add parent new control to FormArray
        formArray.push(
          // here the new FormControl with item value from radioListForm
          new FormGroup({
            id: new FormControl(menu.id),
            parentId: new FormControl(menu.parentId),
            checked: new FormControl((('id' in this.role) && (this.role.menus && menu.id && this.role.menus.includes(menu.id))) ? true : false),
          })
        );
        //add children  new control to FormArray
        if(menu?.children && menu?.children.length > 0)
          menu?.children.forEach((mChildren :any)=> {
            formArray.push(
              // here the new FormControl with item value from radioListForm
              new FormGroup({
                id: new FormControl(mChildren.id),
                parentId: new FormControl(mChildren.parentId),
                checked: new FormControl((('id' in this.role) && (this.role.menus && mChildren.id && this.role.menus.includes(mChildren.id))) ? true : false),
              })
            );

          });
      });
    }

  )


 }

 checkedAllOrInCheckedAll(parent : any,index : number){
  const formArray = this.formContent.get('menus') as FormArray;
  this.formContent.controls?.menus?.value.forEach((menu:any,key : any) => {
    if(menu.parentId == parent.id){

      formArray.at(key).patchValue({id: menu.id, parentId: menu.parentId, checked: !formArray.at(index).value.checked});//
    }
  });
}

  checkedSubOrInCheckedSub(parent : any,index : number){
    const formArray = this.formContent.get('menus') as FormArray;
    this.formContent.controls?.menus?.value.forEach((menu:any,key : any) => {
      if(menu.id == parent.parentId){
        if(formArray.at(index).value.checked == true)
        formArray.at(key).patchValue({id: menu.id, parentId: menu.parentId, checked: !formArray.at(index).value.checked});//
      }
    });
 }
}
