export interface Utilisateur {

  id? : number;

  prenom? : string;
  email? : string;
  entite? : string;
  login? : string;
  password? : boolean;
  nom? : string;
  phone? : string;
  state? : string;
  temporaryPwd? : boolean;
  role?: string;

  creationDate ?: string;//date d'inscription
  token? : string;

}
