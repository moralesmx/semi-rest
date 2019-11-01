import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { merge, Subject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../../core/api.service';
import { FormGroupCustom } from '../../../../core/custom-forms/form-group';
import { Bill, PaymentOption, Table } from '../../../../core/models';
import { AuthService } from '../../../../core/auth.service';

@Component({
  templateUrl: 'pay.component.html'
})
export class PayComponent implements OnDestroy {

  private readonly destroyed: Subject<void> = new Subject();

  public paymentOptions: PaymentOption[];

  public tips: FormControl = new FormControl(0, [Validators.min(0)]);
  public total: FormControl = new FormControl(0);
  public payments: FormGroupCustom = new FormGroupCustom({});
  public payment: FormControl = new FormControl(0);
  public nonCash: FormControl = new FormControl(0);
  public change: FormControl = new FormControl(0);

  public form: FormGroupCustom = new FormGroupCustom({
    tips: this.tips,
    total: this.total,
    payments: this.payments,
    payment: this.payment,
    nonCash: this.nonCash,
    change: this.change
  });

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private ref: MatDialogRef<PayComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { table: Table, bill: Bill }
  ) {
    this.form.disable();

    this.form.setValidators([(form: FormGroup) => {
      const total: number = form.controls.total.value;
      const payment: number = form.controls.payment.value;
      const nonCash: number = form.controls.nonCash.value;
      if (payment < total) {
        return { insufficient: 'No es suficiente' };
      }
      if (nonCash > total) {
        return { change: 'No se puede dar cambio' };
      }
      return null;
    }]);

    this.api.getPaymentOptions().pipe(
      takeUntil(this.destroyed)
    ).subscribe(
      options => {
        this.paymentOptions = options;

        this.form.enable();
        for (const option of this.paymentOptions) {
          const control: FormControl = new FormControl(0, Validators.min(0));
          if (option.hotel && !this.data.bill.idHotel) {
            control.disable();
          }
          if (option.hotel) {
            if (this.data.bill.credito > this.data.bill.total) {
              control.setValue(this.data.bill.total);
            } else {
              control.setValue(this.data.bill.credito);
            }
          }
          this.payments.addControl(option.idpvFormaPago.toString(), control);
        }

        merge(
          this.total.valueChanges,
          this.payment.valueChanges
        ).pipe(
          startWith(this.destroyed)
        ).subscribe(() => {
          const change: number = this.payment.value - this.total.value;
          this.change.setValue(change > 0 ? change : 0);
        });

        this.tips.valueChanges.pipe(
          startWith(this.tips.value),
          takeUntil(this.destroyed)
        ).subscribe(value => {
          this.total.setValue(this.data.bill.total - this.data.bill.descuentos + value);
        });

        this.payments.valueChanges.pipe(
          startWith(undefined),
          takeUntil(this.destroyed)
        ).subscribe(() => {
          let payment: number = 0;
          let nonCash: number = 0;
          for (const option of this.paymentOptions) {
            if (!option.efectivo) {
              nonCash += this.payments.controls[option.idpvFormaPago.toString()].value;
            }
            payment += this.payments.controls[option.idpvFormaPago.toString()].value;
          }
          this.payment.setValue(payment);
          this.nonCash.setValue(nonCash);
        });


      }
    );
  }

  public ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  public complete(control: FormControl): void {
    const missing: number = this.total.value - this.payment.value;
    control.setValue(missing > 0 ? missing : 0);
  }

  public submit(): void {
    if (this.form.valid) {
      this.form.disableAndStoreState();
      this.ref.disableClose = true;
      this.api.payBill(this.data.bill, {
        idHotel: this.data.bill.idHotel,
        subtotal: this.data.bill.total,
        descuentos: this.data.bill.descuentos,
        propina: this.tips.value,
        cambio: this.change.value,
        formadepago: this.payments.value,
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
