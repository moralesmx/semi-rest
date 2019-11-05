import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { merge, Subject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../../core/api.service';
import { Bill, PaymentOption, Table } from '../../../../core/models';
import { AuthService } from '../../../../core/auth.service';

@Component({
  templateUrl: 'pay.component.html'
})
export class PayComponent implements OnDestroy {

  private readonly destroyed: Subject<void> = new Subject();

  private _loading: boolean;
  public get loading(): boolean {
    return this._loading;
  }
  public set loading(loading: boolean) {
    this._loading = loading;
    this.ref.disableClose = loading;
  }

  public paymentOptions: PaymentOption[];

  public form: FormGroupTyped<{
    tips: number;
    total: number;
    payments: { [method: string]: number }
    payment: number;
    nonCash: number;
    change: number;
  }> = new FormGroup({
    tips: new FormControl(0, [Validators.min(0)]),
    total: new FormControl(0),
    payments: new FormGroup({}),
    payment: new FormControl(0),
    nonCash: new FormControl(0),
    change: new FormControl(0),
  }, [(form: FormGroup) => {
    if (form.value.payment < form.value.total) {
      return { insufficient: 'No es suficiente' };
    }
    if (form.value.nonCash > form.value.total) {
      return { change: 'No se puede dar cambio' };
    }
    return null;
  }]) as any;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private ref: MatDialogRef<PayComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { table: Table, bill: Bill }
  ) {
    this.loading = true;
    this.api.getPaymentOptions().pipe(
      takeUntil(this.destroyed)
    ).subscribe({
      next: options => {
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
          (this.form.controls.payments as FormGroup).addControl(option.idpvFormaPago.toString(), control);
        }

        merge(
          this.form.controls.total.valueChanges,
          this.form.controls.payment.valueChanges
        ).pipe(
          startWith(this.destroyed)
        ).subscribe(() => {
          const change: number = this.form.controls.payment.value - this.form.controls.total.value;
          this.form.controls.change.setValue(change > 0 ? change : 0);
        });

        this.form.controls.tips.valueChanges.pipe(
          startWith(this.form.controls.tips.value),
          takeUntil(this.destroyed)
        ).subscribe(value => {
          this.form.controls.total.setValue(this.data.bill.total - this.data.bill.descuentos + value);
        });

        this.form.controls.payments.valueChanges.pipe(
          startWith(undefined),
          takeUntil(this.destroyed)
        ).subscribe(() => {
          let payment: number = 0;
          let nonCash: number = 0;
          for (const option of this.paymentOptions) {
            if (!option.efectivo) {
              nonCash += this.form.controls.payments.value[option.idpvFormaPago.toString()];
            }
            payment += this.form.controls.payments.value[option.idpvFormaPago.toString()];
          }
          this.form.controls.payment.setValue(payment);
          this.form.controls.nonCash.setValue(nonCash);
        });


      }
    });
  }

  public ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  public complete(control: FormControl): void {
    const missing: number = this.form.controls.total.value - this.form.controls.payment.value;
    control.setValue(missing > 0 ? missing : 0);
  }

  public submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.api.payBill(this.data.bill, {
      idHotel: this.data.bill.idHotel,
      subtotal: this.data.bill.total,
      descuentos: this.data.bill.descuentos,
      propina: this.form.controls.tips.value,
      cambio: this.form.controls.change.value,
      formadepago: this.form.controls.payments.value,
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

  public cancel(): void {
    this.ref.close(false);
  }
}
