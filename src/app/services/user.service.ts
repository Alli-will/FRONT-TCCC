import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class UserService {
  private apiUrl = "https://tcc-main.up.railway.app/user/register-access";
  private apiAllUsersUrl = "https://tcc-main.up.railway.app/user";

  constructor(private http: HttpClient) {}

  createUser(user: any): Observable<any> {
    return this.http.post(this.apiUrl, user);
  }

  updateUser(user: any): Observable<any> {
    return this.http.put(this.apiUrl, user);
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiAllUsersUrl);
  }
}
