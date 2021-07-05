// import { Injectable } from '@angular/core';
// import { Subject, Observable, Observer } from 'rxjs';


// @Injectable({
//   providedIn: 'root'
// })
// export class WebsocketService {

//   constructor() { }

//   //private subject: Subject<MessageEvent>|null = null;
//   private request: Subject<MessageEvent>|null = null;
//   private response: Subject<MessageEvent>|null = null;

//   public connect(url: string): Subject<MessageEvent> {
//     if (!this.subject) {
//       this.subject = this.create(url);
//       console.log("Attempting to connect to a websocket: " + url);
//     }
//     return this.subject;
//   }

//   private create(url: string): Subject<MessageEvent> {
//     let ws = new WebSocket(url, 'echo-protocol');
//     ws.onmessage = obs.next.bind(obs);
//     ws.onerror = obs.error.bind(obs);
//     ws.onclose = obs.complete.bind(obs);


//     /*let observable = new Observable((obs: Observer<MessageEvent>) => {

//       return ws.close.bind(ws);
//     });*/

//     let observer = {
//       next: (data: Object) => {
//         if (ws.readyState === WebSocket.OPEN) {
//           ws.send(JSON.stringify(data));
//         }
//       }
//     };
//     let subject = new Subject<MessageEvent>()// this seems to be problematic
//     subject.subscribe(observer);
//     //observer.subscribe(subject);
    
//     return subject;
//   }
// }
