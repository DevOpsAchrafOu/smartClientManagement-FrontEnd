import { HttpEvent, HttpHandler, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TokenHtppInterceptorService {

  constructor(private authService: AuthService) { }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.authService.loadToken()) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${this.authService.loadToken()}` }
      });
    }
    return next.handle(req);
  }
}
