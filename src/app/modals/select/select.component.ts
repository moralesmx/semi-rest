import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { lastValueFrom } from 'rxjs';

export interface SelectModalData {
  title?: string;
  message?: string;
  cancel?: string;
  options: { [key: string]: string; };
}

export type SelectModalReturn = string;

@Component({
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: 'select.component.html'
})
export class SelectModalComponent {

  public static open(dialog: MatDialog, options: SelectModalData) {
    return lastValueFrom(
      dialog.open<SelectModalComponent, SelectModalData, SelectModalReturn>(SelectModalComponent, {
        data: options
      }).afterClosed()
    );
  }

  constructor(
    private ref: MatDialogRef<SelectModalComponent, SelectModalReturn>,
    @Inject(MAT_DIALOG_DATA) public data: SelectModalData
  ) {
    this.ref.disableClose = !this.cancel;
  }

  public cancel(): void {
    this.ref.close();
  }

  public submit(option: string): void {
    this.ref.close(option);
  }

}
