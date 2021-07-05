import { Component, OnInit } from '@angular/core';
import { TradingService } from 'services/trading.service';

enum ViewMode {
  HOURLY,
  DAILY,
}

@Component({
  selector: 'app-trading-view',
  templateUrl: './trading-view.component.html',
  styleUrls: ['./trading-view.component.css']
})
export class TradingViewComponent implements OnInit {

  public japaneseCandles: Array<any> = [];
  public enumViewMode = ViewMode;
  public viewMode = ViewMode.HOURLY;

  constructor(private tradingService: TradingService) {
    tradingService.response.subscribe((msg)=>this.onMessageFromServer(msg));

    // TODO get viewMode from localStorage, so that user preferences are preserved
  }

  onMessageFromServer(msg: any) {
    switch(msg.response) {

      case 'response-historical-price-data':
        if(msg.error != null) {
          console.error(msg.error);
          return;
        }

        this.japaneseCandles.length = 0;
        this.expandCandles(msg.data);
        this.japaneseCandles.push(...msg.data);
        console.log("Response from websocket:", msg);

        break;

    }
  }

  toggleHourView() {
    this.viewMode = ViewMode.HOURLY;
  }

  toggleDayView() {
    this.viewMode = ViewMode.DAILY;
  }

  expandCandles(candles: Array<any>) {
      for(let ic of candles) {
        let date = new Date(ic.timestamp);
        let mday:string|number = date.getUTCDate(); mday = mday < 10 ? "0"+mday : mday.toString();
        let month:string|number = date.getUTCMonth(); month = month < 10 ? "0"+month : month.toString();
        

        ic.dateTime = month+"/"+mday;
        // let candle = {
        //   "id":2161,
        //   "market":1,
        //   "condensed":1,
        //   "date":null,
        //   "timestamp":1625461265155,
        //   "priceOpen":0,
        //   "priceClose":34427.37744031433,
        //   "priceBottom":0,
        //   "priceTop":0
        // }
      }
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

class JapaneseCandle {

}
