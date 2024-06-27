import { ChartRealtimeService } from './chart-realtime.service';
import { TestBed } from '@angular/core/testing';
import { ECharts } from 'echarts';
import { DatapointsGraphKPIDetails } from '../model';
import { interval, timer } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { IMeasurement } from '@c8y/client';
import {
  AlarmRealtimeService,
  EventRealtimeService,
  MeasurementRealtimeService,
} from '@c8y/ngx-components';
import { EchartsOptionsService } from './echarts-options.service';

describe('ChartRealtimeService', () => {
  let service: ChartRealtimeService;
  let measurementRealtime: MeasurementRealtimeService;
  let eventRealtime: EventRealtimeService;
  let alarmRealtime: AlarmRealtimeService;
  const dp1: DatapointsGraphKPIDetails = {
    fragment: 'c8y_Temperature',
    series: 'T',
    __active: true,
    __target: { id: 1 },
  };

  const dp2: DatapointsGraphKPIDetails = {
    fragment: 'c8y_Temperature',
    series: 'T',
    __active: true,
    __target: { id: 2 },
  };
  const echartsInstance = {
    getOption: jest
      .fn()
      .mockName('getOption')
      .mockReturnValue({
        series: [
          {
            datapointId: dp1.__target?.id + dp1.fragment + dp1.series,
            data: [],
          },
        ],
      }),
    setOption: jest.fn().mockName('setOption'),
  } as any as ECharts;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChartRealtimeService,
        { provide: MeasurementRealtimeService, useValue: {} },
        { provide: EventRealtimeService, useValue: {} },
        { provide: AlarmRealtimeService, useValue: {} },
        { provide: EchartsOptionsService, useValue: {} },
      ],
    });
    service = TestBed.inject(ChartRealtimeService);
    measurementRealtime = TestBed.inject(MeasurementRealtimeService);
    eventRealtime = TestBed.inject(EventRealtimeService);
    alarmRealtime = TestBed.inject(AlarmRealtimeService);

    measurementRealtime.onCreateOfSpecificMeasurement$ = jest
      .fn()
      .mockName('onCreateOfSpecificMeasurement$');
    eventRealtime.onAll$ = jest.fn().mockName('onAll$');
    alarmRealtime.onAll$ = jest.fn().mockName('onAll$');
  });

  afterEach(() => {
    service.stopRealtime();
  });

  it('should exist', () => {
    expect(service).toBeTruthy();
  });

  it('should trigger trigger range callback', () => {
    jest.useFakeTimers();
    const now = new Date();
    const lastMinute = new Date(now.valueOf() - 60_000);
    jest.spyOn(echartsInstance, 'setOption').mockImplementation();
    jest
      .spyOn(measurementRealtime, 'onCreateOfSpecificMeasurement$')
      .mockReturnValue(
        interval(1000).pipe(
          take(4),
          map(
            (i) =>
              ({
                [dp1.fragment]: { [dp1.series]: { value: i } },
              }) as IMeasurement
          )
        )
      );
    const timeRangeCallback = jest.fn();
    // when
    service.startRealtime(
      echartsInstance,
      [dp1],
      { dateFrom: lastMinute.toISOString(), dateTo: now.toISOString() },
      jest.fn(),
      timeRangeCallback,
      []
    );
    jest.advanceTimersByTime(3000);
    // then
    expect(timeRangeCallback).toHaveBeenCalledTimes(3);
  });

  describe('get proper throttle time', () => {
    it('should set throttle minimum value', () => {
      jest.useFakeTimers();
      const now = new Date();
      const lastMinute = new Date(now.valueOf() - 60_000);
      let counter = 0;
      jest.spyOn(echartsInstance, 'setOption').mockImplementation(() => {
        counter += 1;
      });
      jest
        .spyOn(measurementRealtime, 'onCreateOfSpecificMeasurement$')
        .mockReturnValue(
          interval(150).pipe(
            take(3),
            map(
              (i) =>
                ({
                  [dp1.fragment]: { [dp1.series]: { value: i } },
                }) as IMeasurement
            )
          )
        );
      // when
      expect(counter).toBe(0);
      service.startRealtime(
        echartsInstance,
        [dp1],
        { dateFrom: lastMinute.toISOString(), dateTo: now.toISOString() },
        jest.fn(),
        jest.fn(),
        []
      );
      expect(counter).toBe(0);
      // first measurement emits
      jest.advanceTimersByTime(250);
      expect(counter).toBe(1);
      // another two measurements emits, but are throttled, so setOption is called once, not twice
      jest.advanceTimersByTime(250);
      expect(counter).toBe(2);
    });

    it('should set throttle calculated value', () => {
      jest.useFakeTimers();
      const now = new Date();
      const last10Minutes = new Date(now.valueOf() - 10 * 60_000); // throttle time should be 600
      let counter = 0;
      jest.spyOn(echartsInstance, 'setOption').mockImplementation(() => {
        counter += 1;
      });
      jest
        .spyOn(measurementRealtime, 'onCreateOfSpecificMeasurement$')
        .mockReturnValue(
          interval(250).pipe(
            take(4),
            map(
              (i) =>
                ({
                  [dp1.fragment]: { [dp1.series]: { value: i } },
                }) as IMeasurement
            )
          )
        );
      // when
      expect(counter).toBe(0);
      service.startRealtime(
        echartsInstance,
        [dp1],
        { dateFrom: last10Minutes.toISOString(), dateTo: now.toISOString() },
        jest.fn(),
        jest.fn(),
        []
      );
      expect(counter).toBe(0);
      // first measurement emitted
      jest.advanceTimersByTime(250);
      expect(counter).toBe(1);
      // second and third measurements are emitted
      jest.advanceTimersByTime(600);
      // fourth measurement is emitted which resets buffer
      jest.advanceTimersByTime(250);
      expect(counter).toBe(2);
    });

    it('should set throttle maximum value', () => {
      jest.useFakeTimers();
      const now = new Date();
      const lastWeek = new Date(now.valueOf() - 60_000 * 60 * 24 * 7);
      let counter = 0;
      jest.spyOn(echartsInstance, 'setOption').mockImplementation(() => {
        counter += 1;
      });
      jest
        .spyOn(measurementRealtime, 'onCreateOfSpecificMeasurement$')
        .mockReturnValue(
          interval(1000).pipe(
            take(7),
            map(
              (i) =>
                ({
                  [dp1.fragment]: { [dp1.series]: { value: i } },
                }) as IMeasurement
            )
          )
        );
      // when
      expect(counter).toBe(0);
      service.startRealtime(
        echartsInstance,
        [dp1],
        { dateFrom: lastWeek.toISOString(), dateTo: now.toISOString() },
        jest.fn(),
        jest.fn(),
        []
      );
      expect(counter).toBe(0);
      // first measurement emitted
      jest.advanceTimersByTime(1000);
      expect(counter).toBe(1);
      // another measurements are emitted
      jest.advanceTimersByTime(5_000);
      // last one measurement is emitted to reset buffer
      jest.advanceTimersByTime(1000);
      expect(counter).toBe(2);
    });
  });

  describe('handle data series', () => {
    it('add values to data series', () => {
      jest.useFakeTimers();
      const now = new Date();
      const lastMinute = new Date(now.valueOf() - 60_000);
      let option;
      jest
        .spyOn(echartsInstance, 'setOption')
        .mockImplementation((val) => (option = val));
      jest.spyOn(echartsInstance, 'getOption').mockReturnValue({
        series: [
          {
            datapointId: dp1.__target?.id + dp1.fragment + dp1.series,
            data: [],
          },
          {
            datapointId: dp2.__target?.id + dp2.fragment + dp2.series,
            data: [],
          },
        ],
      });
      jest
        .spyOn(measurementRealtime, 'onCreateOfSpecificMeasurement$')
        .mockImplementation((fragment, series, _) =>
          interval(250).pipe(
            take(3),
            map(
              (i) =>
                ({
                  [fragment]: { [series]: { value: i } },
                  time: new Date().toISOString(),
                }) as IMeasurement
            )
          )
        );
      // when
      service.startRealtime(
        echartsInstance,
        [dp1, dp2],
        { dateFrom: lastMinute.toISOString(), dateTo: now.toISOString() },
        jest.fn(),
        jest.fn(),
        []
      );
      jest.advanceTimersByTime(750);
      expect(option.series[0].data.length).toBe(3);
      expect(option.series[1].data.length).toBe(3);
    });

    it('should remove values before time range except one closes to dateFrom', () => {
      jest.useFakeTimers();
      const now = new Date();
      const lastMinute = new Date(now.valueOf() - 60_000);
      let option;
      jest
        .spyOn(echartsInstance, 'setOption')
        .mockImplementation((val) => (option = val));
      jest.spyOn(echartsInstance, 'getOption').mockReturnValue({
        series: [
          {
            datapointId: dp1.__target?.id + dp1.fragment + dp1.series,
            data: [],
          },
        ],
      });
      jest
        .spyOn(measurementRealtime, 'onCreateOfSpecificMeasurement$')
        .mockImplementation((fragment, series, _) =>
          interval(1000).pipe(
            // take more measurements than it's possible to fit in 1 minute time span
            take(70),
            map(
              (i) =>
                ({
                  [fragment]: { [series]: { value: i } },
                  time: new Date().toISOString(),
                }) as IMeasurement
            )
          )
        );
      // when
      service.startRealtime(
        echartsInstance,
        [dp1],
        { dateFrom: lastMinute.toISOString(), dateTo: now.toISOString() },
        jest.fn(),
        jest.fn(),
        []
      );
      // time to fill whole chart with more than time span of 1 minute of measurements with interval of 1s
      jest.advanceTimersByTime(70_000);
      // then
      const currentDateFrom = option.xAxis.min;
      // first element out of time range (before dateFrom) should not be removed to maintain graph continuity
      const firstElementTime = option.series[0].data[0][0];
      expect(new Date(firstElementTime) < currentDateFrom).toBe(true);
      // second element should be in time range
      const secondElementTime = option.series[0].data[1][0];
      expect(new Date(secondElementTime) >= currentDateFrom).toBe(true);
    });

    it('should trigger out of sync callback when value is out of sync', () => {
      jest.useFakeTimers();
      const now = new Date();
      const lastMinute = new Date(now.valueOf() - 60_000);
      jest.spyOn(echartsInstance, 'setOption').mockImplementation();
      jest.spyOn(echartsInstance, 'getOption').mockReturnValue({
        series: [
          {
            datapointId: dp1.__target?.id + dp1.fragment + dp1.series,
            data: [],
          },
        ],
      });
      jest
        .spyOn(measurementRealtime, 'onCreateOfSpecificMeasurement$')
        .mockImplementation((fragment, series, _) =>
          timer(0, 250).pipe(
            take(2),
            map(
              (i) =>
                ({
                  [fragment]: { [series]: { value: i } },
                  // pass date from future
                  time: new Date(now.valueOf() + 1000).toISOString(),
                }) as IMeasurement
            )
          )
        );
      const callback = jest.fn();
      // when
      service.startRealtime(
        echartsInstance,
        [dp1],
        { dateFrom: lastMinute.toISOString(), dateTo: now.toISOString() },
        callback,
        jest.fn(),
        []
      );
      jest.advanceTimersByTime(250);
      expect(callback).toHaveBeenCalledWith(dp1);
    });
  });
});
