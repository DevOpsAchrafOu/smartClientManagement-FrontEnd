import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AlertSwalService } from '../utils/alert-swal.service';
import { SharedService } from '../utils/shared.service';
import { Login } from 'src/app/interfaces/login';
import { Utilisateur } from 'src/app/interfaces/administration/utilisateur';

@Injectable({
  providedIn: 'root'
})
export class AuthService {


  /********************************************************************************************/
  /**************************************** The attributes  ***********************************/
  /********************************************************************************************/

  prefixeUrl : string= "/end-users";
  loading : boolean = false;

  /********************************************************************************************/
  /************************************* Initialization functions  ****************************/
  /*******************************************************************************************/
  constructor(
    private router : Router,
    private httpClient : HttpClient,
    private toastr : ToastrService,
    private alertServ : AlertSwalService,
    private sharedData : SharedService,
  ) { }


    /**
   * login by username, pwd
   * @param login: userName, password
   * @return token:
   */
  login(user: Login){
    return this.httpClient.post(`${environment.baseUrl_mng_login}/login`,user,{responseType: 'text', observe: 'response' });

  }

  saveToken(token: string): void {
    localStorage.setItem("token_client_mng_bo", token);
  }

  loadToken(): string {
    let token = localStorage.getItem("token_client_mng_bo");
      return (token == null ? "" : token);
  }


  deleteToken(): void {
    localStorage.removeItem("token_client_mng_bo");
  }

  saveCurrentUser(connectedUser: Utilisateur): void {
    localStorage.setItem("connectedUser_client_mng_bo", JSON.stringify(connectedUser));

  }

  loadConnectedUser(): Utilisateur {
    let connectedUser = localStorage.getItem("connectedUser_client_mng_bo");
    return  connectedUser == null ? "" : JSON.parse(connectedUser);
  }

  deleteConnectedUser(): void {
    localStorage.removeItem("connectedUser_client_mng_bo");
  }

  isConnected(): boolean {
    return this.loadToken() ? true : false;
  }

  isloadConnectedUser(): boolean {

    let connectedUser = this.loadConnectedUser();

    console.log(connectedUser)

    //set CurrentUserName And AvatarLogo
    this.sharedData.setCurrentUserNameAndAvatarLogo(connectedUser);


    return this.loadConnectedUser() ? true : false;
  }

  logout() {
    return this.httpClient.get(`${environment.baseUrl_mng}/public/logout`,{responseType: 'text' , observe: 'response'});
  }

  onLogout(){
     this.logout()
    .subscribe(
        (data : any) => {
          if(data){
            this.deleteLocalStorage();
          }
          return false;
        },
        error => {
          if(error.status === 403){
            this.deleteLocalStorage();
          }
          else{
            this.deleteLocalStorage();
          }
          return false;
        }
      );
   }


  deleteLocalStorage(){
    this.deleteToken();
    this.deleteConnectedUser();
    this.router.navigate(["/login"]);
  }
}
