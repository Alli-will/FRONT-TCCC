import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoadingIndicatorComponent } from './loading-indicator.component';
import { CommonModule } from '@angular/common';
import { LoadingService } from './services/loading.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule, LoadingIndicatorComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'app-teste';
  isLoading$ = combineLatest([
    // router nav active stream
    new BehaviorSubject<boolean>(false),
    this.loading.loading$
  ]).pipe(
    map(([nav, blocks]) => nav || blocks),
    distinctUntilChanged(),
    shareReplay(1)
  );
  private navActive$ = new BehaviorSubject<boolean>(false);

  constructor(private router: Router, private loading: LoadingService) {
    // Rebuild isLoading$ with the actual navActive$ instance
    this.isLoading$ = combineLatest([
      this.navActive$,
      this.loading.loading$
    ]).pipe(
      map(([nav, blocks]) => nav || blocks),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
  Promise.resolve().then(() => this.navActive$.next(true));
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
  Promise.resolve().then(() => this.navActive$.next(false));
      }
    });
  }
}
