import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { Menu } from 'src/app/interfaces/administration/menu';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  prefixe : string= "/menus";

  constructor(
    private httpClient : HttpClient
  ) { }


  getAllMenusFromBack() : Observable<Menu[]> {
    return this.httpClient.get<Menu[]>(`${environment.api_client_mng_bo}`+this.prefixe);
  }

  getAllMenusForRoleFromBack() : Observable<Menu[]> {
    return this.httpClient.get<Menu[]>(`${environment.api_client_mng_bo}`+this.prefixe+`/role`);
  }

  getAllMenusByCollaborateurConnectedFromBack() : Observable<Menu[]> {
    return this.httpClient.get<Menu[]>(`${environment.api_client_mng_bo}`+this.prefixe+`/userConnected`);
  }


  getAllMenusParentFromBack() : Observable<Menu[]> {
    return this.httpClient.get<Menu[]>(`${environment.api_client_mng_bo}`+this.prefixe+`/parent`);
  }

  getMenuByIdFromBack(id: any)  {
   return this.httpClient.get<Menu>(`${environment.api_client_mng_bo}`+this.prefixe+`/`+id);
 }


  addMenuFromBack(menu : Menu) : Observable<Menu>{
   return this.httpClient.post<Menu>(`${environment.api_client_mng_bo}`+this.prefixe,menu);
  }

  updateMenuFromBack(menu : Menu) : Observable<any>{
   return this.httpClient.put(`${environment.api_client_mng_bo}`+this.prefixe+`/`+menu.id+'/',menu,{responseType: 'text', observe: 'response' });
  }

  deleteMenuByIdFromBack(idMenu : number) : Observable<Menu>{
   return this.httpClient.delete(`${environment.api_client_mng_bo}`+this.prefixe+`/`+idMenu+'/');
  }
}
