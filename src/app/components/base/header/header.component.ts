import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/security/auth.service';
import { CurrentLangService } from 'src/app/services/utils/current-lang.service';
import { SharedService } from 'src/app/services/utils/shared.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

 /********************************************************************************************/
  /**************************************** The attributes  ***********************************/
  /********************************************************************************************/


  rtl: boolean = false; //par défaul Francais (false)

  isActiveInChildNav : boolean = false;
  @Output() sideBarActiveChild  = new EventEmitter<string>();
  @Output() sideBarCloseChild = new EventEmitter();
  @Input() isActiveInChild1: boolean = false;

  dataUser : any;
  dataMenu : any;
  dataAvatarLogo : any;

  searchNumDossier : string = "";
  /********************************************************************************************/
  /************************************* Initialization functions  ****************************/
  /*******************************************************************************************/

 constructor(
   private authServ: AuthService,
   private router : Router,
   private sharedData : SharedService,
   private currentLangService: CurrentLangService
 ) { }

 ngOnInit(): void {

  //extraire data Shared
  this.sharedData.currentDataCurrentUserName.subscribe(data => this.dataUser = data);
  this.sharedData.currentDataAvatarLogo.subscribe(data => this.dataAvatarLogo = data);
  this.sharedData.currentDataMenu.subscribe((data) => (this.dataMenu = data));


   //set CurrentUserName And AvatarLogo
   if(this.dataUser == "" || this.dataAvatarLogo){
    let connectedUser = this.authServ.loadConnectedUser();
    this.sharedData.setCurrentUserNameAndAvatarLogo(connectedUser);
   }


    //get current lang
    this.rtl = this.currentLangService.isRTL();

 }



  /********************************************************************************************/
  /**************************************  The functions **************************************/
  /********************************************************************************************/

 //for show/hide sidebar
 onSidebarCollapse(){
  this.isActiveInChildNav = !this.dataMenu.menu;
  //cahange data Shared
  this.sharedData.changeDataMenu({ menu: this.isActiveInChildNav });
 }


 sendData(arg : any) {
  this.sideBarActiveChild.emit(arg);
  this.sideBarCloseChild.emit(false);

  console.log("sideBarActive=> "+ arg);
  console.log("sideBarClose=> "+false);

 }

 onLogout(){
  this.authServ.onLogout();
 }

 searchByNumDossier(){
  if(this.searchNumDossier && this.searchNumDossier != ""){
    this.router.navigate(["/list-historique-operation"],
    {
      queryParams: {
        numDossier : this.searchNumDossier,
       },
      queryParamsHandling: 'merge', // remove to replace all query params by provided
    });
    this.searchNumDossier = "";
  }
 }

 onGoEditPassword(){
  this.router.navigate(["/edit-password"])
}

}
