import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgxCurrencyDirective } from 'ngx-currency';
import { BlockUIModule } from 'primeng/blockui';
import { firstValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { Area, PaymentOption } from '../../../core/models';

interface CloseAreaModalData {
  area: Area;
}
type CloseAreaModalReturn = void;

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    NgxCurrencyDirective,
    BlockUIModule
  ],
  templateUrl: 'close-area.component.html'
})

export class CloseAreaModalComponent implements OnDestroy {

  public static open(dialog: MatDialog, area: Area) {
    return firstValueFrom(dialog.open<CloseAreaModalComponent, CloseAreaModalData, CloseAreaModalReturn>(CloseAreaModalComponent, {
      data: { area }
    }).afterClosed());
  }

  private readonly destroyed: Subject<void> = new Subject();

  private _loading: boolean;
  public get loading(): boolean {
    return this._loading;
  }
  public set loading(loading: boolean) {
    this._loading = loading;
    this.ref.disableClose = loading;
  }

  public error: string;

  public paymentOptions: PaymentOption[];

  public form = new FormGroup<{ [key: string]: FormControl<number>; }>({});

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private ref: MatDialogRef<CloseAreaModalComponent, CloseAreaModalReturn>,
    @Inject(MAT_DIALOG_DATA) public data: CloseAreaModalData
  ) {
    this.loading = true;
    this.api.getPaymentOptions().pipe(
      takeUntil(this.destroyed)
    ).subscribe({
      next: options => {
        this.paymentOptions = options;
        for (const option of this.paymentOptions) {
          const control: FormControl = new FormControl(0, [Validators.required, Validators.min(0)]);
          this.form.addControl(`${option.idpvFormaPago}`, control);
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

  public cancel(): void {
    this.ref.close();
  }

  public submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    this.error = undefined;
    this.api.closeArea(this.data.area, this.auth.user, this.form.value).pipe(
      takeUntil(this.destroyed)
    ).subscribe({
      next: () => {
        this.ref.close();
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.error = error.error;
        this.loading = false;
      }
    });
  }

}
