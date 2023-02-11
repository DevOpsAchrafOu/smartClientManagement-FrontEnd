import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Ville } from 'src/app/interfaces/paramètres/ville';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VilleService {


  /********************************************************************************************/
  /**************************************** The attributes  ***********************************/
  /********************************************************************************************/

  prefixe : string= "/villes";


  /********************************************************************************************/
  /************************************* Initialization Villes  ****************************/
  /*******************************************************************************************/
  constructor(
    private httpClient : HttpClient
  ) { }


  /********************************************************************************************/
  /**************************************  The Villes **************************************/
  /********************************************************************************************/


  getAllVillesFromBack() : Observable<Ville[]> {
    return this.httpClient.get<Ville[]>(`${environment.api_client_mng_bo}`+this.prefixe);
  }

  getVilleByIdFromBack(id: any)  {
   return this.httpClient.get<Ville>(`${environment.api_client_mng_bo}`+this.prefixe+`/`+id);
 }

  /* get city by country (id)*/
  getVillesForCountryFromBack(id : number) : Observable<HttpResponse<any>> {
  return this.httpClient.get<HttpResponse<any>>(`${environment.api_client_mng_bo}`+this.prefixe+`/pays/`+id,{observe: 'response'});
}

  addVilleFromBack(ville : Ville) : Observable<Ville>{
   return this.httpClient.post<Ville>(`${environment.api_client_mng_bo}`+this.prefixe,ville);
  }

  updateVilleFromBack(ville : Ville) : Observable<any>{
   return this.httpClient.put(`${environment.api_client_mng_bo}`+this.prefixe+`/`+ville.id+'/',ville,{responseType: 'text', observe: 'response' });
  }

  deleteVilleByIdFromBack(idVille : number) : Observable<Ville>{
   return this.httpClient.delete(`${environment.api_client_mng_bo}`+this.prefixe+`/`+idVille+'/');
  }

}
