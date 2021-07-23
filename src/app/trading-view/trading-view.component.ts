import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, OnInit, AfterViewInit, ViewChild, ViewChildren, QueryList, ElementRef,
  ChangeDetectorRef } from '@angular/core';
import { vi } from 'date-fns/locale';
import { DateTime } from "luxon";
import { TradingService } from 'services/trading.service';

enum ViewMode {
  HOURLY,
  DAILY,
}

enum ViewPort {
  PRICE,
  VOLUME
}

@Component({
  selector: 'app-trading-view',
  templateUrl: './trading-view.component.html',
  styleUrls: ['./trading-view.component.css']
})
export class TradingViewComponent implements OnInit, AfterViewInit {

  public priceTop: number = 0;
  public priceBottom: number = 0;

  public japaneseCandles: Array<Candle> = []; // used by the template
  public japaneseCandlesHours: Array<Candle> = [];
  public japaneseCandlesDays: Array<Candle> = [];
  public volumeColumns: Array<any> = [];

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

  public hoverTimeLabelConfig: TimeLabel = {
    text: "0",
    value: 0,
    invisible: true,
    left: 0,
    top: 0,
  };

  public DateTime = DateTime;
  public timeLabels: Array<DateLabel> = [];

  constructor(private tradingService: TradingService, private changeDetectorRef: ChangeDetectorRef) {
    tradingService.response.subscribe((msg)=>this.onMessageFromServer(msg));

    // TODO get viewMode from localStorage, so that user preferences are preserved

    let dt:DateTime = DateTime.now().set({minute:0, second:0, millisecond:0});
    switch(this.viewMode) {
      case ViewMode.HOURLY:
        dt = dt.plus({hours: 5});
      break;
    case ViewMode.DAILY:
        dt = dt.plus({days: 5});
      break;
    }
    this.timePeriodsConfig.rightMostPeriod = dt;

    this.generateDummyVolumeData();
    this.expandVolumeColumns();
  }

  public dummyVolume = [
    1987345677,
    1387345677,
    1587345677,
    1487345677,
    1587345677,
    1587345677,
    1517345677,
    1547345677,
    1087345677,
    1287345677,
  ];
  public volumeData: Array<any> = [];
  // Obviosly this is needed only durin development
  generateDummyVolumeData() {
    let date = DateTime.now().set({minute:0, second:0, millisecond:0});
    for(let i=0; i<this.dummyVolume.length; i++) {
      const volume = {
        timestamp: date,
        value: this.dummyVolume[i],
      }
      date = date.minus({hours: 1});
      this.volumeData.push(volume);
    }
  }

  public volumeTop = 0;
  public volumeBottom = 0;
  expandVolumeColumns() {
    for(let i=0; i<this.volumeData.length; i++) {
        const column = {

        };
        this.volumeColumns.push(column);
    }
  }

  // TODO 

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
    

    this.determinePriceLabelHeight();
    this.determineTimeLabelWidth();

    this.figureOutTimeLabels();

