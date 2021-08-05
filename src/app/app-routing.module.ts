import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TradingViewComponent } from './trading-view/trading-view.component';
import { NgrxExampleComponent } from './ngrx-example/ngrx-example.component';
import { IndexComponent } from './index/index.component';
import { RxjsExampleComponent } from './rxjs-example/rxjs-example.component';

const routes: Routes = [
  { path: '', redirectTo: '/index', pathMatch: 'full' },
  {path: 'index', component: IndexComponent},
  {path: 'trading-view', component: TradingViewComponent},
  {path: 'ngrx-example', component: NgrxExampleComponent},
  {path: 'rxjs-example', component: RxjsExampleComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
