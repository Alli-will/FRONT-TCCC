import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    try {
      const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
      const token = isBrowser ? localStorage.getItem('token') : null;
      // Só adiciona para chamadas ao backend local
      if (token && req.url.startsWith('https://tcc-main.up.railway.app')) {
        const authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
        return next.handle(authReq);
      }
    } catch {}
    return next.handle(req);
  }
}
