import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class CurrentLangService {

  private currentLangStr : string = "";

  constructor(
    public transtale : TranslateService,//pour utiliser dans View
  ) { }

  currentLang(lang : string){
    this.transtale.use(lang);
    localStorage.setItem('currentLang_client_mng',lang);
    return lang;
  }

  isRTL(){

      // get current lang
      this.currentLangStr = localStorage.getItem('currentLang_client_mng') || 'fr';
      this.currentLangStr = this.currentLang(this.currentLangStr);

      if(this.currentLangStr == 'ar')
        return true;
      else
        return false;
  }
}
