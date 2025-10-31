import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

interface AlertModalData {
  title?: string;
  message?: string;
  cancel?: string;
  ok?: string;
}

type AlertModalReturn = boolean;

@Component({
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
  ],
  templateUrl: 'alert.component.html'
})
export class AlertModalComponent {

  public static open(dialog: MatDialog, options: AlertModalData) {
    return firstValueFrom(
      dialog.open<AlertModalComponent, AlertModalData, AlertModalReturn>(AlertModalComponent, {
        data: options
      }).afterClosed()
    );
  }

  constructor(
    private ref: MatDialogRef<AlertModalComponent, AlertModalReturn>,
    @Inject(MAT_DIALOG_DATA) public data: AlertModalData
  ) {
    this.ref.disableClose = !this.data.cancel;
  }

  public cancel(): void {
    this.ref.close(false);
  }

  public ok(): void {
    this.ref.close(true);
  }

}
