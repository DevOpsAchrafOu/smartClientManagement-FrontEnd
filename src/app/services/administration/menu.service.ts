import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { Menu } from 'src/app/interfaces/administration/menu';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  prefixeUrl : string= "/menus";

  constructor(
    private httpClient : HttpClient
  ) { }


  getAllMenusFromBack() : Observable<Menu[]> {
    return this.httpClient.get<Menu[]>(`${environment.baseUrl_mng}`+this.prefixeUrl);
  }

  getAllMenusForRoleFromBack() : Observable<Menu[]> {
    return this.httpClient.get<Menu[]>(`${environment.baseUrl_mng}`+this.prefixeUrl+`/role`);
  }

  getAllMenusByUtilisateurConnectedFromBack() : Observable<Menu[]> {
    return this.httpClient.get<Menu[]>(`${environment.baseUrl_mng}`+this.prefixeUrl+`/userConnected`);
  }


  getAllMenusParentFromBack() : Observable<Menu[]> {
    return this.httpClient.get<Menu[]>(`${environment.baseUrl_mng}`+this.prefixeUrl+`/parent`);
  }

  getMenuByIdFromBack(id: any)  {
   return this.httpClient.get<Menu>(`${environment.baseUrl_mng}`+this.prefixeUrl+`/`+id);
 }


  addMenuFromBack(menu : Menu) : Observable<Menu>{
   return this.httpClient.post<Menu>(`${environment.baseUrl_mng}`+this.prefixeUrl,menu);
  }

  updateMenuFromBack(menu : Menu) : Observable<any>{
   return this.httpClient.put(`${environment.baseUrl_mng}`+this.prefixeUrl+`/`+menu.id+'/',menu,{responseType: 'text', observe: 'response' });
  }

  deleteMenuByIdFromBack(idMenu : number) : Observable<Menu>{
   return this.httpClient.delete(`${environment.baseUrl_mng}`+this.prefixeUrl+`/`+idMenu+'/');
  }
}
