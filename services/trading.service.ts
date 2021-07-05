import { Injectable } from '@angular/core';
import { Subject, Observable, Observer } from 'rxjs';
import { map } from 'rxjs/operators'
//import { WebsocketService } from "./websocket.service";

const TRADE_API_URL = "ws://localhost:4202/stream";

export interface Request {
  command: string;
  data: string;
}

@Injectable({
  providedIn: 'root'
})
export class TradingService {

  //public messages: Subject<Request>;
  private webSocket: WebSocket;
  public request: Subject<any>;
  public response: Subject<any>;

  constructor() {
    this.webSocket = new WebSocket(TRADE_API_URL, 'echo-protocol');
    this.webSocket.onmessage = (msg) => {
      this.onmessage(msg);
    }
    this.request = new Subject();
    this.response = new Subject();

    this.request.subscribe((msg) => {
      this.onrequest(msg);
    });
    //this.webSocket.onerror = obs.error.bind(obs);
    //this.webSocket.onclose = obs.complete.bind(obs);

    // let messageEvent = wsService.connect(TRADE_API_URL);
    // this.messages = <Subject<Request>> messageEvent.pipe(map(
    //   (response: MessageEvent): Request => {
    //     console.log(response);
    //     let data = response as unknown as Request; //JSON.parse(response.data);
    //     return {
    //       command: data.command,
    //       data: data.data
    //     };
    //   }
    // ));
  }

  onmessage(msg: any) {
    msg = JSON.parse(msg.data);
    this.response.next(msg);
  }

  onrequest(msg: any) {
    /*if(this.webSocket.readyState == this.webSocket.CLOSED || this.webSocket.readyState == this.webSocket.CLOSING) {
      console.error("ERROR: websocket (\"/stream\") is closing or already closed", this.webSocket);
      return;
    }
    else if(this.webSocket.readyState == this.webSocket.CONNECTING) {
      let delay = 250;
      console.log("INFO: websocket (\"/stream\") is connecting. Sending in "+delay+" milliseconds", this.webSocket, msg);
      setTimeout(()=>{
        this.onrequest(msg);
      }, delay);
    } */

    try {
      console.log("INFO: sending data to websocket: ", this.webSocket, msg);
      this.webSocket.send(JSON.stringify(msg));
    } catch (e) {
      let delay = 250;
      console.log("INFO: websocket (\"/stream\") is connecting. Sending in " + delay + " milliseconds", this.webSocket, msg);
      setTimeout(() => {
        this.onrequest(msg);
      }, delay);
    }

  }
}
