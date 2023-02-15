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

  prefixeUrl : string= "/pays";


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
    return this.httpClient.get<Pays[]>(`${environment.baseUrl_mng}`+this.prefixeUrl);
  }

  getPaysByIdFromBack(id: any)  {
   return this.httpClient.get<Pays>(`${environment.baseUrl_mng}`+this.prefixeUrl+`/`+id);
 }


  addPaysFromBack(pays : Pays) : Observable<Pays>{
   return this.httpClient.post<Pays>(`${environment.baseUrl_mng}`+this.prefixeUrl,pays);
  }

  updatePaysFromBack(pays : Pays) : Observable<any>{
   return this.httpClient.put(`${environment.baseUrl_mng}`+this.prefixeUrl+`/`+pays.id+'/',pays,{responseType: 'text', observe: 'response' });
  }

  deletePaysByIdFromBack(idPays : number) : Observable<Pays>{
   return this.httpClient.delete(`${environment.baseUrl_mng}`+this.prefixeUrl+`/`+idPays+'/');
  }
}
