import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AreaComponent } from './pages/area/area.component';
import { AreasComponent } from './pages/areas/areas.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/areas' },

  {
    path: 'areas', children: [
      { path: '', component: AreasComponent },
      { path: ':id/:name', component: AreaComponent }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
