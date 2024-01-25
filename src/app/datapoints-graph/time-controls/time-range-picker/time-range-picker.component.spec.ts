import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeRangePickerComponent } from './time-range-picker.component';
import { CommonModule, CoreModule, FormsModule } from '@c8y/ngx-components';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { AnimationBuilder } from '@angular/animations';

describe('TimeRangePickerComponent', () => {
  let component: TimeRangePickerComponent;
  let fixture: ComponentFixture<TimeRangePickerComponent>;
  const dateFrom = new Date('2023-03-20T10:30:19.710Z');
  const dateTo = new Date('2023-03-20T11:00:19.710Z');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule.forRoot(),
        FormsModule,
        CoreModule,
        BsDropdownModule,
      ],
      declarations: [TimeRangePickerComponent],
      providers: [
        { provide: AnimationBuilder, useValue: { build: () => null } },
      ],
    });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(TimeRangePickerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should init form on changes', () => {
    // given
    component.timeRange = [dateFrom, dateTo];
    // when
    component.ngOnChanges();
    // then
    expect(component.form).toBeDefined();
    expect(component.fields).toBeDefined();
    expect(component.model).toEqual({
      fromDate: dateFrom.toISOString(),
      toDate: dateTo.toISOString(),
    });
  });

  it('applyDatetimeContext should emit changed time range', () => {
    // given
    const now = new Date();
    const lastMinute = new Date(now.valueOf() - 60_000);
    component.timeRange = [dateFrom, dateTo];
    component.ngOnChanges();
    fixture.detectChanges();
    jest.spyOn(component.timeRangeChange, 'emit');
    // when
    component.model = {
      fromDate: lastMinute.toISOString(),
      toDate: now.toISOString(),
    };
    fixture.detectChanges();
    component.applyDatetimeContext();
    // then
    expect(component.timeRangeChange.emit).toHaveBeenCalledWith([
      lastMinute,
      now,
    ]);
  });
});
