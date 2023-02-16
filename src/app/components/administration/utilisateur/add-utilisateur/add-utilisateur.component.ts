import { tap, switchMap, filter } from 'rxjs/operators';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, NgForm, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Select2OptionData } from 'ng-select2';
import { Options } from 'select2';
import { Utilisateur } from 'src/app/interfaces/administration/utilisateur';
import { Role } from 'src/app/interfaces/administration/role';
import { UtilisateurService } from 'src/app/services/administration/utilisateur.service';
import { RoleService } from 'src/app/services/administration/role.service';
import { HandleStatusService } from 'src/app/services/utils/handle-status.service';
import { CurrentLangService } from 'src/app/services/utils/current-lang.service';
import { ValidatorService } from 'src/app/services/utils/validator.service';
import { UtilsService } from 'src/app/services/utils/utils.service';

@Component({
  selector: 'app-add-utilisateur',
  templateUrl: './add-utilisateur.component.html',
  styleUrls: ['./add-utilisateur.component.css']
})
export class AddUtilisateurComponent implements OnInit {


  /********************************************************************************************/
  /**************************************** The attributes  ***********************************/
  /********************************************************************************************/
  rtl: boolean = false; //par défaul Francais (false)


  currentCollborateur : Utilisateur = {};
  isAuthorizerToUpdate = true;
  //Map
  mapWorkflow = new Map<number, any>();
  mapWorkflowToList : any[] = [];
  listWorkflow : any = [];
  listColumn : string[] = ['supported','control','approbation','complementInformation','validation','rejet','notification']


  checkRF : any = {'check': false,'valueUpdate': false};
  checkRFF : any = {'check': false,'valueUpdate': false};


  public listRoleSelect: Array<Select2OptionData> = [];
  public listEntiteSelect: Array<Select2OptionData> = [];
  public optionsSelect: Options = {};
  listRole: Array<Role> = [];
  roleSuperAdmin = "";

  display: string = 'block';
  isCreated : boolean = true;
  formContent: any ;
  isSubmit = false;
  @Input() user: any= {} as any;// objet de type User
  @Output() outputEvent = new EventEmitter();



  /********************************************************************************************/
  /************************************* Initialization functions  ****************************/
  /*******************************************************************************************/

  constructor(private formBuilder: FormBuilder,
     private userService: UtilisateurService,
     private roleService: RoleService,
     private validatorService : ValidatorService,
     private handleErrorServ : HandleStatusService,
     private currentLangService: CurrentLangService,
     private translate: TranslateService
     ) {
      this.roleSuperAdmin = roleService.roleSuperAdmin;
     }

  ngOnInit() {

    this.isCreated = ! ('id' in this.user);//attrubier in objet
    this.initForm();

    // get Current Collborateur
    this.getCurrentCollborateur();

    this.getAllRole();

    this.optionsSelect = {
      multiple: false,
      closeOnSelect: true,//
      minimumResultsForSearch : -1//display search
    };


    //get current lang
    // this.rtl = this.currentLangService.isRTL();

  }


  /********************************************************************************************/
  /**************************************  The functions **************************************/
  /********************************************************************************************/

