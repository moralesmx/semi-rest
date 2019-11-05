import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../../core/api.service';
import { AuthService } from '../../../../core/auth.service';
import { Bill, Table } from '../../../../core/models';

export interface DiscountModalData {
  table: Table;
  bill: Bill;
}
export type DiscountModalReturn = boolean;

@Component({
  templateUrl: 'discount.component.html'
})
export class DiscountModalComponent implements OnDestroy {

  private readonly destroyed: Subject<void> = new Subject();

  private _loading: boolean;
  public get loading(): boolean {
    return this._loading;
  }
  public set loading(loading: boolean) {
    this._loading = loading;
    this.ref.disableClose = loading;
  }

  public form: FormGroupTyped<{
    type: number;
    percentage: number;
    amount: number;
  }> = new FormGroup({
    type: new FormControl(undefined, [Validators.required]),
    percentage: new FormControl(undefined, [Validators.min(0), Validators.max(100)]),
    amount: new FormControl(undefined, [Validators.min(0)]),
  }) as any;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private ref: MatDialogRef<DiscountModalComponent, DiscountModalReturn>,
    @Inject(MAT_DIALOG_DATA) public data: DiscountModalData
  ) {
    this.form.controls.type.valueChanges.pipe(
      takeUntil(this.destroyed)
    ).subscribe({
      next: value => {
        if (value === 1) {
          this.form.controls.percentage.enable();
          this.form.controls.amount.disable();
        } else {
          this.form.controls.percentage.disable();
          this.form.controls.amount.enable();
        }
      }
    });

    this.form.controls.percentage.valueChanges.pipe(
      takeUntil(this.destroyed)
    ).subscribe(value => {
      this.form.controls.amount.setValue(
        this.data.bill.total * value / 100,
        { emitEvent: false }
      );
    });

    this.form.controls.amount.valueChanges.pipe(
      takeUntil(this.destroyed)
    ).subscribe(value => {
      this.form.controls.percentage.setValue(
        value / this.data.bill.total * 100,
        { emitEvent: false }
      );
    });

    this.form.patchValue({
      percentage: this.data.bill.descuento || 0,
      amount: this.data.bill.descuento || 0,
    }, { emitEvent: false });
    this.form.controls.type.setValue(this.data.bill.descuentoTipo || 1);
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
    this.loading = true;
    this.api.discount(this.data.bill.idpvVentas, {
      descuentoTipo: this.form.value.type,
      descuento: this.form.value.percentage,
      descuentos: this.form.value.amount,
      idpvUsuarios: this.auth.user.idpvUsuarios,
    }).subscribe({
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
