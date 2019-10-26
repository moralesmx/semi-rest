import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../../core/api.service';
import { AuthService } from '../../../../core/auth.service';
import { FormGroupCustom } from '../../../../core/custom-forms/form-group';
import { Bill, Table } from '../../../../core/models';

@Component({
  templateUrl: 'discount.component.html'
})
export class DiscountComponent implements OnDestroy {

  private readonly destroyed: Subject<void> = new Subject();

  public type: FormControl = new FormControl(undefined, [Validators.required]);
  public percentage: FormControl = new FormControl(undefined, [Validators.min(0), Validators.max(100)]);
  public amount: FormControl = new FormControl(undefined, [Validators.min(0)]);
  public form: FormGroupCustom = new FormGroupCustom({
    type: this.type,
    percentage: this.percentage,
    amount: this.amount,
  });

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private ref: MatDialogRef<DiscountComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { table: Table, bill: Bill }
  ) {
    this.type.valueChanges.pipe(
      takeUntil(this.destroyed)
    ).subscribe(value => {
      if (value === 1) {
        this.percentage.enable();
        this.amount.disable();
      } else {
        this.percentage.disable();
        this.amount.enable();
      }
    });

    this.percentage.valueChanges.pipe(
      takeUntil(this.destroyed)
    ).subscribe(value => {
      this.amount.setValue(this.data.bill.total * value / 100, {
        emitEvent: false
      });
    });

    this.amount.valueChanges.pipe(
      takeUntil(this.destroyed)
    ).subscribe(value => {
      this.percentage.setValue(value / this.data.bill.total * 100, {
        emitEvent: false
      });
    });

    this.type.setValue(this.data.bill.descuentoTipo || 1);
    if (this.type.value === 1) {
      this.percentage.setValue(this.data.bill.descuento || 0);
    } else {
      this.amount.setValue(this.data.bill.descuento || 0);
    }
  }

  public ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  public submit(): void {
    if (this.form.valid) {
      this.form.disableAndStoreState();
      this.ref.disableClose = true;
      this.api.discount(this.data.bill, {
        descuentoTipo: this.type.value,
        descuento: this.type.value === 1 ? this.percentage.value : this.amount.value,
        idpvUsuarios: this.auth.user.idpvUsuarios,
      }).subscribe(
        () => {
          this.ref.close(true);
        },
        error => {
          console.error(error);
          this.form.enableAndRestoreState();
          this.ref.disableClose = false;
        }
      );
    } else {
      this.form.markAllAsTouched();
    }
  }

  public cancel(): void {
    this.ref.close(false);
  }
}
