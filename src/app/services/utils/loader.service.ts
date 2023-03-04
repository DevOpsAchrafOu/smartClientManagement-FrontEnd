import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  /********************************************************************************************/
  /**************************************** The attributes  ***********************************/
  /********************************************************************************************/

  private loading: boolean = false;

  /********************************************************************************************/
  /************************************* Initialization functions  ****************************/
  /*******************************************************************************************/

  constructor() { }

  /********************************************************************************************/
  /**************************************  The functions **************************************/
  /********************************************************************************************/

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  getLoading(): boolean {
    return this.loading;
  }


}
