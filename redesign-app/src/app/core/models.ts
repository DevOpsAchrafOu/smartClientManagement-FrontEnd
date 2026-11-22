/** Data shapes returned by the Spring Boot API (see the backend DTOs). */
export interface Menu {
  id: number;
  titleFr: string;
  titleAr: string;
  url: string;
  order: number;
  typeNav?: string;
  icon: string;
  parentId: number;
  children?: Menu[];
  hasChildren?: boolean;
}

export interface Role {
  id: number;
  title: string;
  code: string;
  menus: number[];
}

export interface User {
  id: number;
  login: string;
  email: string;
  password?: string;
  nom: string;
  prenom: string;
  phone: string;
  creationDate?: string;
  state?: string;
  role: string;
}

export interface Country {
  id: number;
  titleFr: string;
  titleAr: string;
}

export interface City {
  id: number;
  titleFr: string;
  titleAr: string;
  idPays: number;
}
