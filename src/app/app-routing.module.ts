import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TradingViewComponent } from './trading-view/trading-view.component';

const routes: Routes = [
  {path: 'trading-view', component: TradingViewComponent},
  {path: 'index', redirectTo: '/trading-view', pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
