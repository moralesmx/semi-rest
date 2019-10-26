import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Observable } from 'rxjs';
import { AlertComponent, AlertOptions } from './alert/alert.component';

@Injectable({ providedIn: 'root' })
export class ModalsService {

  constructor(
    private dialog: MatDialog
  ) { }

  public alert(options: AlertOptions): Observable<boolean> {
    return this.dialog.open(AlertComponent, { data: options }).afterClosed();
  }

}
