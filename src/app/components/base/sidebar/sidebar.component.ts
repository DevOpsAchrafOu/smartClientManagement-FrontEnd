
import { filter } from 'rxjs/operators';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from 'src/app/services/utils/shared.service';
import { CurrentLangService } from 'src/app/services/utils/current-lang.service';
import { HandleStatusService } from 'src/app/services/utils/handle-status.service';
import { UtilisateurService } from 'src/app/services/administration/utilisateur.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {


  /********************************************************************************************/
  /**************************************** The attributes  ***********************************/
  /********************************************************************************************/

  rtl: boolean = false; //par défaul Francais (false)
  isRouteActiveAdmin: boolean = false;
  isRouteActivePar: boolean = false;
  //for show/hide sidebar
  //get data from parent(layout)(parent->child)
  @Input() isActiveInChild : boolean = false;
  @Input() isSideBarCloseChild: boolean = true;
  @Output() sideBarActiveChild1 = new EventEmitter();
  isfixed : boolean = false;
  data : any;

  countUtilisateursPending : number = 0;
  //list Menu
  listMenu : any[] = [];
  //Map Menu
  mapMenu = new Map<number, any>();

  /********************************************************************************************/
  /************************************* Initialization functions  ****************************/
  /*******************************************************************************************/

  constructor(
    private sharedData :SharedService,
    public transtale : TranslateService,
    private currentLangService:CurrentLangService,
    private utilisateurService: UtilisateurService,
    private router: Router,
    private route:ActivatedRoute,
    private handleErrorServ : HandleStatusService
  ) {
    router.events.pipe(
      filter(event => event instanceof NavigationEnd)
  )
      .subscribe((event : any) => {
          if(event?.url)
            if(event?.url.includes('/administration')){
              this.isRouteActiveAdmin = true;
            }else{
              this.isRouteActiveAdmin = false;
            }

            if(event?.url.includes('/parametrage')){
              this.isRouteActivePar = true;
            }else{
              this.isRouteActivePar = false;
            }
      });
  }

  ngOnInit(): void {
    //extraire data Shared
    this.sharedData.currentDataMenu.subscribe(data => this.data = data);
    console.log("=> data menu");
    console.log(this.data)

    //get current lang
    this.rtl = this.currentLangService.isRTL();

  }

  /********************************************************************************************/
  /**************************************  The functions **************************************/
  /********************************************************************************************/

  /* close sidebar in sidebar */
  closeSidebar(): void {
    this.isActiveInChild = !this.data.menu;
    this.sharedData.changeDataMenu({ menu: this.isActiveInChild });
  }



}
