import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DiaryService {
  private apiUrl = 'https://tcc-main.up.railway.app/diary';
  private apiAllUrl = 'https://tcc-main.up.railway.app/diary/all';

  constructor(private http: HttpClient) {}

  createDiaryEntry(entry: any, token: string): Observable<any> {
    const headers = this.getAuthHeaders(token);
    return this.http.post(`${this.apiUrl}/create`, entry, { headers });
  }

  getDiaryEntries(token: string): Observable<any> {
    const headers = this.getAuthHeaders(token);
    return this.http.get(this.apiUrl, { headers });
  }

  getAllDiaryEntries(): Observable<any> {
    return this.http.get(this.apiAllUrl);
  }

  hasEntryToday(token: string): Observable<any> {
    const headers = this.getAuthHeaders(token);
    return this.http.get('https://tcc-main.up.railway.app/diary/has-entry-today', { headers });
  }

  getDiaryInsights(token: string) {
    const headers = this.getAuthHeaders(token);
    return this.http.get(`${this.apiUrl}/insights`, { headers });
  }

  getDiaryGraphData(token: string, period: string) {
    const headers = this.getAuthHeaders(token);
    return this.http.get(`${this.apiUrl}/graph-data?period=${period}`, { headers });
  }

  getUserEss(token: string): Observable<any> {
    const headers = this.getAuthHeaders(token);
    return this.http.get('https://tcc-main.up.railway.app/dashboard/ess', { headers });
  }

  private getAuthHeaders(token: string): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
