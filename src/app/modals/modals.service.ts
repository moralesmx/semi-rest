import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { AlertComponent, AlertOptions } from './alert/alert.component';

@Injectable({ providedIn: 'root' })
export class ModalsService {

  constructor(
    private dialog: MatDialog
  ) { }

  public alert(options: AlertOptions): Promise<boolean> {
    return this.dialog.open(AlertComponent, { data: options }).afterClosed().toPromise();
  }

}
