import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HasNotPipe } from 'src/app/pipes/has.pipe';
import { ApiService } from '../../../../core/api.service';
import { Area, Section, Table } from '../../../../core/models';

interface ChangeTableModalData {
  table: Table;
}
export type ChangeTableModalReturn = boolean;

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    HasNotPipe
  ],
  templateUrl: 'change-table.component.html'
})
export class ChangeTableModalComponent {

  public static open(dialog: MatDialog, table: Table) {
    return firstValueFrom(dialog.open<ChangeTableModalComponent, ChangeTableModalData, ChangeTableModalReturn>(ChangeTableModalComponent, {
      data: { table }
    }).afterClosed());
  }

  private destroyed: Subject<void> = new Subject<void>();

  private _loading: boolean;
  public get loading(): boolean {
    return this._loading;
  }
  public set loading(loading: boolean) {
    this._loading = loading;
    this.ref.disableClose = loading;
  }

  public area: Area;

  public form = new FormGroup({
    section: new FormControl<Section>(undefined, [Validators.required]),
    table: new FormControl<Table>(undefined, [Validators.required])
  });

  constructor(
    private api: ApiService,
    private ref: MatDialogRef<ChangeTableModalComponent, ChangeTableModalReturn>,
    @Inject(MAT_DIALOG_DATA) public data: ChangeTableModalData
  ) {
    this.loading = true;
    this.api.getArea(this.data.table.idpvAreas).pipe(
      takeUntil(this.destroyed)
    ).subscribe({
      next: area => {
        this.area = area;
        this.loading = false;
      },
      error: error => {
        console.error(error);
        this.loading = false;
      }
    });

    this.form.controls.section.valueChanges.pipe(
      takeUntil(this.destroyed)
    ).subscribe({
      next: value => {
        this.form.controls.table.setValue(undefined);
      }
    });
  }

  public cancel(): void {
    this.ref.close(false);
  }

  public submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    this.api.changeTable(this.data.table.idpvVentas, this.data.table.idpvAreasMesas, this.form.value.table.idpvAreasMesas).subscribe({
      next: () => {
        this.ref.close(true);
        this.loading = false;
      },
      error: error => {
        console.error(error);
        this.loading = false;
      }
    });
  }


}
