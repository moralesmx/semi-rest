import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, Inject, OnDestroy, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { firstValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/auth.service';
import { User } from '../../core/models';

interface LoginModalData {
  cancelable?: boolean;
  msg?: string;
}

type LoginModalReturn = User;

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,

    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  templateUrl: 'login.component.html'
})
export class LoginModalComponent implements OnDestroy {

  public static open(dialog: MatDialog, options: LoginModalData = {}) {
    return firstValueFrom(
      dialog.open<LoginModalComponent, LoginModalData, LoginModalReturn>(LoginModalComponent, {
        data: options,
        closeOnNavigation: false
      }).afterClosed()
    );
  }

  private readonly destroyed = new Subject<void>();

  @ViewChild('input', { static: true }) private input: ElementRef<HTMLInputElement>;

  public form = new FormGroup({
    pass: new FormControl('', [Validators.required])
  });

  constructor(
    private auth: AuthService,
    private ref: MatDialogRef<LoginModalComponent, LoginModalReturn>,
    @Inject(MAT_DIALOG_DATA) public data: LoginModalData
  ) {
    this.ref.disableClose = this.form.disabled || !this.data.cancelable;
  }

  public ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  public cancel() {
    this.ref.close();
  }

  public submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const value = this.form.value;

    this.form.disable();
    this.ref.disableClose = this.form.disabled || !this.data.cancelable;

    this.auth.auth(value.pass).pipe(
      takeUntil(this.destroyed)
    ).subscribe({
      next: user => {
        this.ref.close(user);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.form.controls.pass.setValue('');
          this.form.controls.pass.setErrors({ auth: 'Clave incorrecta.' });
        } else {
          this.form.controls.pass.setErrors({ auth: error.name });
        }

        this.form.enable();
        this.ref.disableClose = this.form.disabled || !this.data.cancelable;

        this.input.nativeElement.focus();
      }
    });
  }

}
