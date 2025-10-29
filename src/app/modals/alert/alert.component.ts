import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

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
