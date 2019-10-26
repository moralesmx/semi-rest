import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { User } from '../../core/models';
import { LoginComponent, LoginOptions } from './login.component';

@Injectable({ providedIn: 'root' })
export class LoginService {

  constructor(
    private dialog: MatDialog
  ) { }

  public login(options: LoginOptions = {}): Promise<User> {
    return this.dialog.open(LoginComponent, {
      data: options,
      closeOnNavigation: false
    }).afterClosed().toPromise();
  }
}
