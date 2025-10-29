import { Component, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Area } from '../../core/models';
import { ModalsService } from '../../modals/modals.service';
import { CloseAreaComponent } from './close-area/close-area.component';
import { OpenAreaComponent } from './open-area/open-area.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './areas.component.html',
})
export class AreasComponent implements OnDestroy {

  private readonly destroyed: Subject<void> = new Subject();

  public areas: Area[];

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private modals: ModalsService
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
      this.dialog.open(OpenAreaComponent, {
        data: { area }
      }).afterClosed().pipe(
        takeUntil(this.destroyed)
      ).subscribe(() => {
        this.auth.clear();
        this.getAreas();
      });
    } else {
      if (await this.modals.login({ cancelable: true, msg: 'Requiere permisos de cajero.' })) {
        this.openArea(area);
      }
    }
  }

  public async closeArea(area: Area): Promise<void> {
    if (this.auth.user.permisos.cortes) {
      this.dialog.open(CloseAreaComponent, {
        data: { area }
      }).afterClosed().pipe(
        takeUntil(this.destroyed)
      ).subscribe(() => {
        this.auth.clear();
        this.getAreas();
      });
    } else {
      if (await this.modals.login({ cancelable: true, msg: 'Requiere permisos de cajero.' })) {
        this.closeArea(area);
      }
    }
  }

}
