import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AlertModalComponent, AlertModalData, AlertModalReturn } from './alert/alert.component';
import { LoginModalData, LoginModalComponent, LoginModalReturn } from './login/login.component';
import { User } from '../core/models';
import { SelectModalData, SelectModalComponent, SelectModalReturn } from './select/select.component';

@Injectable({ providedIn: 'root' })
export class ModalsService {

  constructor(
    private dialog: MatDialog
  ) { }

  public alert(options: AlertModalData): Promise<boolean> {
    return this.dialog.open<AlertModalComponent, AlertModalData, AlertModalReturn>(AlertModalComponent, {
      data: options
    }).afterClosed().toPromise();
  }

  public select(options: SelectModalData): Promise<string> {
    return this.dialog.open<SelectModalComponent, SelectModalData, SelectModalReturn>(SelectModalComponent, {
      data: options
    }).afterClosed().toPromise();
  }

  public login(options: LoginModalData = {}): Promise<User> {
    return this.dialog.open<LoginModalComponent, LoginModalData, LoginModalReturn>(LoginModalComponent, {
      data: options,
      closeOnNavigation: false
    }).afterClosed().toPromise();
  }

}
