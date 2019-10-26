import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { User } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private user$$: BehaviorSubject<User> = new BehaviorSubject(undefined);
  public user$: Observable<User> = new BehaviorSubject(undefined);
  public get user(): User {
    return this.user$$.value;
  }

  constructor(
    private api: ApiService,
    private http: HttpClient,
  ) { }

  public auth(pass: string): Observable<User> {
    return this.http.post<User>(`${this.api.url}/login`, { password: pass }).pipe(
      tap(user => this.user$$.next(user))
    );
  }

  public clear(): void {
    this.user$$.next(undefined);
  }

}
