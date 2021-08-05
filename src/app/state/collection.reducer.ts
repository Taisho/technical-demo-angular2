
import { createReducer, on, Action } from '@ngrx/store';
import { addBook, removeBook } from './books.actions';

export const initialState: ReadonlyArray<string> = [];

export const collectionReducer = createReducer(
  initialState,
  on(removeBook, (state, { bookId }) => state.filter((id) => id != bookId)),
  on(addBook, (state, { bookId }) => {
    console.log("reducer addBook: state: ", state, "; bookId: ", bookId);
    if (state.indexOf(bookId) > -1) return state;

    return [...state, bookId];
  })
);