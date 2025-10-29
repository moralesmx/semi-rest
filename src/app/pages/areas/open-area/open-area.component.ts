import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { Area } from '../../../core/models';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
    NgxCurrencyDirective,
    BlockUIModule
  ],
  templateUrl: 'open-area.component.html'
})
export class OpenAreaComponent implements OnDestroy {

  private readonly destroyed: Subject<void> = new Subject();

  private _loading: boolean;
  public get loading(): boolean {
    return this._loading;
  }
  public set loading(loading: boolean) {
    this._loading = loading;
    this.ref.disableClose = loading;
  }

  public form = new FormGroup({
    funds: new FormControl(0, [Validators.required, Validators.min(0)])
  });

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private ref: MatDialogRef<OpenAreaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { area: Area }
  ) { }

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
    this.api.openArea(this.data.area, this.auth.user, this.form.controls.funds.value).pipe(
      takeUntil(this.destroyed)
    ).subscribe({
      next: () => {
        this.ref.close();
        this.router.navigateByUrl(`/areas/${this.data.area.idpvAreas}/${this.data.area.nombre}`);
        this.loading = false;
      },
      error: error => {
        console.error(error);
        this.loading = false;
      }
    });
  }

}
