import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, catchError, switchMap, throwError } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class UserService {
  private apiUrl = "http://https://tcc-main.up.railway.app/user/register-access";
  private apiAllUsersUrl = "http://https://tcc-main.up.railway.app/user";
  private localCreateCollaboratorUrl = "http://https://tcc-main.up.railway.app/user/create-collaborator";
  private localDepartmentsUrl = "http://https://tcc-main.up.railway.app/departments";
  private localUserByEmailUrl = "http://https://tcc-main.up.railway.app/user/by-email";
  private localMeUrl = "http://https://tcc-main.up.railway.app/user/me";
  private remoteMeUrl = "http://https://tcc-main.up.railway.app/user/me";
  private remoteUserByEmailUrl = "http://https://tcc-main.up.railway.app/user/by-email";

  constructor(private http: HttpClient) {}

  createUser(user: any): Observable<any> {
    return this.http.post(this.apiUrl, user);
  }

  createCollaboratorLocal(data: { first_Name: string; last_Name: string; email: string; password: string; departmentId?: number }): Observable<any> {
    return this.http.post(this.localCreateCollaboratorUrl, data);
  }

  getDepartmentsLocal(): Observable<any[]> {
    return this.http.get<any[]>(this.localDepartmentsUrl);
  }

  updateUser(user: any): Observable<any> {
    return this.http.put(this.apiUrl, user);
  }

  getUserByEmail(email: string): Observable<any> {
    return this.http.get<any>(`${this.localUserByEmailUrl}?email=${encodeURIComponent(email)}`);
  }

  getCurrentUser(): Observable<any> {
    return this.http.get<any>(this.localMeUrl).pipe(
      catchError(err => {
        if (err.status === 404 || err.status === 0) {
          // fallback para remoto
          return this.http.get<any>(this.remoteMeUrl).pipe(
            catchError(e2 => {
              // fallback final: tentar by-email se token disponível
              const payloadRaw = localStorage.getItem('token');
              if (!payloadRaw) return throwError(() => e2);
              try {
                const token = payloadRaw;
                const payload = JSON.parse(atob(token.split('.')[1] || ''));
                const email = payload?.email;
                if (email) {
                  return this.http.get<any>(`${this.remoteUserByEmailUrl}?email=${encodeURIComponent(email)}`);
                }
              } catch {}
              return throwError(() => e2);
            })
          );
        }
        return throwError(() => err);
      })
    );
  }

  updateCurrentUser(data: any): Observable<any> {
    return this.http.put<any>(this.localMeUrl, data).pipe(
      catchError(err => {
        if (err.status === 404 || err.status === 0) {
          return this.http.put<any>(this.remoteMeUrl, data);
        }
        return throwError(() => err);
      })
    );
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiAllUsersUrl);
  }
}
