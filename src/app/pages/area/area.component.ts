import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActionsService } from '../../core/actions.service';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Area, Section, Table, User } from '../../core/models';
import { ModalsService } from '../../modals/modals.service';
import { BillModalComponent } from './bill/bill.component';
import { NewBillComponent } from './new-bill/new-bill.component';

@Component({
  templateUrl: './area.component.html',
})
export class AreaComponent implements OnDestroy {

  private readonly destroyed: Subject<void> = new Subject<void>();

  public loading: boolean;

  public search: string = '';

  public area: Area;
  public activeSection: Section;

  public closed: Table[];
  public showClosed: boolean;

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private modals: ModalsService,
    private dialog: MatDialog,
    private actions: ActionsService
  ) {
    timer(0, 5000).pipe(
      takeUntil(this.destroyed)
    ).subscribe({
      next: () => {
        this.update();
      }
    });
  }

  public ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  public update(): void {
    this.api.getArea(this.route.snapshot.params.id).subscribe({
      next: area => {
        this.area = area;
        if (!area.idpvCortes) {
          this.router.navigateByUrl('/');
        }
        this.activeSection = this.activeSection ?
          this.area.secciones.find(section => section.idpvSecciones === this.activeSection.idpvSecciones) :
          this.area.secciones[0];

        this.api.getClosedTables(this.area).subscribe({
          next: bills => {
            this.closed = bills;
          },
          error: console.error
        });
      },
      error: error => {
        console.error(error);
      }
    });
  }

  public async order(table: Table, bypass: boolean = false): Promise<void> {
    if (bypass || await this.modals.login({ cancelable: true })) {
      if (await this.actions.order(table.idpvAreasMesas)) {
        this.update();
      }
    }
  }

  public async selectTable(table: Table): Promise<void> {
    const user: User = await this.modals.login({ cancelable: true });
    if (!user) {
      return;
    }
    if (table.idpvVentas) {
      if (user.permisos.comandarotros || user.idpvUsuarios === table.idpvUsuarios) {
        this.dialog.open(BillModalComponent, {
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

  public async closedOptions(table: Table): Promise<void> {
    const user: User = await this.modals.login({ cancelable: true });
    if (!user) {
      return;
    }
    const option: string = await this.modals.select({
      title: `Cuenta ${table.clave}`,
      options: {
        reabrir: 'Reabrir cuenta',
        reimprimir: 'Reimprimir cuenta'
      },
      cancel: 'Cancelar'
    });
    switch (option) {
      case 'reabrir':
        if (user.permisos.revivir) {
          const response: boolean = await this.modals.alert({
            title: `Reabrir cuenta ${table.clave}`,
            message: '¿Esta seguro de que desea reabrir la cuenta?',
            cancel: 'Cancelar',
            ok: 'Aceptar'
          });
          if (response) {
            this.loading = true;
            this.api.reopenCheck(table.idpvVentas).subscribe({
              next: () => this.loading = false,
              error: () => this.loading = false,
            });
          }
        } else {
          this.modals.alert({
            title: 'Acceso denegado',
            message: 'No tienes los permisos para reabrir esta cuenta',
            ok: 'Aceptar'
          });
        }
        break;
      case 'reimprimir':
        if (user.permisos.imprimircheque) {
          const response: boolean = await this.modals.alert({
            title: `Reimprimir cuenta ${table.clave}`,
            message: '¿Esta seguro de que desea reimprimir la cuenta?',
            cancel: 'Cancelar',
            ok: 'Aceptar'
          });
          if (response) {
            this.loading = true;
            this.api.printCheck(table.idpvVentas).subscribe({
              next: () => this.loading = false,
              error: () => this.loading = false,
            });
          }
        } else {
          this.modals.alert({
            title: 'Acceso denegado',
            message: 'No tienes los permisos para reimprimir esta cuenta',
            ok: 'Aceptar'
          });
        }
        break;
      default:
        break;
    }
  }

  public trackArea(index: number, area: Area) {
    return area.idpvAreas;
  }

  public trackTable(index: number, table: Table) {
    return table.idpvAreasMesas;
  }

}
