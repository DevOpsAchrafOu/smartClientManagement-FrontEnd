import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pays } from 'src/app/interfaces/paramètres/pays';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaysService {


  /********************************************************************************************/
  /**************************************** The attributes  ***********************************/
  /********************************************************************************************/

  prefixe : string= "/pays";


  /********************************************************************************************/
  /************************************* Initialization pays  ****************************/
  /*******************************************************************************************/
  constructor(
    private httpClient : HttpClient
  ) { }


  /********************************************************************************************/
  /**************************************  The pays **************************************/
  /********************************************************************************************/


  getAllPayssFromBack() : Observable<Pays[]> {
    return this.httpClient.get<Pays[]>(`${environment.api_client_mng_bo}`+this.prefixe);
  }

  getPaysByIdFromBack(id: any)  {
   return this.httpClient.get<Pays>(`${environment.api_client_mng_bo}`+this.prefixe+`/`+id);
 }


  addPaysFromBack(pays : Pays) : Observable<Pays>{
   return this.httpClient.post<Pays>(`${environment.api_client_mng_bo}`+this.prefixe,pays);
  }

  updatePaysFromBack(pays : Pays) : Observable<any>{
   return this.httpClient.put(`${environment.api_client_mng_bo}`+this.prefixe+`/`+pays.id+'/',pays,{responseType: 'text', observe: 'response' });
  }

  deletePaysByIdFromBack(idPays : number) : Observable<Pays>{
   return this.httpClient.delete(`${environment.api_client_mng_bo}`+this.prefixe+`/`+idPays+'/');
  }
}
