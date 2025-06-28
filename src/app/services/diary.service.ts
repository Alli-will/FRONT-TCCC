import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DiaryService {
  private apiUrl = 'http://localhost:3000/diary';
  private apiAllUrl = 'http://localhost:3000/diary/all';

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
    return this.http.get('http://localhost:3000/diary/has-entry-today', { headers });
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
    // O endpoint correto é /dashboard/ess
    return this.http.get('http://localhost:3000/dashboard/ess', { headers });
  }

  private getAuthHeaders(token: string): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