  getCurrentCollborateur(){
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
                this.currentCollborateur = user;
                if(this.isCreated == false && this.user.role == this.roleSuperAdmin){
                  if(this.currentCollborateur.role == this.roleSuperAdmin){//this.user.login == this.currentCollborateur.login &&
                    this.isAuthorizerToUpdate = true;
                  }else{
                    this.isAuthorizerToUpdate = false;
                  }
                }
                else{
                  this.isAuthorizerToUpdate = true;
                }
              }
            }
          }

        },
        error => {
          this.handleErrorServ.onHandleCodeStatus(error);
        }
      );
  }

  formSubmit(form: NgForm) {

    this.isSubmit = true;
    if (this.formContent.invalid)
    {  return  }

    /* start create user object part*/
    this.createUser(form);
    /* End create user object part*/

    /* start add user part*/
    if(this.isCreated){
      this.userService.addUtilisateurFromBack(this.user).subscribe(
        (data : any) => {
          if(data && data.id != null){
            this.onCloseModal();
            this.outputEvent.emit(data);//emit data
          }
        },
        err =>{
          this.outputEvent.emit(err);
        }
      );
    }
    /* End add user part*/
    /* start update user part*/
    else{
      if(this.isAuthorizerToUpdate)
        this.userService.updateUtilisateurFromBack(this.user).subscribe(
          data => {
            if(data && data.body && data.body.id != null){
              this.onCloseModal();
              this.outputEvent.emit(data);//emit data
            }
          },
          err =>{
            this.outputEvent.emit(err);
          }
        );
    }
    /* End update user part*/
  }

  initForm() {
    console.log("=> initForm")
    console.log(this.user)

    if(this.isCreated == true){
      console.log("isCreated true");
      this.formContent = this.formBuilder.group({
        prenom: [this.user.prenom, [Validators.required]],
        nom: [this.user.nom, [Validators.required]],
        role: [0,[Validators.required] ],//
        phone: [this.user.phone, [Validators.required]],
        email:[this.user.email,[Validators.pattern("[a-zA-Z0-9._%+-]+@[a-za-zA-Z0-9.-]+\.[a-z]{2,3}$")]],
        login: [this.user.login, [Validators.required]],//
        password: ['', [Validators.required]],
        confirmPass: ['', Validators.required],
        Row: this.formBuilder.array([]),
        },{validator: this.validatorService.checkIfMatchingPasswords('password', 'confirmPass')}

      );

    }
    else
      {
        console.log("isCreated false");
        this.formContent = this.formBuilder.group({
          prenom: [this.user.prenom, [Validators.required]],
          nom: [this.user.nom, [Validators.required]],
          role: [0,[Validators.required] ],//
          phone: [this.user.phone, [Validators.required]],
          email:[this.user.email,[Validators.pattern("[a-zA-Z0-9._%+-]+@[a-za-zA-Z0-9.-]+\.[a-z]{2,3}$")]],
          login: [this.user.login],//, [Validators.required]
          password: [''],
          confirmPass: [''],
          Row: this.formBuilder.array([]),
          },{validator: this.validatorService.checkIfMatchingPasswords('password', 'confirmPass')}
      );
      }

  }


  onCloseModal() {
    this.display = 'none';
  }

  createUser(form : NgForm){

    if(this.isCreated == true){
      this.user.login = form.value['login'];
    }

    this.user.email = form.value['email'];
    this.user.prenom = form.value['prenom'];
    this.user.nom = form.value['nom'];
    this.user.phone = form.value['phone'];
    this.user.role = this.listRole.find(x=> x.id == form.value["role"])?.code;


    this.user.creationDate = new Date().toISOString().slice(0,16);
    this.user.state = "ACTIVATED";

    if(form.value['password'] != ''){
      this.user.password = form.value['password'];
    }
    else{
      this.user.password = "";
    }

    console.log("=> createUser");
    console.log(this.user);
  }

  /* get all role */
  getAllRole(){

    let listR : any[]= [];
    console.log("getAllRole =>")
    this.roleService.getAllRolesFromBack().subscribe(
      (dataList : any) =>{
        this.listRole = dataList;
        console.log(dataList);
        if(this.user.role)
          this.formContent.patchValue({
            role : this.listRole.find(x=> x.code == this.user.role)?.id
          });

      for(var i = 0; i < dataList.length; i++)
      {
        let select2 = {} as {id:string,text:string};
        select2.id = (dataList[i].id)+"";
        select2.text = dataList[i].title;
        listR.push(select2);
      }

        this.listRoleSelect = listR;
      }
    )
  }


  isExistChamps(array: Array<any>, value: string) {
    return array.indexOf(value) > -1;
  }



}
