import { Component, OnInit } from '@angular/core';
import { CurrentLangService } from 'src/app/services/utils/current-lang.service';
import { SharedService } from 'src/app/services/utils/shared.service';


@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {

 /********************************************************************************************/
  /**************************************** The attributes  ***********************************/
  /********************************************************************************************/

  rtl: boolean = false; //par défaul Francais (false)


  isSideBarCloseInParent: boolean = true;


   //for show/hide sidebar
   isActiveInParent: boolean = false;
   isActiveInParent1: boolean = false;
  dataFromChild : any;
  data: any;
  /********************************************************************************************/
  /************************************* Initialization functions  ****************************/
  /********************************************************************************************/

  constructor(
    private sharedData: SharedService,
    private currentLangService: CurrentLangService) { }

  ngOnInit(): void {
    //extraire data Shared
    this.sharedData.currentDataMenu.subscribe((data) => (this.data = data));

    //get current lang
    this.rtl = this.currentLangService.isRTL();
  }


  /********************************************************************************************/
  /**************************************  The functions **************************************/
  /********************************************************************************************/

  //get data from child(component sideBar)(child->parent))
  getDataFromChild($event: any): void {
    this.isActiveInParent = $event;
    // console.log(this.isActiveInParent);
  }

  getDataFromChild1($event: any): void {
    this.isActiveInParent1 = $event;
    // console.log(this.isActiveInParent);
  }

  closeSidebar($event:any): void {
    this.isSideBarCloseInParent = $event;
    console.log(this.isSideBarCloseInParent);
  }
}
