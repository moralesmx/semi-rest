import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../../core/api.service';
import { Area, Section, Table } from '../../../../core/models';

@Component({
  templateUrl: 'change-table.component.html'
})
export class ChangeTableComponent {

  private destroyed: Subject<void> = new Subject<void>();

  public loading: boolean;

  public area: Area;

  public form: FormGroupTyped<{
    section: Section,
    table: Table
  }> = new FormGroup({
    section: new FormControl(undefined, [Validators.required]),
    table: new FormControl(undefined, [Validators.required])
  }) as FormGroupTyped<any>;

  constructor(
    private api: ApiService,
    private ref: MatDialogRef<ChangeTableComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { table: Table }
  ) {
    this.loading = true;
    this.api.getArea(this.data.table.idpvAreas).pipe(
      takeUntil(this.destroyed)
    ).subscribe(area => {
      this.area = area;
      this.loading = false;
    });

    this.form.controls.section.valueChanges.pipe(
      takeUntil(this.destroyed)
    ).subscribe({
      next: value => {
        this.form.controls.table.setValue(undefined);
      }
    });
  }

  public submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
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

  public cancel(): void {
    this.ref.close();
  }

}
