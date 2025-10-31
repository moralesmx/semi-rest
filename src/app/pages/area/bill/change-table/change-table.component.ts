import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HasNotPipe } from 'src/app/pipes/has.pipe';
import { ApiService } from '../../../../core/api.service';
import { Area, Section, Table } from '../../../../core/models';

interface ChangeTableModalData {
  table: Table;
}
type ChangeTableModalReturn = boolean;

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
    HasNotPipe
  ],
  templateUrl: 'change-table.component.html'
})
export class ChangeTableModalComponent implements OnDestroy {

  public static open(dialog: MatDialog, table: Table) {
    return firstValueFrom(dialog.open<ChangeTableModalComponent, ChangeTableModalData, ChangeTableModalReturn>(ChangeTableModalComponent, {
      data: { table }
    }).afterClosed());
  }

  private readonly destroyed = new Subject<void>();

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
    this.form.disable();
    this.ref.disableClose = this.form.disabled;

    this.api.getArea(this.data.table.idpvAreas).pipe(
      takeUntil(this.destroyed)
    ).subscribe({
      next: area => {
        this.area = area;
        this.form.enable();
        this.ref.disableClose = this.form.disabled;
      },
      error: error => {
        console.error(error);
        this.form.enable();
        this.ref.disableClose = this.form.disabled;
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

  public ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  public cancel(): void {
    this.ref.close(false);
  }

  public submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const value = this.form.value;

    this.form.disable();
    this.ref.disableClose = this.form.disabled;

    this.api.changeTable(this.data.table.idpvVentas, this.data.table.idpvAreasMesas, value.table.idpvAreasMesas).subscribe({
      next: () => {
        this.ref.close(true);
      },
      error: error => {
        console.error(error);
        this.form.enable();
        this.ref.disableClose = this.form.disabled;
      }
    });
  }


}
