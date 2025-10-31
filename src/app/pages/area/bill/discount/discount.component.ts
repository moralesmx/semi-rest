import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { NgxCurrencyDirective } from 'ngx-currency';
import { firstValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../../core/api.service';
import { AuthService } from '../../../../core/auth.service';
import { Bill, Table } from '../../../../core/models';
import { CursorEndDirective } from '../pay/cursor-end.directive';

interface DiscountModalData {
  table: Table;
  bill: Bill;
}
type DiscountModalReturn = boolean;

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatRadioModule,
    NgxCurrencyDirective,
    CursorEndDirective
  ],
  templateUrl: 'discount.component.html'
})
export class DiscountModalComponent implements OnDestroy {

  public static open(dialog: MatDialog, table: Table, bill: Bill) {
    return firstValueFrom(dialog.open<DiscountModalComponent, DiscountModalData, DiscountModalReturn>(DiscountModalComponent, {
      data: { table, bill }
    }).afterClosed());
  }

  private readonly destroyed = new Subject<void>();

  public form = new FormGroup({
    type: new FormControl<number>(undefined, [Validators.required]),
    percentage: new FormControl<number>(undefined, [Validators.min(0), Validators.max(100)]),
    amount: new FormControl<number>(undefined, [Validators.min(0), Validators.max(this.data.bill.total)]),
  });

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
    this.form.controls.percentage.enable();
    this.form.controls.amount.enable();

    const value = this.form.value;

    this.form.disable();
    this.ref.disableClose = this.form.disabled;

    this.api.discount(this.data.bill.idpvVentas, {
      descuentoTipo: value.type,
      descuento: value.percentage,
      descuentos: value.amount,
      idpvUsuarios: this.auth.user.idpvUsuarios,
    }).subscribe({
      next: () => {
        this.ref.close(true);
      },
      error: error => {
        console.error(error);
        this.form.enable();
        this.ref.disableClose = this.form.disabled;
        this.form.controls.type.setValue(this.form.value.type);
      }
    });
  }
}
