import { Component, OnInit } from '@angular/core';
import { TradingService } from 'services/trading.service';

@Component({
  selector: 'app-trading-view',
  templateUrl: './trading-view.component.html',
  styleUrls: ['./trading-view.component.css']
})
export class TradingViewComponent implements OnInit {

  constructor(private tradingService: TradingService) {
    tradingService.response.subscribe(this.onMessageFromServer);
  }

  onMessageFromServer(msg: any) {
    console.log("Response from websocket:", msg);
  }

  ngOnInit(): void {
    // Fetch historical price data and then subscribe for real time price changes. (Try to do all of this through the websocket)
    setTimeout(()=>{
      let message = {command: "get-historical-price-data", data: {
        marketId: 1,
        daysAgo: 90,
      }};
      console.log("TradingViewComponent.ngOnInit()");
      this.tradingService.request.next(message);
    }, 0);
    // this.tradingService.request(message);
  }

}
