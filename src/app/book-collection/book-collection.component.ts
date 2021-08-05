import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NullResponse } from 'ccxt';
import { Book } from '../book-list/books.model';

@Component({
  selector: 'app-book-collection',
  templateUrl: './book-collection.component.html',
  styleUrls: ['./book-collection.component.css'],
})
export class BookCollectionComponent {
  @Input() books!: Array<any> | null;
  @Output() remove = new EventEmitter();
}