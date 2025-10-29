import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, Subject } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../../core/api.service';
import { AuthService } from '../../../../core/auth.service';
import { Bill, PaymentOption, Table } from '../../../../core/models';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CursorEndDirective } from './cursor-end.directive';
import { NgxCurrencyDirective } from 'ngx-currency';
import { BlockUIModule } from 'primeng/blockui';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    CursorEndDirective,
    NgxCurrencyDirective,
    BlockUIModule
  ],
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

  public form = new FormGroup({
    tips: new FormControl(0, [Validators.min(0)]),
    total: new FormControl(0),
    payments: new FormGroup<{ [method: string]: FormControl<number>; }>({}),
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
  }]);

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private ref: MatDialogRef<PayComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { table: Table, bill: Bill; }
  ) {
    combineLatest(
      this.form.controls.total.valueChanges,
      this.form.controls.payment.valueChanges
    ).pipe(
      map(([total, payment]) => payment - total),
      map(change => change > 0 ? change : 0),
      takeUntil(this.destroyed)
    ).subscribe(change => {
      this.form.controls.change.setValue(change);
    });

    this.form.controls.tips.valueChanges.pipe(
      startWith(this.form.value.tips),
      map(value => value + this.data.bill.total - this.data.bill.descuentos),
      takeUntil(this.destroyed)
    ).subscribe(total => {
      this.form.controls.total.setValue(total);
    });

    this.form.controls.payments.valueChanges.pipe(
      takeUntil(this.destroyed)
    ).subscribe(payments => {
      let payment: number = 0;
      let nonCash: number = 0;
      for (const option of this.paymentOptions) {
        if (!option.efectivo) {
          nonCash += payments[`${option.idpvFormaPago}`];
        }
        payment += payments[`${option.idpvFormaPago}`];
      }
      this.form.controls.payment.setValue(payment);
      this.form.controls.nonCash.setValue(nonCash);
    });

    this.loading = true;
    this.api.getPaymentOptions().pipe(
      takeUntil(this.destroyed)
    ).subscribe({
      next: options => {
        this.paymentOptions = options;
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
          (this.form.controls.payments as FormGroup).addControl(`${option.idpvFormaPago}`, control);
        }
        this.loading = false;
      },
      error: error => {
        console.error(error);
        this.loading = false;
      }
    });
  }

  public ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  public complete(control: FormControl): void {
    if (control.value) {
      control.setValue(0);
    } else {
      const missing: number = this.form.value.total - this.form.value.payment;
      control.setValue(missing > 0 ? missing : 0);
    }
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
      propina: this.form.value.tips,
      cambio: this.form.value.change,
      formadepago: this.form.value.payments,
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
