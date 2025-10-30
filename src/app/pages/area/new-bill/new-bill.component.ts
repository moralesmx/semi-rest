import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BlockUIModule } from 'primeng/blockui';
import { EMPTY, firstValueFrom, Subject } from 'rxjs';
import { catchError, debounceTime, filter, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { Room, Table, Waiter } from '../../../core/models';
import { RangePipe } from '../../../pipes/range.pipe';

interface NewBillModalData {
  table: Table;
}
type NewBillModalReturn = boolean;

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    RangePipe,
    BlockUIModule
  ],
  templateUrl: 'new-bill.component.html'
})
export class NewBillModalComponent implements OnDestroy {

  public static open(dialog: MatDialog, table: Table) {
    return firstValueFrom(dialog.open<NewBillModalComponent, NewBillModalData, NewBillModalReturn>(NewBillModalComponent, {
      data: { table }
    }).afterClosed());
  }

  static readonly defaultName: string = 'Cliente directo';

  private readonly destroyed: Subject<void> = new Subject();

  private _loading: boolean;
  public get loading(): boolean {
    return this._loading;
  }
  public set loading(loading: boolean) {
    this._loading = loading;
    this.ref.disableClose = loading;
  }

  public waiters: Waiter[];

  public form = new FormGroup({
    waiter: new FormControl<Waiter['idpvUsuarios']>(undefined, [Validators.required]),
    adults: new FormControl(0, [Validators.required, Validators.min(1)]),
    minors: new FormControl(0, [Validators.required, Validators.min(0)]),
    name: new FormControl(NewBillModalComponent.defaultName, [Validators.required]),
    room: new FormControl<string>(undefined),
    guest: new FormControl<Room['idHotel']>(undefined),
  });

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private ref: MatDialogRef<NewBillModalComponent, NewBillModalReturn>,
    @Inject(MAT_DIALOG_DATA) public data: NewBillModalData
  ) {
    this.loading = true;
    this.api.getWaiters().pipe(
      takeUntil(this.destroyed),
    ).subscribe({
      next: waiters => {
        this.waiters = waiters;
        if (this.waiters.find(waiter => waiter.idpvUsuarios === this.auth.user.idpvUsuarios)) {
          this.form.controls.waiter.setValue(this.auth.user.idpvUsuarios);
        }
        this.loading = false;
      },
      error: error => {
        console.error(error);
        this.loading = false;
      }
    });

    if (this.auth.user.permisos.cambiomesero) {
      this.form.controls.waiter.enable();
    } else {
      this.form.controls.waiter.disable();
    }

    this.form.controls.room.valueChanges.pipe(
      tap(() => {
        this.form.controls.guest.setValue(undefined);
        this.form.controls.name.setValue(NewBillModalComponent.defaultName);
        this.form.controls.name.enable();
      }),
      debounceTime(300),
      filter(value => !!value),
      switchMap(value => {
        return this.api.getRoom(value).pipe(
          catchError(() => EMPTY)
        );
      }),
      takeUntil(this.destroyed)
    ).subscribe({
      next: room => {
        this.form.controls.guest.setValue(room.idHotel);
        this.form.controls.name.setValue(room.huesped);
        this.form.controls.name.disable();
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
    this.api.createBill({
      idpvAreas: this.data.table.idpvAreas,
      idpvAreasMesas: this.data.table.idpvAreasMesas,
      idpvUsuariosMesero: this.form.value.waiter,
      adultos: this.form.value.adults,
      menores: this.form.value.minors,
      nombre: this.form.value.name,
      idHotel: this.form.value.guest,
      habitacion: this.form.value.guest ? this.form.value.room : undefined
    }).pipe(
      takeUntil(this.destroyed)
    ).subscribe({
      next: () => {
        this.ref.close(true);
        this.loading = false;
      },
      error: error => {
        console.error(error);
        this.loading = false;
      }
    });
  }

}
