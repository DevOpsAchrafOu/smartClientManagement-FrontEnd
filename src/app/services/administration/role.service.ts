import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Role } from 'src/app/interfaces/administration/role';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class RoleService {



  prefixe : string= "/roles";
  public roleSuperAdmin = 'ROLE_SUPER_ADMIN';
  public roleAdmin = 'ROLE_ADMIN';
  public roleDirection = 'ROLE_DIR_GEN';
  public roleManger = 'ROLE_MANGER';
  public roleUser = 'ROLE_ROLE_USER';

  public rolesValidationForRapport = ['ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_MANGER','ROLE_ROLE_USER'];

  constructor(
    private httpClient : HttpClient
  ) { }


  getAllRolesFromBack() : Observable<any[]> {
    return this.httpClient.get<any[]>(`${environment.api_client_mng_bo}`+this.prefixe);
  }

  getRoleByIdFromBack(id: any)  {
   return this.httpClient.get<Role>(`${environment.api_client_mng_bo}`+this.prefixe+`/`+id);
 }

 countUtilisateurByRoleIdFromBack(id: any)  {
  return this.httpClient.get<Role>(`${environment.api_client_mng_bo}`+this.prefixe+`/utilisateur/count/`+id);
}

  addRoleFromBack(role : Role) : Observable<Role>{
   return this.httpClient.post<Role>(`${environment.api_client_mng_bo}`+this.prefixe,role);
  }

  updateRoleFromBack(role : Role) : Observable<any>{
   return this.httpClient.put(`${environment.api_client_mng_bo}`+this.prefixe+`/`+role.id,role,{responseType: 'text', observe: 'response' });
  }

  deleteRoleByIdFromBack(idRole : number) : Observable<Role>{
   return this.httpClient.delete(`${environment.api_client_mng_bo}`+this.prefixe+`/`+idRole);
  }


}
