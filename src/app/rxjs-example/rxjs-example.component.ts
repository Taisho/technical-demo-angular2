import { Component, OnInit } from '@angular/core';
import { ajax } from 'rxjs/ajax';
import { map, catchError } from 'rxjs/operators';
import { Subscriber, from, of, defer, fromEvent, interval, bindCallback, Observable } from 'rxjs';

@Component({
  selector: 'app-rxjs-example',
  templateUrl: './rxjs-example.component.html',
  styleUrls: ['./rxjs-example.component.css']
})
export class RxjsExampleComponent implements OnInit {

  //ARTICLE? observable generated by fromEvent seems to allow mutliple subscribers, while those created with manually seem to allow
  //only a single observer
  clicks$ = fromEvent(document, 'click');;
  constructor() {
    console.log("clicks$ Observable:", this.clicks$);
  }

  //ARTICLE an observabl is very similar to a promise

  map_() {

    this.clicks$.subscribe({
      next: function (ev: any){
        console.log((ev as MouseEvent).clientX)
      }
    });
    //ARTICLE The Peculiarity of RxJS conventions
    const mapFunc = map(ev => (ev as MouseEvent).clientX);
    //console.log(mapFunc);

    //const clicks = fromEvent(document, 'click');
    //As a stylistic matter, op()(obs) is never used, even if there is only one operator; obs.pipe(op()) is universally preferred.
    const positions$ =  mapFunc(this.clicks$);  //clicks.pipe(map(ev => (ev as MouseEvent).clientX));

    //const subscription = positions$.subscribe(x => console.log(x));
    //subscription.unsubscribe();
  }


  ngOnInit(): void {

  }

  bindCallback_() {
    // const someFunction = (cb:(n:number, n2:string, n3?:any)=>void)  => {
    //    cb(5, 'some string', {someProperty: 'someValue'})
    // };
    
    // const boundSomeFunction = bindCallback(someFunction);
    // boundSomeFunction(12, "10").subscribe(values => {
    //   console.log(values); // [22, 2]
    // });
  }

  defer_() {
    const clicksOrInterval = defer(function () {
      return Math.random() > 0.5
        ? fromEvent(document, 'click')
        : interval(1000);
    });
    clicksOrInterval.subscribe(x => console.log(x));
  }

  pushToSubscriber() {
    this.clickSubscriber.next("new value");
    if(this.counter >= 5) {
      this.clickSubscriber.complete();
    }
  }

  public counter = 0;
  public clickSubscriber!:Subscriber<any>;
  public observable$!:Observable<any>;
  Custom_Observable() {
    if(this.observable$ == null){
      this.observable$ = new Observable(subscriber => {
        this.clickSubscriber = subscriber;
        console.log("Custom Observable called: ", this.observable$);
      });

    }

    console.log("Subscription: ");
    this.observable$.subscribe({
      next: (value)=>console.log("next: ",value," ",this.counter++),
      error: (value)=>console.log("error: ",value," ",this.counter++),
      complete: ()=>console.log("complete: ",this.counter++),
    });
  }

  Observable_from () {
    // const array = ["1", "2", "3"];
    // const observable = from(array);

    // const observer = {
    //   next: x => console.log('Observer got a next value: ' + x),
    //   error: err => console.error('Observer got an error: ' + err),
    //   complete: () => console.log('Observer got a complete notification'),
    // };

    // observable.subscribe(x => console.log(x));
    // setTimeout(()=>{
    //   obs.next("new element");
    // }, 500)
  }

  //ARTICLE exhaustMap() is the antagonist of switchMap()
  //ARTICLE concatMap() is (almost) the same as mergeMap()




  ajax() {
    console.log("ajax");
    const obs$ = ajax(`https://api.github.com/users?per_page=5`).subscribe((value)=>{
      map(value => console.log('users: ', value)),
      catchError(error => {
        console.log('error: ', error);
        return of(error);
      })
    })
  }

}