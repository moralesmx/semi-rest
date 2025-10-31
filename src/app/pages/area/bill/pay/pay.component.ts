import { CurrencyPipe, JsonPipe } from '@angular/common';
import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgxCurrencyDirective } from 'ngx-currency';
import { combineLatest, firstValueFrom, Subject } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../../core/api.service';
import { AuthService } from '../../../../core/auth.service';
import { Bill, PaymentOption, Table } from '../../../../core/models';
import { CursorEndDirective } from './cursor-end.directive';

interface PayModalData {
  table: Table;
  bill: Bill;
}
type PayModalReturn = boolean;

@Component({
  standalone: true,
  imports: [
    JsonPipe,
    CurrencyPipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressBarModule,
    CursorEndDirective,
    NgxCurrencyDirective
  ],
  templateUrl: 'pay.component.html'
})
export class PayModalComponent implements OnDestroy {

  public static open(dialog: MatDialog, table: Table, bill: Bill) {
    return firstValueFrom(dialog.open<PayModalComponent, PayModalData, PayModalReturn>(PayModalComponent, {
      data: { table, bill }
    }).afterClosed());
  }

  private readonly destroyed = new Subject<void>();

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
    private ref: MatDialogRef<PayModalComponent, PayModalReturn>,
    @Inject(MAT_DIALOG_DATA) public data: PayModalData
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

    this.form.disable();
    this.ref.disableClose = this.form.disabled;
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
        this.form.enable();
        this.ref.disableClose = this.form.disabled;

        // Re-disable hotel controls if needed
        for (const option of this.paymentOptions) {
          if (option.hotel && !this.data.bill.idHotel) {
            const control = (this.form.controls.payments as FormGroup).controls[`${option.idpvFormaPago}`];
            control.disable();
          }
        }
      },
      error: error => {
        console.error(error);
        this.form.enable();
        this.ref.disableClose = this.form.disabled;
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
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const value = this.form.value;

    this.form.disable();
    this.ref.disableClose = this.form.disabled;
    this.api.payBill(this.data.bill, {
      idHotel: this.data.bill.idHotel,
      subtotal: this.data.bill.total,
      descuentos: this.data.bill.descuentos,
      propina: value.tips,
      cambio: value.change,
      formadepago: value.payments,
      idpvUsuarios: this.auth.user.idpvUsuarios,
    }).subscribe({
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

  public cancel(): void {
    this.ref.close(false);
  }
}
