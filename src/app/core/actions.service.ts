import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Table } from './models';
import { OrderComponent } from '../pages/area/bill/order/order.component';

@Injectable({ providedIn: 'root' })
export class ActionsService {

  constructor(
    private dialog: MatDialog
  ) { }

  public order(tableId: Table['idpvAreasMesas']): Promise<boolean> {
    return this.dialog.open(OrderComponent, {
      data: { tableId },
      minWidth: '100%',
      minHeight: '100%'
    }).afterClosed().toPromise();
  }

}
