import { normalizeGenFileSuffix } from '@angular/compiler/src/aot/util';
import { Component, OnInit, AfterViewInit, ViewChild, ViewChildren, QueryList, ElementRef,
  ChangeDetectorRef } from '@angular/core';
import { fakeAsync } from '@angular/core/testing';
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
export class TradingViewComponent implements OnInit, AfterViewInit {

  /**
   * Outstanding things:
   * 
   * 
   */

  public priceTop: number = 0;
  public priceBottom: number = 0;

  public japaneseCandles: Array<any> = []; // used by the template
  public japaneseCandlesHours: Array<any> = [];
  public japaneseCandlesDays: Array<any> = [];

  public enumViewMode = ViewMode;
  public viewMode = ViewMode.HOURLY;

  public candleWidth = 10; // candle width in pixels
  public priceLabelHeight:number = 0;

  constructor(private tradingService: TradingService, private changeDetectorRef: ChangeDetectorRef) {
    tradingService.response.subscribe((msg)=>this.onMessageFromServer(msg));

    // TODO get viewMode from localStorage, so that user preferences are preserved
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

  ngAfterViewInit(): void {
    this.candlesContainerNative = document.querySelector('.CandlesContainer') as HTMLElement;
    let observer = new ResizeObserver((entries: ResizeObserverEntry[], observer: ResizeObserver)=> this.onPriceChartResize(entries, observer));
    observer.observe(this.candlesContainerNative);

    // Putting a dummy price label, that will give us the dimensions of a single price label.
    this.priceLabels.length = 0;
    this.priceLabels[0] = {
      text: "9876543210",
      value: 9876543210,
      invisible: true,
      right: 0,
      top: 0,
    }

    setTimeout(() => {
      let priceLabel = document.querySelector(".rightSidePriceLabel") as HTMLElement;
      let labelBoundingBox = priceLabel.getBoundingClientRect();
      this.priceLabelHeight = labelBoundingBox.height;
    }, 0);

  }

  onPriceChartResize(entries: ResizeObserverEntry[], observer: ResizeObserver) {
    let entry = entries[entries.length-1];
    this.figureOutPriceLabels();
    this.repositionCandles();
  }

  public crosshairX = 0;
  public crosshairY = 0;
  public showCrosshair = false;
  onMouseMove(event: MouseEvent) {
    this.showCrosshair = true;
    let boundingBox = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.crosshairX = event.clientX - boundingBox.x - 3;
    this.crosshairY = event.clientY - boundingBox.y - 3;
  }

  onMouseLeave(event: MouseEvent) {

  }

  onMessageFromServer(msg: any) {
    switch(msg.response) {

      case 'response-historical-price-data':
        if(msg.error != null) {
          console.error(msg.error);
          return;
        }

        this.japaneseCandlesHours.length = 0;
        //msg.data = msg.data.slice(Math.max(msg.data.length - 10, 1))
        this.expandCandles(msg.data);  //msg.data gets modified here
        this.japaneseCandlesHours.push(...msg.data);
        console.log("Response from websocket:", msg);
        this.toggleHourView();
        break;

    }
  }

  toggleHourView() {
    this.viewMode = ViewMode.HOURLY;
    this.japaneseCandles = this.japaneseCandlesHours;
  }

  toggleDayView() {
    this.viewMode = ViewMode.DAILY;
    this.japaneseCandles = this.japaneseCandlesDays;
  }

  public candlesContainerConfig = {width: 0};
  @ViewChild('CandlesViewPort') public candlesViewPort!: ElementRef;
  /**
   *  Since we are iterating over all candles, we can determine the price bottom and top here
   * 
   * @param candles 
   */
  expandCandles(candles: Array<any>) {
      let now = new Date();
      let currentHour = now.getUTCHours();
      let candleOffset = 0;
      for(let i=0; i<candles.length; i++) {
        let candle = candles[i];
        let candleDate = new Date(candle.timestamp);
        let mday:string|number = candleDate.getUTCDate(); mday = mday < 10 ? "0"+mday : mday.toString();
        let month:string|number = candleDate.getUTCMonth(); month = month < 10 ? "0"+month : month.toString();
        let hour:string|number = candleDate.getUTCHours();
        

        candle.dateTime = month+"/"+mday;
        let hourDifference = Math.floor((now.getTime() - candleDate.getTime()) / 3600000);
        candle.offsetRight = hourDifference * this.candleWidth;

        // Because we receive japanese candles in ascending order, the first one is the furthest from the
        // right side of the view port. (Maybe candles should be transmitted in descending order. It makes more sense that way)
        if(i == 0) {
          this.candlesContainerConfig.width = candle.offsetRight + this.candleWidth;
        }

        let priceTop = candle.condensed == true ? candle.priceClose : candle.priceTop ;
        if(priceTop > this.priceTop)
          this.priceTop = priceTop;

        let priceBottom = candle.condensed == true ? candle.priceClose : candle.priceBottom;
        if(this.priceBottom == 0 || priceBottom < this.priceBottom)
          this.priceBottom = priceBottom;


        if(true == candle.condensed) {
          candle.height = 1;
        }
        candle.offsetTop = 0;
      }

      
      setTimeout(()=>{
        // adjust candles' view port to display most recent price candles
        this.candlesViewPort?.nativeElement.scroll({
          left: this.candlesContainerConfig.width
        });

        this.repositionCandles();
      }, 0);

      this.figureOutPriceLabels();
  }

  repositionCandles() {
    const candles = this.japaneseCandles;
    let boundingBox = this.candlesContainerNative!.getBoundingClientRect();
    if(boundingBox == null) {
      console.error("repositionCandles: candlesViewPort's boundingBox is null!");
    }

    let pricePixelRatio = boundingBox.height / this.priceTop;
    for(let i=0; i<candles.length; i++) {
      let candle = candles[i];
      if(candle.condensed == true)
        candle.offsetTop = boundingBox.height - (candle.priceClose * pricePixelRatio);
    }
  }

  public priceLabels:Array<PriceLabel> = [];
  public candlesContainerNative!: HTMLElement|null;

  figureOutPriceLabelDivisibility(): {divisibility:number, labelsN:number} {
    let boundingBox = this.candlesContainerNative!.getBoundingClientRect();
    //let pricePixelRatio = boundingBox.height / this.priceTop;
    let labelsN = Math.floor(boundingBox.height / this.priceLabelHeight);
    if(labelsN > 1)
      labelsN = Math.floor(labelsN/2); //don't clutter price labels one next to the other. It's gonna appear confusing

    // Price labels should be divisible by some nice round number, like 10 or 100
    const divisibility = (this.priceTop - this.priceBottom) / labelsN;

    return {divisibility, labelsN};
  }

  figureOutPriceLabels() {
    const {divisibility, labelsN} = this.figureOutPriceLabelDivisibility();
    if(this.priceLabelHeight == 0) //needed, because this method could be called before the DOM is ready.
      return;

    this.priceLabels.length = 0;
    let price = this.priceTop - (this.priceTop % divisibility);
    for(let i=1; i<=labelsN; i++) {
      let label:PriceLabel = {
        text: price.toString(),
        value: price,
        invisible: true,
        right: 0,
        top: 0,
      }
      this.priceLabels.push(label);
      price -= divisibility;
    }


    // let boundingBox = this.candlesViewPort?.nativeElement.getBoundingClientRect();
    // let pricePixelRatio = boundingBox.height / this.priceTop;

    // Calling repositionPriceLabels with a short delay in order to give a chance to the browser to render elements first
    // otherwise their bounding box would be reported wrongly.

    setTimeout(()=>{
      this.repositionPriceLabels();
    },0);
  }

  @ViewChildren('priceLabels') public priceLabelsViews!: QueryList<ElementRef>;
  
  repositionPriceLabels() {
      const priceVeiwNative = document.querySelector(".PriceView") as HTMLElement;
      const priceViewBoundingBox = priceVeiwNative.getBoundingClientRect();
      const containerBoundingBox = this.candlesContainerNative!.getBoundingClientRect();

      let pricePixelRatio = containerBoundingBox.height / (this.priceTop - this.priceBottom);

      // this is needed because price labels are positioned relative to the PriceView element, but are displayed
      // relative to the CandlesContainer
      const labelsTopOffset = containerBoundingBox.top - priceViewBoundingBox.top;
      this.changeDetectorRef.detectChanges();

      setTimeout(()=>{
        //console.log("---------------------------");
        //let priceLabels = document.querySelectorAll('.rightSidePriceLabel');
        try {
          for(let i=0; i<this.priceLabels.length; i++) {
            let priceLabel = this.priceLabels[i];
            //console.log(priceLabel);
    
            let view = this.priceLabelsViews.get(i);
            let nativeElement = view?.nativeElement;
            let boundingBox = nativeElement.getBoundingClientRect();
            priceLabel.right = (-boundingBox.width);
            priceLabel.top = (((pricePixelRatio * this.priceTop) - (priceLabel.value * pricePixelRatio))+labelsTopOffset) - this.priceLabelHeight/2;//(this.priceLabelHeight*i)+labelsTopOffset;
            //console.log("containerBoundingBox.height: ", containerBoundingBox.height);
            //console.log("priceLabel.value: ", priceLabel.value , "| priceLabel.value * pricePixelRatio: ", priceLabel.value * pricePixelRatio);
            priceLabel.invisible = false;
          }
        } catch(e) {
            return;
        }
        finally {
          this.changeDetectorRef.detectChanges();
        }

      },0);
  }
}


interface PriceLabel {
  text: string;
  value: number;
  invisible: boolean;
  right: number;
  top: number;
}
