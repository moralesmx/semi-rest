import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, Inject, OnDestroy, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/auth.service';
import { User } from '../../core/models';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface LoginModalData {
  cancelable?: boolean;
  msg?: string;
}

export type LoginModalReturn = User;

@Component({
  standalone: false,
  templateUrl: 'login.component.html'
})
export class LoginModalComponent implements OnDestroy {

  private readonly destroyed: Subject<void> = new Subject<void>();

  private _loading: boolean;
  public get loading(): boolean {
    return this._loading;
  }
  public set loading(loading: boolean) {
    this._loading = loading;
    this.ref.disableClose = loading || !this.data.cancelable;
  }

  @ViewChild('input', { static: true }) private input: ElementRef<HTMLInputElement>;

  public form = new FormGroup({
    pass: new FormControl('', [Validators.required])
  });

  constructor(
    private auth: AuthService,
    private ref: MatDialogRef<LoginModalComponent, LoginModalReturn>,
    @Inject(MAT_DIALOG_DATA) public data: LoginModalData
  ) {
    this.loading = false;
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
    this.auth.auth(this.form.controls.pass.value).pipe(
      takeUntil(this.destroyed)
    ).subscribe({
      next: user => {
        this.ref.close(user);
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.form.controls.pass.setValue('');
          this.form.controls.pass.setErrors({ auth: 'Clave incorrecta.' });
        } else {
          this.form.controls.pass.setErrors({ auth: error.name });
        }
        this.input.nativeElement.focus();
        this.loading = false;
      }
    });
  }
}
