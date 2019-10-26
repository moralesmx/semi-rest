import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ApiService } from '../../../../core/api.service';
import { Area, Table } from '../../../../core/models';

@Component({
  templateUrl: 'change-table.component.html'
})
export class ChangeTableComponent {

  public areas: Area[];

  constructor(
    private api: ApiService,
    private ref: MatDialogRef<ChangeTableComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { table: Table }
  ) {
    this.api.getAreas().pipe(
      switchMap(areas => forkJoin(areas.map(area => this.api.getArea(area.idpvAreas))))
    ).subscribe(areas => {
      this.areas = areas;
    });
  }

}
