import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeControlsComponent } from './time-controls.component';
import { CommonModule, CoreModule, FormsModule } from '@c8y/ngx-components';
import { TimeRangePickerComponent } from './time-range-picker/time-range-picker.component';
import { IntervalPickerComponent } from './interval-picker/interval-picker.component';
import { AggregationPickerComponent } from './aggregation-picker/aggregation-picker.component';
import { RealtimeControlComponent } from './realtime-control/realtime-control.component';
import { SimpleChanges } from '@angular/core';
import { aggregationType } from '@c8y/client';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

describe('TimeControlsComponent', () => {
  let component: TimeControlsComponent;
  let fixture: ComponentFixture<TimeControlsComponent>;

  const now = new Date();
  const lastMinute = new Date(now.valueOf() - 60_000);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule.forRoot(), FormsModule, CoreModule, TooltipModule],
      declarations: [
        TimeRangePickerComponent,
        IntervalPickerComponent,
        TimeControlsComponent,
        AggregationPickerComponent,
        RealtimeControlComponent,
      ],
    });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(TimeControlsComponent);
    component = fixture.componentInstance;
    component.config = {
      dateFrom: lastMinute,
      dateTo: now,
      datapoints: [],
      interval: 'custom',
    };
    jest.spyOn(component.configTimePropsChange, 'emit');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set disabledAggregations on init when config has no dateFrom and dateTo', () => {
    // given
    component.config.dateFrom = null;
    component.config.dateTo = null;
    // when
    fixture.detectChanges();
    // then
    expect(component.disabledAggregations).toEqual({});
  });

  describe('should set disabledAggregations on init', () => {
    it('when time range is less than one minute', () => {
      // given
      component.config.dateFrom = new Date(now.valueOf() - 30_000);
      // when
      fixture.detectChanges();
      // then
      expect(component.disabledAggregations).toEqual({
        DAILY: true,
        HOURLY: true,
        MINUTELY: true,
      });
    });

    it('when time range is last minute', () => {
      // given
      component.config.dateFrom = lastMinute;
      // when
      fixture.detectChanges();
      // then
      expect(component.disabledAggregations).toEqual({
        DAILY: true,
        HOURLY: true,
        MINUTELY: true,
      });
    });

    it('when time range is last hour', () => {
      // given
      component.config.dateFrom = new Date(now.valueOf() - 1000 * 60 * 60);
      // when
      fixture.detectChanges();
      // then
      expect(component.disabledAggregations).toEqual({
        DAILY: true,
        HOURLY: true,
        MINUTELY: false,
      });
    });

    it('when time range is last day', () => {
      // given
      component.config.dateFrom = new Date(now.valueOf() - 1000 * 60 * 60 * 24);
      // when
      fixture.detectChanges();
      // then
      expect(component.disabledAggregations).toEqual({
        DAILY: true,
        HOURLY: false,
        MINUTELY: false,
      });
    });

    it('when time range is last 3 days', () => {
      // given
      component.config.dateFrom = new Date(
        now.valueOf() - 1000 * 60 * 60 * 24 * 3
      );
      // when
      fixture.detectChanges();
      // then
      expect(component.disabledAggregations).toEqual({
        DAILY: false,
        HOURLY: false,
        MINUTELY: false,
      });
    });
  });

  describe('should set timeRange on changes', () => {
    it('when provided value is instance of Date', () => {
      // when
      component.ngOnChanges({
        config: {
          currentValue: {
            dateFrom: lastMinute,
            dateTo: now,
          },
        },
      } as any as SimpleChanges);
      // then
      expect(component.timeRange).toEqual([lastMinute, now]);
    });

    it('when provided value is date string', () => {
      // when
      component.ngOnChanges({
        config: {
          currentValue: {
            dateFrom: lastMinute.toISOString(),
            dateTo: now.toISOString(),
          },
        },
      } as any as SimpleChanges);
      // then
      expect(component.timeRange).toEqual([lastMinute, now]);
    });
  });

  describe('timeRangeChange', () => {
    it('should emit change config when aggregation control is disabled', () => {
      // given
      component.controlsAvailable = { aggregation: false };
      // when
      component.timeRangeChange([lastMinute, now]);
      // then
      expect(component.configTimePropsChange.emit).toHaveBeenCalledWith({
        interval: 'custom',
        dateFrom: lastMinute,
        dateTo: now,
      });
    });

    it(`should emit change config with aggregation of null and set disabledAggregations`, () => {
      // when
      component.timeRangeChange([lastMinute, now]);
      // then
      expect(component.configTimePropsChange.emit).toHaveBeenCalledWith({
        interval: 'custom',
        dateFrom: lastMinute,
        dateTo: now,
        aggregation: null,
      });
      expect(component.disabledAggregations).toEqual({
        DAILY: true,
        HOURLY: true,
        MINUTELY: true,
      });
    });

    it(`should emit change config with aggregation of "MINUTELY' and set disabledAggregations`, () => {
      // given
      const lastTenMinutes = new Date(now.valueOf() - 1000 * 60 * 10);
      // when
      component.timeRangeChange([lastTenMinutes, now]);
      // then
      expect(component.configTimePropsChange.emit).toHaveBeenCalledWith({
        interval: 'custom',
        dateFrom: lastTenMinutes,
        dateTo: now,
        aggregation: aggregationType.MINUTELY,
      });
      expect(component.disabledAggregations).toEqual({
        DAILY: true,
        HOURLY: true,
        MINUTELY: false,
      });
    });

    it(`should emit change config with aggregation of "HOURLY' and set disabledAggregations`, () => {
      // given
      const lastDay = new Date(now.valueOf() - 1000 * 60 * 60 * 24);
      // when
      component.timeRangeChange([lastDay, now]);
      // then
      expect(component.configTimePropsChange.emit).toHaveBeenCalledWith({
        interval: 'custom',
        dateFrom: lastDay,
        dateTo: now,
        aggregation: aggregationType.HOURLY,
      });
      expect(component.disabledAggregations).toEqual({
        DAILY: true,
        HOURLY: false,
        MINUTELY: false,
      });
    });

    it(`should emit change config with aggregation of "DAILY' and set disabledAggregations`, () => {
      // given
      const lastFourDays = new Date(now.valueOf() - 1000 * 60 * 60 * 24 * 4);
      // when
      component.timeRangeChange([lastFourDays, now]);
      // then
      expect(component.configTimePropsChange.emit).toHaveBeenCalledWith({
        interval: 'custom',
        dateFrom: lastFourDays,
        dateTo: now,
        aggregation: aggregationType.DAILY,
      });
      expect(component.disabledAggregations).toEqual({
        DAILY: false,
        HOURLY: false,
        MINUTELY: false,
      });
    });

    it(`should emit change config with unchanged aggregation and set disabledAggregations
    when current aggregation is not disabled`, () => {
      // given
      const lastDay = new Date(now.valueOf() - 1000 * 60 * 60 * 24);
      component.config.aggregation = aggregationType.MINUTELY;
      // when
      component.timeRangeChange([lastDay, now]);
      // then
      expect(component.configTimePropsChange.emit).toHaveBeenCalledWith({
        interval: 'custom',
        dateFrom: lastDay,
        dateTo: now,
        aggregation: aggregationType.MINUTELY,
      });
      expect(component.disabledAggregations).toEqual({
        DAILY: true,
        HOURLY: false,
        MINUTELY: false,
      });
    });
  });

  describe('intervalChange', () => {
    it('should emit interval when provided value is "custom"', () => {
      // when
      component.intervalChange('custom');
      // then
      expect(component.configTimePropsChange.emit).toHaveBeenCalledWith({
        interval: 'custom',
      });
    });

    it('should emit interval and calculate time range when provided value is "minutes"', () => {
      // given
      component.controlsAvailable.aggregation = false;

      jest.useFakeTimers();
      const expectedDateTo = new Date();
      const expectedDateFrom = new Date(expectedDateTo.valueOf() - 60_000);
      // when
      component.intervalChange('minutes');
      // then
      expect(component.configTimePropsChange.emit).toHaveBeenCalledWith({
        interval: 'minutes',
        dateFrom: expectedDateFrom,
        dateTo: expectedDateTo,
      });
    });

    it('should emit interval and calculate time range when provided value is "hours"', () => {
      // given
      component.controlsAvailable.aggregation = false;

      jest.useFakeTimers();
      const expectedDateTo = new Date();
      const expectedDateFrom = new Date(expectedDateTo.valueOf() - 60_000 * 60);
      // when
      component.intervalChange('hours');
      // then
      expect(component.configTimePropsChange.emit).toHaveBeenCalledWith({
        interval: 'hours',
        dateFrom: expectedDateFrom,
        dateTo: expectedDateTo,
      });
    });

    it('should emit interval and calculate time range when provided value is "days"', () => {
      // given
      component.controlsAvailable.aggregation = false;

      jest.useFakeTimers();
      const expectedDateTo = new Date();
      const expectedDateFrom = new Date(
        expectedDateTo.valueOf() - 60_000 * 60 * 24
      );
      // when
      component.intervalChange('days');
      // then
      expect(component.configTimePropsChange.emit).toHaveBeenCalledWith({
        interval: 'days',
        dateFrom: expectedDateFrom,
        dateTo: expectedDateTo,
      });
    });

    it('should emit interval and calculate time range when provided value is "weeks"', () => {
      // given
      component.controlsAvailable.aggregation = false;

      jest.useFakeTimers();
      const expectedDateTo = new Date();
      const expectedDateFrom = new Date(
        expectedDateTo.valueOf() - 60_000 * 60 * 24 * 7
      );
      // when
      component.intervalChange('weeks');
      // then
      expect(component.configTimePropsChange.emit).toHaveBeenCalledWith({
        interval: 'weeks',
        dateFrom: expectedDateFrom,
        dateTo: expectedDateTo,
      });
    });

    it('should emit interval and calculate time range when provided value is "months"', () => {
      // given
      component.controlsAvailable.aggregation = false;

      jest.useFakeTimers();
      const expectedDateTo = new Date();
      const todayDate = new Date(expectedDateTo.valueOf());
      const expectedDateFrom = new Date(
        todayDate.valueOf() -
          (todayDate.valueOf() -
            new Date(todayDate.setMonth(todayDate.getMonth() - 1)).valueOf())
      );
      // when
      component.intervalChange('months');
      // then
      expect(component.configTimePropsChange.emit).toHaveBeenCalledWith({
        interval: 'months',
        dateFrom: expectedDateFrom,
        dateTo: expectedDateTo,
      });
    });
  });

  it(`aggregationChange should emit config change with aggregation`, () => {
    // when
    component.aggregationChange(aggregationType.MINUTELY);
    // then
    expect(component.configTimePropsChange.emit).toHaveBeenCalledWith({
      aggregation: aggregationType.MINUTELY,
    });
  });

  it(`realtimeChange should emit config change with realtime and reset aggregation`, () => {
    // when
    component.realtimeChange(true);
    // then
    expect(component.configTimePropsChange.emit).toHaveBeenCalledWith({
      realtime: true,
      aggregation: null,
    });
  });
});
