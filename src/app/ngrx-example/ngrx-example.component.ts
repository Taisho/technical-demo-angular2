import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Store, select } from '@ngrx/store';
import { increment, decrement, reset } from '../state/counter.actions';


import { selectBookCollection, selectBooks } from '../state/books.selectors';
import {
  retrievedBookList,
  addBook,
  removeBook,
} from '../state/books.actions';
import { GoogleBooksService } from '../book-list/books.service';
import { AppState } from '../state/app.state';


@Component({
  selector: 'app-ngrx-example',
  templateUrl: './ngrx-example.component.html',
  styleUrls: ['./ngrx-example.component.css']
})
export class NgrxExampleComponent implements OnInit {

  count$: Observable<number>

  constructor(private store: Store<AppState>,
              private booksService: GoogleBooksService) {
    console.log("store: ", store);
    this.count$ = store.select('count');
  }

  ngOnInit(): void {
    this.booksService
    .getBooks()
    .subscribe((Book) => this.store.dispatch(retrievedBookList({ Book })));
  }

  
  increment() {
    this.store.dispatch(increment());
  }
 
  decrement() {
    this.store.dispatch(decrement());
  }
 
  reset() {
    this.store.dispatch(reset());
  }


  //FIXME Uncomment
  books$ = this.store.pipe(select(selectBooks));
  bookCollection$ = this.store.pipe(select(selectBookCollection));
 
  onAdd(bookId:string) {
    const book = addBook({ bookId });
    console.log("bookId: ", bookId, "; book: ", book);
    this.store.dispatch(book);
  }
 
  onRemove(bookId:string) {
    this.store.dispatch(removeBook({ bookId }));
  }

}
