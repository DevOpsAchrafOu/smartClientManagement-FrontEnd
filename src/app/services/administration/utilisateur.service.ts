import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Utilisateur } from 'src/app/interfaces/administration/utilisateur';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UtilisateurService {

  /********************************************************************************************/
  /**************************************** The attributes  ***********************************/
  /********************************************************************************************/
  prefixeUrl : string= "/utilisateurs";


  constructor(
    private httpClient : HttpClient
  ) { }

  /**
   * get me
   * @param
   * @return Utilisateur Object
   */
  getConnectedUtilisateurFromBack() : Observable<HttpResponse<any>>  {
    return this.httpClient.get<HttpResponse<any>>(`${environment.baseUrl_mng}`+this.prefixeUrl+"/me",{observe: 'response'});
  }


   getAllUtilisateursFromBack() : Observable<Utilisateur[]> {
     return this.httpClient.get<Utilisateur[]>(`${environment.baseUrl_mng}`+this.prefixeUrl);
   }

   getUtilisateurByIdFromBack(id: any)  {
    return this.httpClient.get<Utilisateur>(`${environment.baseUrl_mng}`+this.prefixeUrl+`/`+id);
  }


   addUtilisateurFromBack(user : Utilisateur) : Observable<Utilisateur>{
    return this.httpClient.post<Utilisateur>(`${environment.baseUrl_mng}/signup`,user);
   }

   updateUtilisateurFromBack(user : Utilisateur) : Observable<any>{
    return this.httpClient.put(`${environment.baseUrl_mng}`+this.prefixeUrl+`/`+user.id+'/',user,{ observe: 'response' });
   }

   deleteUtilisateurByIdFromBack(idUser : number) : Observable<Utilisateur>{
    return this.httpClient.delete(`${environment.baseUrl_mng}`+this.prefixeUrl+`/`+idUser+'/');
   }

  //  editPassword(pwd : Password) {
  //   return this.httpClient.put(`${environment.api_client_mng_bo}`+this.prefixe+`/passwords`,pwd,{ observe: 'response' });
  //  }

}
