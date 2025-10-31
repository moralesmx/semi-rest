import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgxCurrencyDirective } from 'ngx-currency';
import { firstValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { Area, PaymentOption } from '../../../core/models';
import { CursorEndDirective } from '../../area/bill/pay/cursor-end.directive';

interface CloseAreaModalData {
  area: Area;
}
type CloseAreaModalReturn = void;

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressBarModule,
    NgxCurrencyDirective,
    CursorEndDirective
  ],
  templateUrl: 'close-area.component.html'
})

export class CloseAreaModalComponent implements OnDestroy {

  public static open(dialog: MatDialog, area: Area) {
    return firstValueFrom(dialog.open<CloseAreaModalComponent, CloseAreaModalData, CloseAreaModalReturn>(CloseAreaModalComponent, {
      data: { area }
    }).afterClosed());
  }

  private readonly destroyed = new Subject<void>();

  public error: string;

  public paymentOptions: PaymentOption[];

  public form = new FormGroup<{ [key: string]: FormControl<number>; }>({});

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private ref: MatDialogRef<CloseAreaModalComponent, CloseAreaModalReturn>,
    @Inject(MAT_DIALOG_DATA) public data: CloseAreaModalData
  ) {
    this.form.disable();
    this.ref.disableClose = this.form.disabled;
    this.api.getPaymentOptions().pipe(
      takeUntil(this.destroyed)
    ).subscribe({
      next: options => {
        this.paymentOptions = options;
        for (const option of this.paymentOptions) {
          const control: FormControl = new FormControl(0, [Validators.required, Validators.min(0)]);
          this.form.addControl(`${option.idpvFormaPago}`, control);
        }
        this.form.enable();
        this.ref.disableClose = this.form.disabled;
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

  public cancel(): void {
    this.ref.close();
  }

  public submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const value = this.form.value;
    this.form.disable();
    this.ref.disableClose = this.form.disabled;
    this.error = undefined;
    this.api.closeArea(this.data.area, this.auth.user, value).pipe(
      takeUntil(this.destroyed)
    ).subscribe({
      next: () => {
        this.ref.close();
      },
      error: (error: HttpErrorResponse) => {
        this.error = error.error;
        this.form.enable();
        this.ref.disableClose = this.form.disabled;
      }
    });
  }

}
