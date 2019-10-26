import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

export interface AlertOptions {
  title?: string;
  message?: string;
  cancel?: string;
  ok?: string;
}

@Component({
  templateUrl: 'alert.component.html'
})
export class AlertComponent {

  constructor(
    private ref: MatDialogRef<AlertComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public options: AlertOptions
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
