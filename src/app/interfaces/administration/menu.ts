export interface Menu {

  id?: number;
  icon? : string;
  order? : number;
  typeNav? : string;
  titleAr? : string;
  titleFr? : string;
  parentId? : number;
  url? : string;
  children ? : Menu[];
  hasChildren? : boolean;

}
