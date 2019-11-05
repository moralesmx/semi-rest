import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { EMPTY, Subject } from 'rxjs';
import { catchError, debounceTime, filter, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { Room, Table, Waiter } from '../../../core/models';

@Component({
  templateUrl: 'new-bill.component.html'
})
export class NewBillComponent implements OnDestroy {

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

  public form: FormGroupTyped<{
    waiter: Waiter['idpvUsuarios'],
    adults: number,
    minors: number,
    name: string,
    room: string,
    guest: Room['idHotel']
  }> = new FormGroup({
    waiter: new FormControl(undefined, [Validators.required]),
    adults: new FormControl(0, [Validators.required, Validators.min(1)]),
    minors: new FormControl(0, [Validators.required, Validators.min(0)]),
    name: new FormControl(NewBillComponent.defaultName, [Validators.required]),
    room: new FormControl(undefined),
    guest: new FormControl(undefined),
  }) as any;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private ref: MatDialogRef<NewBillComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { table: Table }
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
        this.form.controls.name.setValue(NewBillComponent.defaultName);
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
