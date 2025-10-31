import { Component, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Area } from '../../core/models';
import { LoginModalComponent } from '../../modals/login/login.component';
import { CloseAreaModalComponent } from './close-area/close-area.component';
import { OpenAreaModalComponent } from './open-area/open-area.component';

@Component({
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './areas.component.html',
})
export class AreasComponent implements OnDestroy {

  private readonly destroyed = new Subject<void>();

  public areas: Area[];

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.getAreas();
  }

  public ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  private getAreas(): void {
    this.api.getAreas().pipe(
      takeUntil(this.destroyed)
    ).subscribe(areas => {
      this.areas = areas;
    });
  }

  public selectArea(area: Area): void {
    this.router.navigateByUrl(`/areas/${area.idpvAreas}/${area.nombre}`);
  }

  public async openArea(area: Area): Promise<void> {
    if (this.auth.user.permisos.cortes) {
      await OpenAreaModalComponent.open(this.dialog, area);
      this.auth.clear();
      this.getAreas();
    } else {
      if (await LoginModalComponent.open(this.dialog, { cancelable: true, msg: 'Requiere permisos de cajero.' })) {
        this.openArea(area);
      }
    }
  }

  public async closeArea(area: Area): Promise<void> {
    if (this.auth.user.permisos.cortes) {
      await CloseAreaModalComponent.open(this.dialog, area);
      this.auth.clear();
      this.getAreas();
    } else {
      if (await LoginModalComponent.open(this.dialog, { cancelable: true, msg: 'Requiere permisos de cajero.' })) {
        this.closeArea(area);
      }
    }
  }

}
