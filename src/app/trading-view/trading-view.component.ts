import { Component, OnInit } from '@angular/core';
import { TradingService } from 'services/trading.service';

@Component({
  selector: 'app-trading-view',
  templateUrl: './trading-view.component.html',
  styleUrls: ['./trading-view.component.css']
})
export class TradingViewComponent implements OnInit {

  constructor(private tradingService: TradingService) {
    tradingService.messages.subscribe(msg => {
      console.log("Response from websocket:" + msg);
    });
  }

  ngOnInit(): void {
  }

  private message = {
    author: "tutorialedge",
    message: "this is a test message"
  };

  sendMsg() {
    console.log("new message from client to websocket: ", this.message);
    this.tradingService.messages.next(this.message);
    this.message.message = "";
  }

}
