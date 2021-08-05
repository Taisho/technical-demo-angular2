import { Book } from '../book-list/books.model';

export interface AppState {
  count: number;
  books: Array<Book>;
  collection: Array<string>;
}