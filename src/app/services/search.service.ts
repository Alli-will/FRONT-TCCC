import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private apiUrl = 'http://https://tcc-main.up.railway.app/searches';

  constructor(private http: HttpClient) {}

  createSearch(data: { titulo: string; tipo: string; perguntas?: any[] }): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  getAllSearches(page = 1, limit = 20, all = false): Observable<any> {
    const url = this.apiUrl + `?page=${page}&limit=${limit}` + (all ? '&all=1' : '');
    return this.http.get(url);
  }

  getSearchById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  respondSearch(payload: { searchId: number; answers: any[] }): Observable<any> {
    return this.http.post(`${this.apiUrl}/respond`, payload);
  }

  getDefaultQuestions(tipo?: 'pulso' | 'clima'): Observable<any> {
    const q = tipo ? `?tipo=${tipo}` : '';
    return this.http.get(`${this.apiUrl}/defaults/questions${q}`);
  }

  getReport(id: number, departmentId?: number): Observable<any> {
    const q = departmentId ? `?departmentId=${departmentId}` : '';
    return this.http.get(`${this.apiUrl}/${id}/report${q}`);
  }
}
