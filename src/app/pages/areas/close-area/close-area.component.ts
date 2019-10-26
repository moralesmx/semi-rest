import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { FormGroupCustom } from '../../../core/custom-forms/form-group';
import { Area, PaymentOption } from '../../../core/models';
import { FormControl, Validators } from '@angular/forms';

@Component({
  templateUrl: 'close-area.component.html'
})

export class CloseAreaComponent implements OnDestroy {

  private readonly destroyed: Subject<void> = new Subject();

  public error: string;

  public paymentOptions: PaymentOption[];

  public payments: FormGroupCustom = new FormGroupCustom({});
  public form: FormGroupCustom = new FormGroupCustom({
    payments: this.payments
  });

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private ref: MatDialogRef<CloseAreaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { area: Area }
  ) {
    this.api.getPaymentOptions().pipe(
      takeUntil(this.destroyed)
    ).subscribe(
      options => {
        this.paymentOptions = options;

        this.form.enable();
        for (const option of this.paymentOptions) {
          const control: FormControl = new FormControl(0, Validators.min(0));
          this.payments.addControl(option.idpvFormaPago.toString(), control);
        }
      }
    );
  }

  public ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  public cancel(): void {
    this.ref.close();
  }

  public submit(): void {
    if (this.form.valid) {
      this.form.disableAndStoreState();
      this.ref.disableClose = true;
      this.error = undefined;
      this.api.closeArea(this.data.area, this.auth.user, this.payments.value).pipe(
        takeUntil(this.destroyed)
      ).subscribe(
        () => {
          this.ref.close();
        },
        (error: HttpErrorResponse) => {
          this.form.enableAndRestoreState();
          this.ref.disableClose = false;
          this.error = error.error;
        }
      );
    } else {
      this.form.markAllAsTouched();
    }
  }

}
