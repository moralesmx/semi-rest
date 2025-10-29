import { Routes } from '@angular/router';
import { AreaComponent } from './pages/area/area.component';
import { AreasComponent } from './pages/areas/areas.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/areas' },
  {
    path: 'areas',
    children: [
      { path: '', component: AreasComponent },
      { path: ':id/:name', component: AreaComponent }
    ]
  }
];
