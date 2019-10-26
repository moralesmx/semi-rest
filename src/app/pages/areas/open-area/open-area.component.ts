import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { FormGroupCustom } from '../../../core/custom-forms/form-group';
import { Area } from '../../../core/models';

@Component({
  templateUrl: 'open-area.component.html'
})

export class OpenAreaComponent implements OnDestroy {

  private readonly destroyed: Subject<void> = new Subject();

  public funds: FormControl = new FormControl('', [Validators.required]);
  public form: FormGroupCustom = new FormGroupCustom({
    funds: this.funds
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
    if (this.form.valid) {
      this.form.disableAndStoreState();
      this.ref.disableClose = true;
      this.api.openArea(this.data.area, this.auth.user, this.funds.value).pipe(
        takeUntil(this.destroyed)
      ).subscribe(
        () => {
          this.ref.close();
          this.router.navigateByUrl(`/areas/${this.data.area.idpvAreas}/${this.data.area.nombre}`);
        },
        error => {
          this.form.enableAndRestoreState();
          this.ref.disableClose = false;
          console.error(error);
        }
      );
    } else {
      this.form.markAllAsTouched();
    }
  }

}
