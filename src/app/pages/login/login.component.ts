import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/auth.service';
import { FormGroupCustom } from '../../core/custom-forms/form-group';
import { User } from '../../core/models';

export interface LoginOptions {
  cancelable?: boolean;
  msg?: string;
}

@Component({
  templateUrl: 'login.component.html'
})
export class LoginComponent implements OnDestroy {

  private readonly destroyed: Subject<void> = new Subject();

  public error: string;

  // public pass: FormControl = new FormControl('11234', [Validators.required]);
  public pass: FormControl = new FormControl('', [Validators.required]);
  public form: FormGroupCustom = new FormGroupCustom({
    pass: this.pass
  });

  constructor(
    private auth: AuthService,
    private ref: MatDialogRef<LoginComponent, User>,
    @Inject(MAT_DIALOG_DATA) public options: LoginOptions
  ) {
    this.ref.disableClose = !this.options.cancelable;
    this.pass.valueChanges.subscribe(() => this.error = '');
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
      this.auth.auth(this.pass.value).pipe(
        takeUntil(this.destroyed)
      ).subscribe(
        user => {
          this.ref.close(user);
        },
        (error: HttpErrorResponse) => {
          this.form.enableAndRestoreState();
          if (error.status === 401) {
            this.pass.setValue('');
            this.error = 'Clave incorrecta.';
          } else {
            this.error = error.name;
          }
        }
      );
    } else {
      this.form.markAllAsTouched();
    }
  }
}
