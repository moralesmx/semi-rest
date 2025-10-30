import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { lastValueFrom } from 'rxjs';

export interface AlertModalData {
  title?: string;
  message?: string;
  cancel?: string;
  ok?: string;
}

export type AlertModalReturn = boolean;

@Component({
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: 'alert.component.html'
})
export class AlertModalComponent {

  public static open(dialog: MatDialog, options: AlertModalData) {
    return lastValueFrom(
      dialog.open<AlertModalComponent, AlertModalData, AlertModalReturn>(AlertModalComponent, {
        data: options
      }).afterClosed()
    );
  }

  constructor(
    private ref: MatDialogRef<AlertModalComponent, AlertModalReturn>,
    @Inject(MAT_DIALOG_DATA) public data: AlertModalData
  ) {
    this.ref.disableClose = !this.cancel;
  }

  public cancel(): void {
    this.ref.close(false);
  }

  public ok(): void {
    this.ref.close(true);
  }

}
