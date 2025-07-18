import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { DiaryService } from './diary.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class DiaryEntryGuard implements CanActivate {
  constructor(private diaryService: DiaryService, private router: Router) {}

  canActivate(): Observable<boolean> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      this.router.navigate(['/login']);
      return of(false);
    }
    return this.diaryService.hasEntryToday(token).pipe(
      map((res: any) => {
        if (res.hasEntry) {
          return true;
        } else {
          this.router.navigate(['/diario']);
          return false;
        }
      }),
      catchError(() => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
