import { Component } from '@angular/core';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Area, Section, Table, User } from '../../core/models';
import { ModalsService } from '../../modals/modals.service';
import { LoginService } from '../login/login.service';
import { BillComponent } from './bill/bill.component';
import { OrderComponent } from './bill/order/order.component';
import { NewBillComponent } from './new-bill/new-bill.component';
import { ActionsService } from '../../core/actions.service';

@Component({
  templateUrl: './area.component.html',
})
export class AreaComponent {

  public search: string = '';

  public area: Area;
  public activeSection: Section;

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private login: LoginService,
    private router: Router,
    private route: ActivatedRoute,
    private modals: ModalsService,
    private dialog: MatDialog,
    private actions: ActionsService
  ) {
    this.update();
  }

  public update(): void {
    this.api.getArea(this.route.snapshot.params.id).subscribe(area => {
      this.area = area;
      if (!area.idpvCortes) {
        this.router.navigateByUrl('/');
      }
      this.activeSection = this.activeSection ?
        this.area.secciones.find(section => section.idpvSecciones === this.activeSection.idpvSecciones) :
        this.area.secciones[0];
    });
  }

  public async order(table: Table, bypass: boolean = false): Promise<void> {
    if (bypass || await this.login.login({ cancelable: true })) {
      if (await this.actions.order(table.idpvAreasMesas)) {
        this.update();
      }
    }
  }

  public async selectTable(table: Table): Promise<void> {
    const user: User = await this.login.login({ cancelable: true });
    if (user) {
      if (table.idpvVentas) {
        if (user.cajero || user.capitan || user.idpvUsuarios === table.idpvUsuarios) {
          this.dialog.open(BillComponent, {
            data: { table }
          }).afterClosed().pipe(
            // takeUntil(this.destroyed)
          ).subscribe(() => this.update());
        } else {
          this.modals.alert({
            title: 'Acceso denegado',
            message: 'No tienes los permisos para ver esta cuenta',
            ok: 'Aceptar'
          });
        }
      } else {
        this.dialog.open(NewBillComponent, {
          data: { table }
        }).afterClosed().pipe(
          // takeUntil(this.destroyed)
        ).subscribe(changes => {
          if (changes) {
            this.update();
            this.order(table, true);
          }
        });
      }
    }
  }

  public updateArea(): void {
    this.api.updateArea(this.area).subscribe();
  }

  public addTable(): void {
    this.activeSection.mesas.push({
      clave: 'Mesa',
      coordX: 0,
      coordY: 0,
      idpvAreas: this.area.idpvAreas,
      idpvSecciones: this.activeSection.idpvSecciones
    } as any);
  }

  public addSection(): void {
    this.area.secciones.push({
      idpvAreas: this.area.idpvAreas,
      mesas: [],
      nombre: 'Seccion',
      proporcion: 10
    } as any);
  }

}
