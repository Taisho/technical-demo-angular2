import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, OnInit, AfterViewInit, ViewChild, ViewChildren, QueryList, ElementRef,
  ChangeDetectorRef } from '@angular/core';
import { DateTime } from "luxon";
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
    this.timePeriodsConfig.timeWidth = bbox.width;
    bbox = timeLabel[1].getBoundingClientRect();
    this.timePeriodsConfig.dateWidth = bbox.width;
  }

  onPriceChartResize(entries: ResizeObserverEntry[], observer: ResizeObserver) {
    let entry = entries[entries.length-1];
    this.figureOutPriceLabels();

    //this.repositionCandles();
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

    //const priceVeiwNative = document.querySelector(".PriceVolumeView") as HTMLElement;
    const containerBoundingBox = this.candlesContainerNative!.getBoundingClientRect();
    let pixelPriceRatio = (this.priceTop - this.priceBottom) / containerBoundingBox.height;
    //const priceViewBoundingBox = priceVeiwNative.getBoundingClientRect();

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

  // figureOutTimeLabelDivisibility(): number {
  //   //let boundingBox = this.candlesViewPort!.nativeElement.getBoundingClientRect();
  //   //let timePixelRatio = (this.priceTop - this.priceBottom) / boundingBox.height; // .... 

  //   //don't clutter labels one next to the other. It's gonna appear confusing. 
  //   let divisibility = 0;// = this.timeLabelWidth*3;
  //   // switch() {

  //   // }

  //   // Price labels should be divisible by some nice round number, like 10, 100, etc.
  //   // let divisibilityStrArr = divisibility.toString().split('.');
  //   // // TODO nicely format other prices that have less than 2 digits on the left side of the decimal point.
  //   // if(divisibilityStrArr.length == 2) {
  //   //   if(divisibilityStrArr[0].length > 1) {
  //   //     let divisibilityStr = divisibilityStrArr[0].charAt(0)+"0".repeat(divisibilityStrArr[0].length-1);
  //   //     divisibility = parseInt(divisibilityStr);
  //   //   }
  //   // }

  //   return divisibility;
  // }

  public timePeriodsConfig  = {
    //these two get calculated from determineTimeLabelWidth()
    timeWidth: 0, //the width of labels displaying time
    dateWidth: 0, //the width of labels displaying dates

    periodPixelLength: 5, // length of a period in pixels
    rightMostPeriod: null as unknown as DateTime,
    rightMostOffset:0, // how much the right most period is scrolled in pixels. Positive value indicate offset to the left, negative one to the right
    //periods: [] as Object[],
    rightMostLabelAtPeriod: 0, // HERE
    periodsBetweenLabels: NaN,
    initialRightMostLabelAtPeriod: NaN, //unused; obsolete
    mouseOriginX: 0,
    isScrolling: false,

  }


  //public timeLabelWidth = 0;
  public figureOutTimeLabels() {
    /*
        TODO render labels relative to the rightmost period
        TODO rendering while scrolling and rendering while still are different

        TODO Remove the bug of changing hours in time labels when adding new labels
             to the right

        TODO Remove labels to the left when scrolling in the opposite direction

        TODO 

        TODO Remove the bug in which the scroll offset (rightMostOffset) gets reset


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

    let labelCenter = 0;// = this.timePeriodsConfig.timeWidth/2 + this.timePeriodsConfig.rightMostOffset;
    if(false == this.timePeriodsConfig.isScrolling){
      labelCenter = this.timePeriodsConfig.timeWidth/2 + this.timePeriodsConfig.rightMostOffset;
      console.log("labelCenter: "+labelCenter+"; periodPixelLength: "+this.timePeriodsConfig.periodPixelLength+"; rightMostOffset: "+this.timePeriodsConfig.rightMostOffset);
      const period = Math.round((labelCenter / this.timePeriodsConfig.periodPixelLength) - (this.timePeriodsConfig.rightMostOffset/this.timePeriodsConfig.periodPixelLength));
      this.timePeriodsConfig.rightMostLabelAtPeriod = period;
      // if(NaN == this.timePeriodsConfig.initialRightMostLabelAtPeriod) {
      //   this.timePeriodsConfig.initialRightMostLabelAtPeriod
      // }
    }
    else {
      labelCenter = (this.timePeriodsConfig.rightMostLabelAtPeriod * this.timePeriodsConfig.periodPixelLength) +
      this.timePeriodsConfig.periodPixelLength / 2 + this.timePeriodsConfig.rightMostOffset;
      //console.log("labelCenter: "+labelCenter);
    }


    // let labelCenter = this.timePeriodsConfig.timeWidth/2 + this.timePeriodsConfig.rightMostOffset;
    // if(this.timePeriodsConfig.isScrolling) {
    //   labelCenter = (this.timePeriodsConfig.rightMostLabelAtPeriod * this.timePeriodsConfig.periodPixelLength) +
    //   this.timePeriodsConfig.periodPixelLength / 2 + this.timePeriodsConfig.rightMostOffset;
    //   console.log("labelCenter: "+);
    // }

    do {
      // the center of the label needs to be aligned to the center of the time period.
      const period = Math.ceil((labelCenter / this.timePeriodsConfig.periodPixelLength) - (this.timePeriodsConfig.rightMostOffset/this.timePeriodsConfig.periodPixelLength));
      if(Number.isNaN(this.timePeriodsConfig.initialRightMostLabelAtPeriod) == false &&
        Number.isNaN(this.timePeriodsConfig.periodsBetweenLabels)) {
          console.log("rightMostLabelAtPeriod: ", this.timePeriodsConfig.rightMostLabelAtPeriod);
          this.timePeriodsConfig.periodsBetweenLabels = period - this.timePeriodsConfig.rightMostLabelAtPeriod;
      }

      if(Number.isNaN(this.timePeriodsConfig.initialRightMostLabelAtPeriod)) {
        console.log("rightMostLabelAtPeriod: ", this.timePeriodsConfig.initialRightMostLabelAtPeriod);
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

      // TODO remove this condition after the method is bug free
      if(counter > 100)
        break;
      
    } while(true);
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

    this.timePeriodsConfig.rightMostPeriod = DateTime.now().set({minute:0, second:0, millisecond:0}).plus({hours: 5});
    //TODO round the period down
    this.figureOutTimeLabels();
  }

  toggleDayView() {
    this.viewMode = ViewMode.DAILY;
    this.japaneseCandles = this.japaneseCandlesDays;

    this.timePeriodsConfig.rightMostPeriod = DateTime.now().set({minute:0, second:0, millisecond:0}).plus({days: 5});
    //TODO round the period down
    this.figureOutTimeLabels();
  }

  public candlesContainerConfig = {width: 0};
  @ViewChild('CandlesViewPort') public candlesViewPort!: ElementRef;
  /**
   *  Since we are iterating over all candles, we can determine the price bottom and top here
   * 
   * @param candles 
   */
  expandCandles(candles: Array<any>) {

    const containerBoundingBox = this.candlesContainerNative!.getBoundingClientRect();
    let pixelPriceRatio = containerBoundingBox.height / (this.priceTop - this.priceBottom);

    let now = new Date();
    let currentHour = now.getUTCHours();
    let candleOffset = 0;
    for(let i=0; i<candles.length; i++) {
      let candle = candles[i];
      let candleDate = new Date(candle.timestamp);
      let mday:string|number = candleDate.getUTCDate(); mday = mday < 10 ? "0"+mday : mday.toString();
      let month:string|number = candleDate.getUTCMonth(); month = month < 10 ? "0"+month : month.toString();
      //let hour:string|number = candleDate.getUTCHours();
      

      candle.dateTime = month+"/"+mday;
      let hourDifference = Math.floor((now.getTime() - candleDate.getTime()) / 3600000);
      candle.offsetRight = hourDifference * this.candleWidth;

      // Because we receive japanese candles in ascending order, the first one is the furthest from the
      // right side of the view port. (Maybe candles should be transmitted in descending order. It makes more sense that way)
      // if(i == 0) {
      //   this.candlesContainerConfig.width = candle.offsetRight + this.candleWidth;
      // }

      let priceTop = candle.condensed == true ? candle.priceClose : candle.priceTop;
      if(priceTop > this.priceTop)
        this.priceTop = priceTop;

      let priceBottom = candle.condensed == true ? candle.priceClose : candle.priceBottom;
      if(this.priceBottom == 0 || priceBottom < this.priceBottom)
        this.priceBottom = priceBottom;

      if(true == candle.condensed) {
        candle.height = 1;
        candle.offsetTop = ((pixelPriceRatio * this.priceTop) - (candle.priceClose * pixelPriceRatio));
      }
      
    }

      
      // setTimeout(()=>{
      //   // adjust candles' view port to display most recent price candles
      //   this.candlesViewPort?.nativeElement.scroll({
      //     left: this.candlesContainerConfig.width
      //   });

      //   this.repositionCandles();
      // }, 0);

    this.figureOutPriceLabels();
  }

  // repositionCandles() {
  //   const candles = this.japaneseCandles;
  //   let boundingBox = this.candlesContainerNative!.getBoundingClientRect();
  //   if(boundingBox == null) {
  //     console.error("repositionCandles: candlesViewPort's boundingBox is null!");
  //   }

  //   let pricePixelRatio = boundingBox.height / (this.priceTop - this.priceBottom);
  //   for(let i=0; i<candles.length; i++) {
  //     let candle = candles[i];
  //     if(candle.condensed == true)
  //       candle.offsetTop = boundingBox.height - (candle.priceClose * pricePixelRatio);
  //   }
  // }

  public priceLabels:Array<PriceLabel> = [];
  public candlesContainerNative!: HTMLElement|null;

  figureOutPriceLabelDivisibility(): number {
    let boundingBox = this.candlesContainerNative!.getBoundingClientRect();
    let pricePixelRatio = (this.priceTop - this.priceBottom) / boundingBox.height;

    //don't clutter price labels one next to the other. It's gonna appear confusing. Here we assume 
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

        if(priceHeight <= 60) // prevent making the one of the panes impractically small
          return;

        this.resizingFlangeConfig.priceViewHeight = priceHeight.toString() + "px";
        this.resizingFlangeConfig.volumeViewHeight = volumeHeight.toString() + "px";
      }
      else {
        priceHeight += event.clientY - this.resizingFlangeConfig.mouseOrigin;
        volumeHeight -= event.clientY - this.resizingFlangeConfig.mouseOrigin;
        if(volumeHeight <= 60) // prevent making the one of the panes impractically small
          return;

        this.resizingFlangeConfig.priceViewHeight = priceHeight.toString() + "px";
        this.resizingFlangeConfig.volumeViewHeight = volumeHeight.toString() + "px";
      }

      this.changeDetectorRef.detectChanges();
    }
  }

  priceVolume_MouseDown(event: PointerEvent) {
    this.timePeriodsConfig.isScrolling = true;
    this.timePeriodsConfig.mouseOriginX = event.clientX;

    ((event as MouseEvent).currentTarget as HTMLElement).onpointermove = (e:PointerEvent)=>this.priceVolume_PointerMove(e);
    ((event as MouseEvent).currentTarget as HTMLElement).setPointerCapture((event as PointerEvent).pointerId);
  }

  priceVolume_MouseUp(event: PointerEvent) {
    this.timePeriodsConfig.isScrolling = false;

    ((event as MouseEvent).currentTarget as HTMLElement).onpointermove = null;
    ((event as MouseEvent).currentTarget as HTMLElement).releasePointerCapture((event as PointerEvent).pointerId);
  }

  // priceVolume_PointerMove(event: PointerEvent) {
  //   if(this.timePeriodsConfig.isScrolling == true) {
  //     this.timePeriodsConfig.rightMostOffset = this.timePeriodsConfig.mouseOriginX - event.clientX;
  //     if(this.timePeriodsConfig.rightMostOffset > (this.timePeriodsConfig.timeWidth/2) + (this.timePeriodsConfig.timeWidth*2)
  //       /*this.timePeriodsConfig.periodPixelLength*/) {
  //       const difference = this.timePeriodsConfig.rightMostOffset - this.timePeriodsConfig.periodPixelLength;
  //       const periodDifference = Math.ceil(difference / this.timePeriodsConfig.periodPixelLength);
  //       const roundedDiff = Math.ceil(difference);
  //       const offset = difference - roundedDiff;
  //       // console.log("rightMostOffset: "+this.timePeriodsConfig.rightMostOffset+"; difference: "+difference+
  //       //            "; roundedDiff: "+roundedDiff+"; offset: "+offset+"; periodDifference: "+periodDifference);
  //       switch(this.viewMode) {
  //         case ViewMode.HOURLY:
  //           // console.log("rightMostPeriod: "+this.timePeriodsConfig.rightMostPeriod);
  //           this.timePeriodsConfig.rightMostPeriod = this.timePeriodsConfig.rightMostPeriod.plus({hours: periodDifference});
  //           // console.log("rightMostPeriod: "+this.timePeriodsConfig.rightMostPeriod);
  //           this.timePeriodsConfig.rightMostOffset = -offset;
  //           this.timePeriodsConfig.mouseOriginX = event.clientX - offset;
  //           // console.log("rightMostOffset: "+offset);
  //           break;

  //       }
  //     }
  //     this.figureOutTimeLabels();
  //     this.changeDetectorRef.detectChanges();
  //   }
  // }

  priceVolume_PointerMove(event: PointerEvent) {
    if(this.timePeriodsConfig.isScrolling == true) {
      this.timePeriodsConfig.rightMostOffset = this.timePeriodsConfig.mouseOriginX - event.clientX;
      if(this.timePeriodsConfig.rightMostOffset > this.timePeriodsConfig.periodPixelLength) {
        const difference = this.timePeriodsConfig.rightMostOffset - this.timePeriodsConfig.periodPixelLength;
        const periodDifference = Math.ceil(difference / this.timePeriodsConfig.periodPixelLength);
        const roundedDiff = Math.ceil(difference);
        const offset = difference - roundedDiff;
        // console.log("rightMostOffset: "+this.timePeriodsConfig.rightMostOffset+"; difference: "+difference+
        //            "; roundedDiff: "+roundedDiff+"; offset: "+offset+"; periodDifference: "+periodDifference);
        switch(this.viewMode) {
          case ViewMode.HOURLY:
            // console.log("rightMostPeriod: "+this.timePeriodsConfig.rightMostPeriod);
            this.timePeriodsConfig.rightMostPeriod = this.timePeriodsConfig.rightMostPeriod.plus({hours: periodDifference});
            // console.log("rightMostPeriod: "+this.timePeriodsConfig.rightMostPeriod);
            this.timePeriodsConfig.rightMostOffset = -offset;
            this.timePeriodsConfig.mouseOriginX = event.clientX - offset;
            this.timePeriodsConfig.rightMostLabelAtPeriod += periodDifference;
            console.log("periodPixelLength: "+this.timePeriodsConfig.periodPixelLength+"; rightMostOffset: "+this.timePeriodsConfig.rightMostOffset);
            //console.log(this.timePeriodsConfig.periodsBetweenLabels);
            if(this.timePeriodsConfig.rightMostLabelAtPeriod > this.timePeriodsConfig.periodsBetweenLabels) {
              this.timePeriodsConfig.rightMostLabelAtPeriod -= this.timePeriodsConfig.periodsBetweenLabels;
            }
            // console.log("rightMostOffset: "+offset);
            break;
        }
      }
      this.figureOutTimeLabels();
      this.changeDetectorRef.detectChanges();
    }
  }

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

interface DateLabel {
  text: string;
  timestamp: DateTime|null;
  invisible: boolean;
  right: number;
  top: number;
}
