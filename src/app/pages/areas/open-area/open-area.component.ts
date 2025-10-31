import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { NgxCurrencyDirective } from 'ngx-currency';
import { firstValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { Area } from '../../../core/models';
import { CursorEndDirective } from '../../area/bill/pay/cursor-end.directive';

interface OpenAreaModalData {
  area: Area;
}
type OpenAreaModalReturn = void;

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    NgxCurrencyDirective,
    CursorEndDirective
  ],
  templateUrl: 'open-area.component.html'
})
export class OpenAreaModalComponent implements OnDestroy {

  public static open(dialog: MatDialog, area: Area) {
    return firstValueFrom(dialog.open<OpenAreaModalComponent, OpenAreaModalData, OpenAreaModalReturn>(OpenAreaModalComponent, {
      data: { area }
    }).afterClosed());
  }

  private readonly destroyed = new Subject<void>();

  public form = new FormGroup({
    funds: new FormControl(0, [Validators.required, Validators.min(0)])
  });

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private ref: MatDialogRef<OpenAreaModalComponent, OpenAreaModalReturn>,
    @Inject(MAT_DIALOG_DATA) public data: OpenAreaModalData
  ) { }

  public ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  public cancel() {
    this.ref.close();
  }

  public submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const value = this.form.value;

    this.form.disable();
    this.ref.disableClose = this.form.disabled;

    this.api.openArea(this.data.area, this.auth.user, value.funds).pipe(
      takeUntil(this.destroyed)
    ).subscribe({
      next: () => {
        this.ref.close();
        this.router.navigateByUrl(`/areas/${this.data.area.idpvAreas}/${this.data.area.nombre}`);
      },
      error: error => {
        console.error(error);
        this.form.enable();
        this.ref.disableClose = this.form.disabled;
      }
    });
  }

}
