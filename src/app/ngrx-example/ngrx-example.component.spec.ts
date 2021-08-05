import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgrxExampleComponent } from './ngrx-example.component';

describe('NgrxExampleComponent', () => {
  let component: NgrxExampleComponent;
  let fixture: ComponentFixture<NgrxExampleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NgrxExampleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NgrxExampleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
