import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

export interface SelectModalData {
  title?: string;
  message?: string;
  cancel?: string;
  options: { [key: string]: string };
}

export type SelectModalReturn = string;

@Component({
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: 'select.component.html'
})
export class SelectModalComponent {

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
