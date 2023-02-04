import { Utilisateur } from './../../interfaces/administration/utilisateur';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  constructor() { }

  //utiliser  BehaviorSubject fournir par rxjs pour partager les données de facon synchroniser (detecte change data where did in all of Component)
  valueDefault=false;
  //for menu
  private dataSourceMenu = new BehaviorSubject({
    menu: this.valueDefault
  });
  //for currentUser
  private dataSourceCurrentUserName = new BehaviorSubject({
    currentUserName: ""
  });
  //for avatarLogo
  private dataSourceAvatarLogo = new BehaviorSubject({
    avatarLogo: ""
  });



  currentDataMenu = this.dataSourceMenu.asObservable();
  currentDataCurrentUserName = this.dataSourceCurrentUserName.asObservable();
  currentDataAvatarLogo = this.dataSourceAvatarLogo.asObservable();

  // pour nombre des nouvelle ordre pour ce Employeur(Orienteur/Agent)
  changeDataMenu(data: any) {
    this.dataSourceMenu.next(data);
  }

  changeDataCurrentUserName(data: any) {
    this.dataSourceCurrentUserName.next(data);
  }

  changeDataAvatarLogo(data: any) {
    this.dataSourceAvatarLogo.next(data);
  }


  //set CurrentUserName And AvatarLogo
  setCurrentUserNameAndAvatarLogo(connectedUser : Utilisateur){
    if(connectedUser && connectedUser?.nom){
      let connectedUserName =connectedUser?.nom+" "+connectedUser?.prenom;
      this.changeDataCurrentUserName({ currentUserName: connectedUserName });

      let avatarLogo =((connectedUser?.nom && connectedUser?.prenom)? connectedUser?.nom.substring(0,1)+connectedUser?.prenom.substring(0,1) : connectedUser?.nom.substring(0,2));
      this.changeDataAvatarLogo({ avatarLogo: avatarLogo.toUpperCase() });
    }

  }
}
