import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../../core/api.service';
import { Area, Section, Table } from '../../../../core/models';

export type ChangeTableModalReturn = boolean;

@Component({
  templateUrl: 'change-table.component.html'
})
export class ChangeTableModalComponent {

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

  public form: FormGroupTyped<{
    section: Section,
    table: Table
  }> = new FormGroup({
    section: new FormControl(undefined, [Validators.required]),
    table: new FormControl(undefined, [Validators.required])
  }) as any;

  constructor(
    private api: ApiService,
    private ref: MatDialogRef<ChangeTableModalComponent, ChangeTableModalReturn>,
    @Inject(MAT_DIALOG_DATA) public data: { table: Table }
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
