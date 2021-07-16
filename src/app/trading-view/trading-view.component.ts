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
  public hoverPriceLabelConfig: PriceLabel = {
    text: "0",
    value: 0,
    invisible: true,
    right: 0,
    top: 0,
  };

  constructor(private tradingService: TradingService, private changeDetectorRef: ChangeDetectorRef) {
    tradingService.response.subscribe((msg)=>this.onMessageFromServer(msg));

    // TODO get viewMode from localStorage, so that user preferences are preserved
  }

  ngOnInit(): void {
    // Fetch historical price data and then subscribe for real time price changes
    setTimeout(()=>{
      let message = {command: "get-historical-price-data", data: {
        marketId: 1,
        daysAgo: 90,
      }};
      console.log("TradingViewComponent.ngOnInit()");
      this.tradingService.request.next(message);
    }, 0);
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

    //this.changeDetectorRef.detectChanges();

    //setTimeout(() => {
      let priceLabel = document.querySelector(".rightSidePriceLabel") as HTMLElement;
      let labelBoundingBox = priceLabel.getBoundingClientRect();
      this.priceLabelHeight = labelBoundingBox.height;
    //}, 0);

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
    let element = event.currentTarget as HTMLElement;
    let boundingBox = element.getBoundingClientRect();
    // if(event.clientY > boundingBox.y+element.clientHeight){
    //   this.hideCrossHair();
    //   return;
    // }

    
    this.crosshairX = event.clientX - boundingBox.x;
    this.crosshairY = event.clientY - boundingBox.y;

    this.showHoveredPriceLabel();
  }

  hideCrossHair(event?: MouseEvent) {
    this.showCrosshair = false;
    this.hoverPriceLabelConfig.invisible = true;
  }

  @ViewChild('hoverPriceLabel') public hoverPriceLabel!: ElementRef;
  showHoveredPriceLabel() {
    if(this.priceLabelHeight <= 0)
      return;
    
    this.hoverPriceLabelConfig.invisible = false;
    this.hoverPriceLabelConfig.top = this.crosshairY - (this.priceLabelHeight/2);

    const priceVeiwNative = document.querySelector(".PriceView") as HTMLElement;
    const containerBoundingBox = this.candlesContainerNative!.getBoundingClientRect();
    let pixelPriceRatio = (this.priceTop - this.priceBottom) / containerBoundingBox.height;
    const priceViewBoundingBox = priceVeiwNative.getBoundingClientRect();

    // this is needed because price labels are positioned relative to the PriceView element, but are displayed
    // relative to the CandlesContainer
    //const labelsTopOffset = containerBoundingBox.top - priceViewBoundingBox.top;

    let priceHovered = ((this.priceTop - (this.crosshairY * pixelPriceRatio)));// - this.priceLabelHeight/2;//(this.priceLabelHeight*i)+labelsTopOffset;
    //console.log("this.crosshairY: ", this.crosshairY);
    //console.log("pricePixelRatio: ", pixelPriceRatio);
    //console.log("");

    
    //(this.crosshairY * pricePixelRatio)
    
    //(((pricePixelRatio * this.priceTop) - (priceLabel.value * pricePixelRatio))+labelsTopOffset) - this.priceLabelHeight/2;//(this.priceLabelHeight*i)+labelsTopOffset;

    this.hoverPriceLabelConfig.text = priceHovered.toString();
    this.changeDetectorRef.detectChanges();
    const hoverPriceBox = this.hoverPriceLabel?.nativeElement.getBoundingClientRect();
    this.hoverPriceLabelConfig.right = -hoverPriceBox.width;
    // setTimeout(()=> {
    //   this.hoverPriceLabelConfig.invisible = false;

    // }, 0);
  }

  onMessageFromServer(msg: any) {
    switch(msg.response) {

      case 'response-historical-price-data':
        if(msg.error != null) {
          console.error(msg.error);
          return;
        }

        this.japaneseCandlesHours.length = 0;
        msg.data = msg.data.slice(Math.max(msg.data.length - 100, 1))
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

    let pricePixelRatio = boundingBox.height / (this.priceTop - this.priceBottom);
    for(let i=0; i<candles.length; i++) {
      let candle = candles[i];
      if(candle.condensed == true)
        candle.offsetTop = boundingBox.height - (candle.priceClose * pricePixelRatio);
    }
  }

  public priceLabels:Array<PriceLabel> = [];
  public candlesContainerNative!: HTMLElement|null;

  figureOutPriceLabelDivisibility(): number {
    let boundingBox = this.candlesContainerNative!.getBoundingClientRect();
    let pricePixelRatio = (this.priceTop - this.priceBottom) / boundingBox.height;

    //don't clutter price labels one next to the other. It's gonna appear confusing. Here we assume 
    let divisibility = this.priceLabelHeight*3*pricePixelRatio;

    // Price labels should be divisible by some nice round number, like 10, 100, etc.
    let divisibilityStrArr = divisibility.toString().split('.');
    if(divisibilityStrArr.length == 2) {
      if(divisibilityStrArr[0].length > 1) {
        let divisibilityStr = divisibilityStrArr[0].charAt(0)+"0".repeat(divisibilityStrArr[0].length-1);
        divisibility = parseInt(divisibilityStr);
      }
    }

    return divisibility;
  }

  @ViewChildren('priceLabels') public priceLabelsViews!: QueryList<ElementRef>;
  figureOutPriceLabels() {
    const divisibility = this.figureOutPriceLabelDivisibility();
    //the following guard is needed, because this method could be called before the DOM is ready or before price data is available.
    if(this.priceLabelHeight == 0 || this.priceTop == 0 || divisibility == 0)
      return;

    const containerBoundingBox = this.candlesContainerNative!.getBoundingClientRect();
    let pixelPriceRatio = containerBoundingBox.height / (this.priceTop - this.priceBottom);
    let price = this.priceTop - (this.priceTop % divisibility) + divisibility;
    this.priceLabels.length = 0;
    for(let i=0; ; i++) {

      const label:PriceLabel = {
        text: price.toString(),
        value: price,
        invisible: false,
        right: 0,
        top: ((pixelPriceRatio * this.priceTop) - (price * pixelPriceRatio)) - this.priceLabelHeight/2,
      }

      //Don't display the latest label if it's going to be positioned too low. This is also functions as the natural end of the loop
      if(label.top+(this.priceLabelHeight/2) > containerBoundingBox.height)
        break;

      // Above when we decided the value of $price we intentionally added $divisibility in order to have a label that is higher than
      // the price of the highest candle. This means, however, that it's possible that the first price label to be positioned way higher, appearing
      // as if it is out of place. If that's the case we will begin with the lower label
      if(Math.ceil(label.top) < -(this.priceLabelHeight/2)) {
        i--; //restart the loop 
        price -= divisibility; // with lower price
        continue;
      }

      this.priceLabels.push(label);
      this.changeDetectorRef.detectChanges();
      const view = this.priceLabelsViews.get(i);
      const nativeElement = view?.nativeElement;
      const boundingBox = nativeElement.getBoundingClientRect();
      label.right = (-boundingBox.width);
      this.changeDetectorRef.detectChanges();

      price -= divisibility;
    }
  }
}


interface PriceLabel {
  text: string;
  value: number;
  invisible: boolean;
  right: number;
  top: number;
}
