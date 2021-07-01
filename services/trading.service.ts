import { Injectable } from '@angular/core';
import { Subject, Observable, Observer } from 'rxjs';
import {map} from 'rxjs/operators'
import { WebsocketService } from "./websocket.service";

const TRADE_API_URL = "ws://localhost/api/trade";

export interface Message {
  author: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class TradingService {

  public messages: Subject<Message>;

  constructor(wsService: WebsocketService) {
    this.messages = <Subject<Message>>wsService.connect(TRADE_API_URL).pipe(map(
      (response: MessageEvent): Message => {
        console.log(response);
        let data = JSON.parse(response.data);
        return {
          author: data.author,
          message: data.message
        };
      }
    ));
  }
}
