import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TradingViewComponent } from './trading-view/trading-view.component';
import { NgrxExampleComponent } from './ngrx-example/ngrx-example.component';
import { RxjsExampleComponent } from './rxjs-example/rxjs-example.component';
import { StoreModule } from '@ngrx/store';
import { booksReducer } from './state/books.reducer';
import { collectionReducer } from './state/collection.reducer';
//import { reducers, metaReducers } from './reducers';
import { counterReducer } from './state/counter.reducer';
import { IndexComponent } from './index/index.component';
import { BookListComponent } from './book-list/book-list.component';
import { BookCollectionComponent } from './book-collection/book-collection.component';

@NgModule({
  declarations: [
    AppComponent,
    TradingViewComponent,
    NgrxExampleComponent,
    RxjsExampleComponent,
    IndexComponent,
    BookListComponent,
    BookCollectionComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    StoreModule.forRoot({ count: counterReducer, books: booksReducer, collection: collectionReducer })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
