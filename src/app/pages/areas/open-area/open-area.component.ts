import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { Area } from '../../../core/models';

@Component({
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

  public form: FormGroupTyped<{
    funds: number
  }> = new FormGroup({
    funds: new FormControl(0, [Validators.required, Validators.min(0)])
  }) as any;

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