    //this.figureOutTimePeriods();
  }

  determinePriceLabelHeight() {
    // Putting a dummy price label, that will give us the dimensions of a single price label.
    this.priceLabels.length = 0;
    this.priceLabels[0] = {
      text: "9876543210",
      value: 9876543210,
      invisible: true,
      right: 0,
      top: 0,
    }
     

    this.changeDetectorRef.detectChanges();

    let priceLabel = document.querySelector(".priceLabel") as HTMLElement;
    let priceLabelBoundingBox = priceLabel.getBoundingClientRect();
    this.priceLabelHeight = priceLabelBoundingBox.height;
  }

  determineTimeLabelWidth() {
    this.timeLabels.length = 0;
    let labelText;
    // switch(this.viewMode) {
    //   case ViewMode.HOURLY:
    //     labelText = "00/00";
    //     break;
    //   case ViewMode.DAILY:
    //     labelText = "00:00";
    //     break;
    // }
    this.timeLabels[0] = {
      text: "00/00",
      timestamp: null,
      invisible: true,
      right:0,
      top:0,
    }
    this.timeLabels[1] = {
      text: "00:00",
      timestamp: null,
      invisible: true,
      right:0,
      top:0,
    }

    this.changeDetectorRef.detectChanges();
    let timeLabel = document.querySelectorAll(".timeLabel");
    let bbox = timeLabel[0].getBoundingClientRect();
    this.timePeriodsConfig.timeWidth = Math.ceil(bbox.width);
    bbox = timeLabel[1].getBoundingClientRect();
    this.timePeriodsConfig.dateWidth = Math.ceil(bbox.width);
  }

  onPriceChartResize(entries: ResizeObserverEntry[], observer: ResizeObserver) {
    let entry = entries[entries.length-1];
    this.figureOutPriceLabels();

    //TODO scale and reposition candles
    this.repositionCandles();
  }


  public crosshair = {
    x: 0,
    y: 0,
    show: false,
    viewPort: ViewPort.PRICE,
    period: 0,
    dateTime: null as unknown as DateTime,
  }
  public enumViewPort = ViewPort;
  moveCrossHair(event: MouseEvent, viewPort: ViewPort) {
    
    let element = event.currentTarget as HTMLElement;
    let boundingBox = element.getBoundingClientRect();
    // if(event.clientY > boundingBox.y+element.clientHeight){
    //   this.hideCrossHair();
    //   return;
    // }
    this.crosshair.viewPort = viewPort;
    const containerBoundingBox = this.candlesViewPort!.nativeElement.getBoundingClientRect();

    //console.log(event.clientY);
    this.crosshair.y = event.clientY - boundingBox.y;
    let crosshairX = event.clientX - boundingBox.x;
    const alignedXLeft = crosshairX - (crosshairX % this.timePeriodsConfig.periodPixelLength) - (parseFloat(this.timePeriodsConfig.periodPixelLength.toString())/2);
    const alignedXRight = alignedXLeft+this.timePeriodsConfig.periodPixelLength;
    const leftDiff = crosshairX - alignedXLeft;
    const rightDiff = alignedXRight - crosshairX;

    if(leftDiff < rightDiff) {
      crosshairX = alignedXLeft;// - (this.timePeriodsConfig.periodPixelLength/2) - 1;
      this.crosshair.x = crosshairX;
      //console.log("(left alignment) this.crosshair.x: "+crosshair.x+"; leftDiff: "+leftDiff+"; rightDiff: "+rightDiff);
    }
    else {
      this.crosshair.x = alignedXRight;// - (this.timePeriodsConfig.periodPixelLength/2) - 1;
      //console.log("(right alignment) this.crosshair.x: "+crosshair.x+"; leftDiff: "+leftDiff+"; rightDiff: "+rightDiff);
    }
    const crosshairXRight = containerBoundingBox.width - this.crosshair.x;
    const periodDiff = Math.ceil((containerBoundingBox.width - this.crosshair.x) / this.timePeriodsConfig.periodPixelLength);
    //console.log("crosshairXRight: "+crosshairXRight);
    const newPeriod = this.timePeriodsConfig.rightMostPeriod.minus({hours: periodDiff});
    //console.log("periodDiff: "+periodDiff+"; newPeriod: "+newPeriod.toLocaleString(DateTime.DATETIME_SHORT));
    this.crosshair.dateTime = newPeriod; //.minus({hours: });
    
    this.crosshair.show = true;

    if(viewPort == ViewPort.PRICE)
      this.showHoveredPriceLabel();

    this.showHoveredTimeLabel();
  }

  hideCrossHair(event?: MouseEvent) {
    //console.log("mouse leave event");
    this.crosshair.show = false;
    this.hoverPriceLabelConfig.invisible = true;
    this.hoverTimeLabelConfig.invisible = true;
  }

  @ViewChild('hoverTimeLabel') public hoverTimeLabel!: ElementRef;
  showHoveredTimeLabel() {
    if(this.timePeriodsConfig.timeWidth <= 0)
      return;
    
    this.hoverTimeLabelConfig.invisible = false;
    this.hoverTimeLabelConfig.left = this.crosshair.x - (this.timePeriodsConfig.timeWidth/2);

    //const priceVeiwNative = document.querySelector(".PriceVolumeView") as HTMLElement;
    const containerBoundingBox = this.candlesContainerNative!.getBoundingClientRect();
    //let pixelPriceRatio = (this.priceTop - this.priceBottom) / containerBoundingBox.height;
    //const priceViewBoundingBox = priceVeiwNative.getBoundingClientRect();

    //let priceHovered = ((this.priceTop - (this.crosshair.y * pixelPriceRatio)));// - this.priceLabelHeight/2;//(this.priceLabelHeight*i)+labelsTopOffset;
    const dateTime = this.timePeriodsConfig.rightMostPeriod;
    // const dateTime = this.timePeriodsConfig.rightMostPeriod.minus(
    //   {hours: Math.ceil(
    //     (containerBoundingBox.width - this.crosshair.x) /
    //     this.timePeriodsConfig.periodPixelLength)});

    this.hoverTimeLabelConfig.text = this.crosshair.dateTime.toLocaleString(DateTime.DATETIME_SHORT);
    //console.log("hoverTimeLabelConfig.text: "+this.hoverTimeLabelConfig.text);
    this.changeDetectorRef.detectChanges();
    //const hoverPriceBox = this.hoverPriceLabel?.nativeElement.getBoundingClientRect();
    //this.hoverPriceLabelConfig.right = -hoverPriceBox.width;
  }

  @ViewChild('hoverPriceLabel') public hoverPriceLabel!: ElementRef;
  showHoveredPriceLabel() {
    if(this.priceLabelHeight <= 0)
      return;
    
    this.hoverPriceLabelConfig.invisible = false;
    this.hoverPriceLabelConfig.top = this.crosshair.y - (this.priceLabelHeight/2);

    //const priceVeiwNative = document.querySelector(".PriceVolumeView") as HTMLElement;
    const containerBoundingBox = this.candlesContainerNative!.getBoundingClientRect();
    let pixelPriceRatio = (this.priceTop - this.priceBottom) / containerBoundingBox.height;
    //const priceViewBoundingBox = priceVeiwNative.getBoundingClientRect();

    // this is needed because price labels are positioned relative to the PriceView element, but are displayed
    // relative to the CandlesContainer
    //const labelsTopOffset = containerBoundingBox.top - priceViewBoundingBox.top;

    let priceHovered = ((this.priceTop - (this.crosshair.y * pixelPriceRatio)));// - this.priceLabelHeight/2;//(this.priceLabelHeight*i)+labelsTopOffset;
    //console.log("this.crosshair.y: ", this.crosshair.y);
    //console.log("pricePixelRatio: ", pixelPriceRatio);
    //console.log("");

    
    //(this.crosshair.y * pricePixelRatio)
    
    //(((pricePixelRatio * this.priceTop) - (priceLabel.value * pricePixelRatio))+labelsTopOffset) - this.priceLabelHeight/2;//(this.priceLabelHeight*i)+labelsTopOffset;

    this.hoverPriceLabelConfig.text = priceHovered.toString();
    this.changeDetectorRef.detectChanges();
    const hoverPriceBox = this.hoverPriceLabel?.nativeElement.getBoundingClientRect();
    this.hoverPriceLabelConfig.right = -hoverPriceBox.width;
    // setTimeout(()=> {
    //   this.hoverPriceLabelConfig.invisible = false;

    // }, 0);
  }

  public periods:Array<any> = [];
  public figureOutVisiblePeriods(labelCenter:number) {
    this.periods.length = 0;
    const candlesViewPortBoundingBox = this.candlesViewPort!.nativeElement.getBoundingClientRect();
    let periodRight = Math.ceil(labelCenter % this.timePeriodsConfig.periodPixelLength);
    const visiblePeriods = candlesViewPortBoundingBox.width / this.timePeriodsConfig.periodPixelLength;
    let atLabel = false;
    for(let i=1; i<visiblePeriods; i++) {
      atLabel = i%this.timePeriodsConfig.periodsBetweenLabels == this.timePeriodsConfig.rightMostLabelAtPeriod;
        
      this.periods.push({
        right: periodRight,
        atLabel: atLabel
      });

      periodRight += this.timePeriodsConfig.periodPixelLength;
    }
  }


  public timePeriodsConfig  = {
    //these two get calculated from determineTimeLabelWidth()
    timeWidth: 0, //the width of labels displaying time
    dateWidth: 0, //the width of labels displaying dates

    periodPixelLength: 5, // length of a period in pixels
    rightMostPeriod: null as unknown as DateTime,
    rightMostOffset:0, // how much the right most period is scrolled in pixels. Positive value indicate offset to the left, negative one to the right
    //periods: [] as Object[],
    rightMostLabelAtPeriod: 0,
    periodsBetweenLabels: NaN,
    initialRightMostLabelAtPeriod: NaN, //unused; obsolete
    mouseOriginX: 0,
    mouseOriginXViewPortScroll: 0,
    isScrolling: false,
    scrollLeft: 0,
    keyCandle: null as unknown as Candle,
    firstCall: true, // this is very hackish, but makes things work smoothly :)
  }

  //public timeLabelWidth = 0;
  public figureOutTimeLabels() {
    
    /*
        DONE render labels relative to the rightmost period
        DONE rendering while scrolling and rendering while still are different

        DONE Remove the bug of changing hours in time labels when adding new labels
             to the right

        DONE Remove labels to the left when scrolling in the opposite direction

        DONE Remove the bug in which the scroll offset (rightMostOffset) gets reset

        TODO Consider rendering labels in two passes: one for round values (like 00:00 o'clock or beginning of month for days)
              and the second pass is for the values around them

        DONE rename and adjust usage of some variables

     */
    
    const candlesViewPortBoundingBox = this.candlesViewPort!.nativeElement.getBoundingClientRect();
    this.timeLabels.length = 0;
    let offsetRight = 0;// + this.timePeriodsConfig.rightMostOffset;
    let counter = 0;
    //....
    let dt = this.timePeriodsConfig.rightMostPeriod;
    let labelText = "";

    let labelCenter = 0;
    if(true == this.timePeriodsConfig.firstCall){
      const dt12oclock = this.yieldNearest12oclock(dt);
      labelCenter = (((this.timePeriodsConfig.rightMostPeriod.toMillis() - dt12oclock.toMillis())/3600000)*this.timePeriodsConfig.periodPixelLength) +
          (this.timePeriodsConfig.timeWidth/2 + this.timePeriodsConfig.rightMostOffset);
      console.log("labelCenter: "+labelCenter);
      //console.log("labelCenter: "+labelCenter+"; periodPixelLength: "+this.timePeriodsConfig.periodPixelLength+"; rightMostOffset: "+this.timePeriodsConfig.rightMostOffset);
      const period = Math.ceil((labelCenter / this.timePeriodsConfig.periodPixelLength) - (this.timePeriodsConfig.rightMostOffset/this.timePeriodsConfig.periodPixelLength));
      this.timePeriodsConfig.rightMostLabelAtPeriod = period;
      //console.log("labelCenter (not scrolling): "+labelCenter);
      // if(NaN == this.timePeriodsConfig.initialRightMostLabelAtPeriod) {
      //   this.timePeriodsConfig.initialRightMostLabelAtPeriod
      // }
    }
    else {
      labelCenter = (this.timePeriodsConfig.rightMostLabelAtPeriod * this.timePeriodsConfig.periodPixelLength) +
      this.timePeriodsConfig.periodPixelLength / 2 + this.timePeriodsConfig.rightMostOffset;
      //console.log("labelCenter (scrolling): "+labelCenter);
    }


    // let labelCenter = this.timePeriodsConfig.timeWidth/2 + this.timePeriodsConfig.rightMostOffset;
    // if(this.timePeriodsConfig.isScrolling) {
    //   labelCenter = (this.timePeriodsConfig.rightMostLabelAtPeriod * this.timePeriodsConfig.periodPixelLength) +
    //   this.timePeriodsConfig.periodPixelLength / 2 + this.timePeriodsConfig.rightMostOffset;
    //   console.log("labelCenter: "+);
    // }

    //this.figureOutVisiblePeriods(labelCenter);

    do {
      // the center of the label needs to be aligned to the center of the time period.
      const period = Math.ceil((labelCenter / this.timePeriodsConfig.periodPixelLength) - (Math.floor(this.timePeriodsConfig.rightMostOffset)/this.timePeriodsConfig.periodPixelLength));
      if(counter == 0) {
        //;
        //console.log("labelCenter: "+labelCenter+", rightMostOffset/periodPixelLength: "+(Math.floor(this.timePeriodsConfig.rightMostOffset)/this.timePeriodsConfig.periodPixelLength));
      }
      
      
      if(Number.isNaN(this.timePeriodsConfig.initialRightMostLabelAtPeriod) == false &&
        Number.isNaN(this.timePeriodsConfig.periodsBetweenLabels)) {
          console.log(">rightMostLabelAtPeriod: ", this.timePeriodsConfig.rightMostLabelAtPeriod);
          this.timePeriodsConfig.periodsBetweenLabels = period - this.timePeriodsConfig.rightMostLabelAtPeriod;
      }

      if(Number.isNaN(this.timePeriodsConfig.initialRightMostLabelAtPeriod)) {
        console.log("^rightMostLabelAtPeriod: ", this.timePeriodsConfig.initialRightMostLabelAtPeriod);
        this.timePeriodsConfig.initialRightMostLabelAtPeriod = period;
      }

      //labelCenter = period * this.timePeriodsConfig.periodPixelLength;
      switch(this.viewMode) {
        case ViewMode.HOURLY:
            dt = this.timePeriodsConfig.rightMostPeriod.minus({hours: period});
            labelText = dt.toFormat("HH:mm");
          break;
        case ViewMode.DAILY:
            dt = this.timePeriodsConfig.rightMostPeriod.minus({days: period});
            labelText = dt.toFormat("LL/dd");
          break;
      }
      offsetRight = labelCenter-(this.timePeriodsConfig.timeWidth/2);
      if(offsetRight > candlesViewPortBoundingBox.width)
        break;

      const dateLabel:DateLabel = {
        text: labelText,
        invisible: false,
        timestamp: dt,
        right: offsetRight,
        top: 0,
      }
      this.timeLabels.push(dateLabel);
      this.changeDetectorRef.detectChanges();

      counter++;

      //offsetRight = (this.timePeriodsConfig.timeWidth * counter) + this.timePeriodsConfig.rightMostOffset;
      labelCenter += (this.timePeriodsConfig.timeWidth/2) + (this.timePeriodsConfig.timeWidth*2);

      // // TODO remove this condition after the method is bug free
      // if(counter > 100)
      //   break;
      
    } while(true);
    this.timePeriodsConfig.firstCall = false;
  }


  onMessageFromServer(msg: any) {
    switch(msg.response) {

      case 'response-historical-price-data':
        if(msg.error != null) {
          console.error(msg.error);
          return;
        }

        this.japaneseCandlesHours.length = 0;
        msg.data = msg.data.slice(Math.max(msg.data.length - 200, 1))
        this.expandCandles(msg.data);  //msg.data gets modified here
        this.japaneseCandlesHours.push(...msg.data);
        //console.log("Response from websocket:", msg);
        this.toggleHourView();
        break;

    }
  }

  toggleHourView() {
    this.viewMode = ViewMode.HOURLY;
    this.japaneseCandles = this.japaneseCandlesHours;

    this.timePeriodsConfig.rightMostPeriod = DateTime.now().set({minute:0, second:0, millisecond:0}).plus({hours: 5});
    //TODO round the period down
    // the following lines are a hack. Keep them here
    // this.timePeriodsConfig.isScrolling = true;
    // this.timePeriodsConfig.rightMostOffset = 1;
    // this.figureOutTimeLabels();
    // this.timePeriodsConfig.isScrolling = false;
    this.figureOutTimeLabels();
  }

  toggleDayView() {
    this.viewMode = ViewMode.DAILY;
    this.japaneseCandles = this.japaneseCandlesDays;

    this.timePeriodsConfig.rightMostPeriod = DateTime.now().set({minute:0, second:0, millisecond:0}).plus({days: 5});
    //TODO round the period down
    this.figureOutTimeLabels();
  }

  public showDebugInfo = true;
  toggleDebugInfo() {
    this.showDebugInfo = !this.showDebugInfo;
  }

  public candlesContainerConfig = {width: 0};
  @ViewChild('CandlesViewPort') public candlesViewPort!: ElementRef;
  /**
   *  Since we are iterating over all candles, we can determine the price bottom and top here
   * 
   * TODO keep only a subset of candles for viewing. Like 3 screens at a time (1 screen to the left, one to the right and one at the middle )
   * 
   * 
   * @param candles 
   */
  expandCandles(candles: Array<Candle>) {

    // Iterate over the candles once in order to determine the top and bottom prices
    for(let i=0; i<candles.length; i++) {
      let candle = candles[i];
      let priceTop = candle.condensed == true ? candle.priceClose : candle.priceTop;
      if(priceTop > this.priceTop)
        this.priceTop = priceTop;

      let priceBottom = candle.condensed == true ? candle.priceClose : candle.priceBottom;
      if(this.priceBottom == 0 || priceBottom < this.priceBottom)
        this.priceBottom = priceBottom;
    }

    

      this.changeDetectorRef.detectChanges();
      // setTimeout(()=>{
      //   // adjust candles' view port to display most recent price candles
        this.candlesViewPort?.nativeElement.scroll({
          left: this.candlesContainerConfig.width
        });

        console.clear();
        console.log("elementScrollLeft: "+this.candlesViewPort?.nativeElement.scrollLeft);
      //   this.repositionCandles();
      // }, 0);

      setTimeout(()=>{
        this.repositionCandles();
        this.timePeriodsConfig.keyCandle = this.japaneseCandles[this.japaneseCandles.length-1];
        this.timePeriodsConfig.keyCandle.isKey = true;
        this.alignCandlesWithTimePeriods();
        this.timePeriodsConfig.keyCandle.isKey = false;
      }, 0);

    this.figureOutPriceLabels();
  }

  repositionCandles() {
    const candles = this.japaneseCandles;

    const containerBoundingBox = this.candlesContainerNative!.getBoundingClientRect();
    let pixelPriceRatio = containerBoundingBox.height / (this.priceTop - this.priceBottom);

    let now = DateTime.now();
    // let currentHour = now.getUTCHours();
    // let candleOffset = 0;
    for(let i=0; i<candles.length; i++) {
      let candle = candles[i];  
      let candleDate = DateTime.fromMillis(candle.timestamp).set({minute:0, second:0, millisecond:0});
      
      candle.dateTime = candleDate.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS);
      candle.timestamp = candleDate.toMillis();
      let hourDifference = Math.floor((now.toMillis() - candleDate.toMillis()) / 3600000);
      candle.offsetRight = hourDifference * this.timePeriodsConfig.periodPixelLength;

      // Because we receive japanese candles in ascending order, the first one is the furthest from the
      // right side of the view port. (Maybe candles should be transmitted in descending order - it makes more sense that way)
      if(i == 0) {
        this.candlesContainerConfig.width = candle.offsetRight + this.candleWidth;
      }

      if(true == candle.condensed) {
        candle.height = 25;
        candle.offsetTop = ((pixelPriceRatio * this.priceTop) - (candle.priceClose * pixelPriceRatio));
      }
    }
  }

  public priceLabels:Array<PriceLabel> = [];
  public candlesContainerNative!: HTMLElement|null;

  figureOutPriceLabelDivisibility(): number {
    let boundingBox = this.candlesContainerNative!.getBoundingClientRect();
    let pricePixelRatio = (this.priceTop - this.priceBottom) / boundingBox.height;

    //don't clutter price labels one next to the other. It's gonna appear confusing.
    let divisibility = this.priceLabelHeight*3*pricePixelRatio;

    // Price labels should be divisible by some nice round number, like 10, 100, etc.
    let divisibilityStrArr = divisibility.toString().split('.');
    // TODO nicely format other prices that have less than 2 digits on the left side of the decimal point.
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
    if(this.priceLabelHeight == 0 || this.priceTop == 0 || divisibility == 0 || divisibility == Infinity)
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

      //Don't display the latest label if it's going to be positioned too low. This also functions as the natural end of the loop
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

  public resizingFlangeConfig: ResizingFlange = {
    isResizing: false,
    volumeViewHeight: undefined,
    priceViewHeight: undefined,
    volumeViewPreviousHeight: 0,
    priceViewPreviousHeight: 0,
    mouseOrigin: 0,
  };

  @ViewChild('PriceView') public PriceView!: ElementRef;
  @ViewChild('VolumeView') public VolumeView!: ElementRef;


  resizingFlange_MouseDown(event: MouseEvent) {

    ((event as MouseEvent).currentTarget as HTMLElement).onpointermove = (e:PointerEvent)=>this.resizingFlange_PointerMove(e);
    ((event as MouseEvent).currentTarget as HTMLElement).setPointerCapture((event as PointerEvent).pointerId);

    this.resizingFlangeConfig.isResizing = true;
    const priceBBox = this.PriceView.nativeElement.getBoundingClientRect();
    this.resizingFlangeConfig.priceViewHeight = priceBBox.height+"px";
    this.resizingFlangeConfig.priceViewPreviousHeight = priceBBox.height;
    const volumeBBox = this.VolumeView.nativeElement.getBoundingClientRect();
    this.resizingFlangeConfig.volumeViewHeight = volumeBBox.height+"px";
    this.resizingFlangeConfig.volumeViewPreviousHeight = volumeBBox.height;
    this.resizingFlangeConfig.mouseOrigin = event.clientY;
  }

  resizingFlange_MouseUp(event: MouseEvent) {
    console.log("mouse up");
    this.resizingFlangeConfig.isResizing = false;

    ((event as MouseEvent).currentTarget as HTMLElement).onpointermove = null;
    ((event as MouseEvent).currentTarget as HTMLElement).releasePointerCapture((event as PointerEvent).pointerId);
  }


  resizingFlange_PointerMove(event: PointerEvent) {
    if(this.resizingFlangeConfig.isResizing == true) {

      let priceHeight = this.resizingFlangeConfig.priceViewPreviousHeight;
      let volumeHeight = this.resizingFlangeConfig.volumeViewPreviousHeight;
      if(event.clientY < this.resizingFlangeConfig.mouseOrigin) {
        priceHeight -= this.resizingFlangeConfig.mouseOrigin - event.clientY;
        volumeHeight += this.resizingFlangeConfig.mouseOrigin - event.clientY;

        if(priceHeight <= 60) // prevent making one of the panes impractically small
          return;

        this.resizingFlangeConfig.priceViewHeight = priceHeight.toString() + "px";
        this.resizingFlangeConfig.volumeViewHeight = volumeHeight.toString() + "px";
      }
      else {
        priceHeight += event.clientY - this.resizingFlangeConfig.mouseOrigin;
        volumeHeight -= event.clientY - this.resizingFlangeConfig.mouseOrigin;
        if(volumeHeight <= 60) // prevent making one of the panes impractically small
          return;

        this.resizingFlangeConfig.priceViewHeight = priceHeight.toString() + "px";
        this.resizingFlangeConfig.volumeViewHeight = volumeHeight.toString() + "px";
      }

      this.changeDetectorRef.detectChanges();
    }
  }

  determineKeyCandle(event: PointerEvent) {
    //let candle = document.querySelector(".JapaneseCandle:last-child");
    //this.japaneseCandles
    this.timePeriodsConfig.keyCandle = this.japaneseCandles[this.japaneseCandles.length-1];
    this.timePeriodsConfig.keyCandle.isKey = true;
  } 

  yieldNearest12oclock(dt: DateTime) {
    //const diff = dt.hour % 12;
    return dt.minus({hours: dt.hour % 12});
  }

  forceAlignCandlesWithTimePeriods() {
    this.timePeriodsConfig.rightMostOffset = 0;
    this.alignCandlesWithTimePeriods();
  }

  alignCandlesWithTimePeriods() {
    this.changeDetectorRef.detectChanges();
    const viewPortBox = this.candlesViewPort.nativeElement.getBoundingClientRect();
    const candle = document.querySelector(".JapaneseCandle.key");
    const candleTimestamp = parseInt(candle?.getAttribute("data-timestamp") || "0");
    const candleDateTime = DateTime.fromMillis(candleTimestamp);

    const candleBox = candle?.getBoundingClientRect();
    const verticalAxis = (candleBox!.x + Math.round(candleBox!.width/2)) - viewPortBox.x;

    // TODO align vertical axis to the center of time period. This means we would need to adjust rightMostOffset
    // TODO get new key candle every time the current one gets out of the screen

    const periodOffset = viewPortBox.width - verticalAxis - this.timePeriodsConfig.rightMostOffset;
    const rightMostOffsetAdjustment = periodOffset % this.timePeriodsConfig.periodPixelLength
    //this.timePeriodsConfig.rightMostOffset += rightMostOffsetAdjustment;
    const periodBelowCandle = Math.round(periodOffset / this.timePeriodsConfig.periodPixelLength);

    let periodDateTime = this.timePeriodsConfig.rightMostPeriod.minus({hours: periodBelowCandle});

    if(candleDateTime.toMillis() == periodDateTime.toMillis()) {
      // console.log("key period aligned to key candle");
    }
    else if(candleDateTime.toMillis() > periodDateTime.toMillis()) {
      let adjustmentPeriods = Math.ceil((candleDateTime.toMillis() - periodDateTime.toMillis()) / 3600000);

      this.timePeriodsConfig.rightMostPeriod = this.timePeriodsConfig.rightMostPeriod.plus({hours:adjustmentPeriods});
      // console.log("adjustmentPeriods: +"+adjustmentPeriods+
      // "; rightMostPeriod: "+this.timePeriodsConfig.rightMostPeriod.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)+
      // "; candle: "+candleDateTime.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS));
    }
    else /*if(candleDateTime.toMillis() < periodDateTime.toMillis())*/ {
      let adjustmentPeriods = Math.ceil((periodDateTime.toMillis() - candleDateTime.toMillis()) / 3600000);
      this.timePeriodsConfig.rightMostPeriod = this.timePeriodsConfig.rightMostPeriod.minus({hours:adjustmentPeriods});
      // console.log("adjustmentPeriods: -"+adjustmentPeriods+
      // "; rightMostPeriod: "+this.timePeriodsConfig.rightMostPeriod.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)+
      // "; candle: "+candleDateTime.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS));  
    }

    this.changeDetectorRef.detectChanges();
    this.figureOutTimeLabels();
  }

  priceVolume_MouseDown(event: PointerEvent) {
    this.timePeriodsConfig.isScrolling = true;
    this.timePeriodsConfig.scrollLeft = this.candlesViewPort?.nativeElement.scrollLeft;
    this.timePeriodsConfig.mouseOriginX = event.clientX;
    this.timePeriodsConfig.mouseOriginXViewPortScroll = event.clientX;

    ((event as MouseEvent).currentTarget as HTMLElement).onpointermove = (e:PointerEvent)=>this.priceVolume_ScrollSideways(e);
    ((event as MouseEvent).currentTarget as HTMLElement).setPointerCapture((event as PointerEvent).pointerId);

    this.determineKeyCandle(event);
    this.alignCandlesWithTimePeriods();
  }

  priceVolume_MouseUp(event: PointerEvent) {
    this.timePeriodsConfig.isScrolling = false;

    ((event as MouseEvent).currentTarget as HTMLElement).onpointermove = null;
    ((event as MouseEvent).currentTarget as HTMLElement).releasePointerCapture((event as PointerEvent).pointerId);
  
    setTimeout(()=> {
      this.alignCandlesWithTimePeriods();
      this.timePeriodsConfig.keyCandle.isKey = false;
    }, 200)

  }

  priceVolume_ScrollSideways(event: PointerEvent) {

    /* TODO generate and keep a candle for each period, regardless if there is price data
     * DONE sync periods (or the key/rightmost period) to a candle
     * DONE when crosshair is being displayed in one of the views (price view or volume view) display its
     *      vertical bar to the other view
     * DONE display crosshair's vertical bar aligned to time periods
     * 
     * BUG  Scrolling to the left doesn't work
     * 
     * BUG Pressing mouse button to start scrolling resets price view scroll
    */
    
    if(this.timePeriodsConfig.isScrolling == false) {
      return;
    }

      // TODO Try to do subpixel scrolling
      const maxScrollLeft = this.candlesViewPort?.nativeElement.scrollWidth - this.candlesViewPort?.nativeElement.clientWidth;
      let viewPortScroll = this.timePeriodsConfig.scrollLeft - (event.clientX - this.timePeriodsConfig.mouseOriginXViewPortScroll);
      //let viewPortScroll = maxScrollLeft - (event.clientX - this.timePeriodsConfig.mouseOriginXViewPortScroll);


      console.log("maxScrollLeft: "+maxScrollLeft+"; viewPortScroll: "+viewPortScroll);
      //return;
      if(viewPortScroll > maxScrollLeft) {
        //console.log("(underscroll) viewPortScroll: "+viewPortScroll+", maxScrollLeft: "+maxScrollLeft);
        return;
      } else if(viewPortScroll < 0) {
        //console.log("(overscroll) viewPortScroll: "+viewPortScroll+", maxScrollLeft: "+maxScrollLeft);
        return;
      }

      this.candlesViewPort?.nativeElement.scroll({
           left: viewPortScroll
      });

      let scroll = this.timePeriodsConfig.mouseOriginX - event.clientX;
      this.timePeriodsConfig.rightMostOffset = scroll;


      // Scrolling to the left
      if(this.timePeriodsConfig.rightMostOffset > this.timePeriodsConfig.periodPixelLength) {
        const difference = this.timePeriodsConfig.rightMostOffset - this.timePeriodsConfig.periodPixelLength;
        const periodDifference = Math.ceil(difference / Math.ceil(this.timePeriodsConfig.periodPixelLength));
        const roundedDiff = Math.ceil(difference);
        const offset = difference - roundedDiff;
        switch(this.viewMode) {
          case ViewMode.HOURLY:
            this.timePeriodsConfig.rightMostPeriod = this.timePeriodsConfig.rightMostPeriod.plus({hours: periodDifference});
            break;
        }
        this.timePeriodsConfig.rightMostOffset = -Math.ceil(offset);
        this.timePeriodsConfig.mouseOriginX = event.clientX - offset;
        this.timePeriodsConfig.rightMostLabelAtPeriod += periodDifference;
        if(this.timePeriodsConfig.rightMostLabelAtPeriod > this.timePeriodsConfig.periodsBetweenLabels) {
          this.timePeriodsConfig.rightMostLabelAtPeriod -= this.timePeriodsConfig.periodsBetweenLabels;
        }
      }
      // Scrolling to the right
      else if(this.timePeriodsConfig.rightMostOffset < -(this.timePeriodsConfig.periodPixelLength * this.timePeriodsConfig.periodsBetweenLabels)) {
        const difference = -this.timePeriodsConfig.rightMostOffset - this.timePeriodsConfig.periodPixelLength;
        const periodDifference = Math.ceil(difference / Math.ceil(this.timePeriodsConfig.periodPixelLength));
        const roundedDiff = Math.ceil(difference);
        const offset = difference - roundedDiff;
        switch(this.viewMode) {
          case ViewMode.HOURLY:
            this.timePeriodsConfig.rightMostPeriod = this.timePeriodsConfig.rightMostPeriod.minus({hours: periodDifference});
            break;
        }
        this.timePeriodsConfig.rightMostOffset = -Math.ceil(offset);
        this.timePeriodsConfig.mouseOriginX = event.clientX - offset;
        this.timePeriodsConfig.rightMostLabelAtPeriod += periodDifference;
        if(this.timePeriodsConfig.rightMostLabelAtPeriod > this.timePeriodsConfig.periodsBetweenLabels) {
          this.timePeriodsConfig.rightMostLabelAtPeriod -= this.timePeriodsConfig.periodsBetweenLabels;
        }
      }
      //this.figureOutTimeLabels();
      this.alignCandlesWithTimePeriods();
      this.changeDetectorRef.detectChanges();
  }

}

interface Candle {
  market: number,
  priceOpen: number,
  priceClose: number,
  timestamp: number,
  height: number,
  priceTop: number,
  offsetTop: number,
  offsetRight: number,
  dateTime: string,
  priceBottom: number
  condensed: boolean,
  isKey: boolean,
}

interface PriceVolume {
  isScrolling: boolean,
}

interface ResizingFlange {
  isResizing: boolean,
  volumeViewHeight: string|undefined,
  priceViewHeight: string|undefined,
  volumeViewPreviousHeight: number,
  priceViewPreviousHeight: number,
  mouseOrigin: number,
}

interface PriceLabel {
  text: string;
  value: number;
  invisible: boolean;
  right: number;
  top: number;
}

interface TimeLabel {
  text: string;
  value: number;
  invisible: boolean;
  left: number;
  top: number;
}

interface DateLabel {
  text: string;
  timestamp: DateTime|null;
  invisible: boolean;
  right: number;
  top: number;
}
