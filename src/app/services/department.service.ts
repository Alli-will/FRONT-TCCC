import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private apiUrl = 'https://tcc-main.up.railway.appdepartments';
  constructor(private http: HttpClient) {}
  getAll(): Observable<any[]> { return this.http.get<any[]>(this.apiUrl); }
  update(id: number, body: { name: string }): Observable<any> { return this.http.put<any>(`${this.apiUrl}/${id}`, body); }
  remove(id: number): Observable<any> { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
}
