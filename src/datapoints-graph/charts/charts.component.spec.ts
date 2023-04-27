import {
  ComponentFixture,
  fakeAsync,
  flush,
  flushMicrotasks,
  TestBed,
  tick
} from '@angular/core/testing';
import { ChartsComponent } from './charts.component';
import {
  CommonModule,
  CoreModule,
  DismissAlertStrategy,
  DynamicComponentAlertAggregator,
  MeasurementRealtimeService
} from '@c8y/ngx-components';
import { NGX_ECHARTS_CONFIG, NgxEchartsModule } from 'ngx-echarts';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { ChartRealtimeService } from './chart-realtime.service';
import { ChartTypesService } from './chart-types.service';
import { EchartsOptionsService } from './echarts-options.service';
import { CustomMeasurementService } from './custom-measurements.service';
import { DatapointsGraphKPIDetails, DatapointWithValues } from '../model';
import { ECharts, EChartsOption } from 'echarts';
import { take } from 'rxjs/operators';
import { NEVER, of } from 'rxjs';
import { IResult, ISeries } from '@c8y/client';

const dateFrom = new Date('2023-03-20T10:30:19.710Z');
const dateTo = new Date('2023-03-20T11:00:19.710Z');
const dp: DatapointsGraphKPIDetails = {
  fragment: 'c8y_Temperature',
  series: 'T',
  __active: true,
  __target: { id: 1 }
};

describe('ChartsComponent', () => {
  let component: ChartsComponent;
  let fixture: ComponentFixture<ChartsComponent>;
  let customMeasurementServiceMock;
  let echartsOptionsServiceMock;
  let chartRealtimeServiceMock;
  let dataZoomCallback;
  let echartsInstance;

  const originalResizeObserver = window.ResizeObserver;
  const originalCetComputedStyle = window.getComputedStyle;

  beforeAll(() => {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    window.ResizeObserver = ResizeObserverMock;
    const getComputedStyleMock = () => ({
      getPropertyValue: _ => {
        return 1;
      }
    });
    window.getComputedStyle = getComputedStyleMock as any;
  });

  afterAll(() => {
    window.ResizeObserver = originalResizeObserver;
    window.getComputedStyle = originalCetComputedStyle;
  });

  beforeEach(async () => {
    customMeasurementServiceMock = {
      listSeries$: () =>
        of({
          data: {
            values: {
              [dateFrom.toISOString()]: [{ min: 1, max: 1 }],
              [dateTo.toISOString()]: [{ min: 5, max: 5 }]
            }
          }
        } as IResult<ISeries>)
    } as any as CustomMeasurementService;
    echartsOptionsServiceMock = {
      getChartOptions: jest.fn().mockName('getChartOptions')
    };
    chartRealtimeServiceMock = {
      stopRealtime: jest.fn().mockName('stopRealtime'),
      startRealtime: jest.fn().mockName('startRealtime')
    };
    echartsInstance = {
      on(eventName, cb) {
        dataZoomCallback = cb;
      },
      getOption() {
        return {
          dataZoom: [{ startValue: dateFrom.valueOf(), endValue: dateTo.valueOf() }]
        };
      },
      dispatchAction() {}
    } as any as ECharts;

    await TestBed.configureTestingModule({
      imports: [
        CommonModule.forRoot(),
        ChartsComponent,
        CoreModule,
        NgxEchartsModule,
        TooltipModule,
        PopoverModule
      ],
      declarations: [],
      providers: [
        { provide: window, useValue: { ResizeObserver: {} } },
        {
          provide: NGX_ECHARTS_CONFIG,
          useFactory: () => ({ echarts: () => import('echarts') })
        },
        ChartRealtimeService,
        MeasurementRealtimeService,
        ChartTypesService,
        EchartsOptionsService,
        CustomMeasurementService
      ]
    });
    TestBed.overrideProvider(CustomMeasurementService, {
      useValue: customMeasurementServiceMock
    });
    TestBed.overrideProvider(EchartsOptionsService, { useValue: echartsOptionsServiceMock });
    TestBed.overrideProvider(ChartRealtimeService, { useValue: chartRealtimeServiceMock });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(ChartsComponent);

    component = fixture.componentInstance;
    component.config = { datapoints: [dp], dateFrom, dateTo, interval: 'custom' };
    component.alerts = new DynamicComponentAlertAggregator();
    spyOn(component.alerts, 'setAlertGroupDismissStrategy');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should set alerts dismiss strategy', () => {
    fixture.detectChanges();
    expect(component.alerts.setAlertGroupDismissStrategy).toHaveBeenCalledWith(
      'warning',
      DismissAlertStrategy.TEMPORARY_OR_PERMANENT
    );
  });

  describe('chartOption$', () => {
    it('should emit null when there are no active datapoints', fakeAsync(() => {
      // given
      let result: EChartsOption;
      component.config = { datapoints: [] };
      component.chartOption$.pipe(take(1)).subscribe(val => (result = val));
      // when
      component.ngOnChanges();
      tick();
      // then
      expect(result).toBeNull();
    }));

    it('should invoke EchartsOptionsService getChartOptions and clear alerts when there are active datapoints', fakeAsync(() => {
      // given
      spyOn(component.alerts, 'clear');
      // when
      fixture.detectChanges();
      tick();
      // then
      expect(echartsOptionsServiceMock.getChartOptions).toHaveBeenCalled();
      expect(component.alerts.clear).toHaveBeenCalled();
    }));

    it('should restart realtime', fakeAsync(() => {
      // given
      component.config = { ...component.config, realtime: true };
      component.echartsInstance = {} as any;
      spyOn(echartsOptionsServiceMock, 'getChartOptions').and.returnValue(of({}));
      spyOn(component, 'onChartInit');
      // when
      fixture.detectChanges();
      tick();
      // then
      expect(chartRealtimeServiceMock.stopRealtime).toHaveBeenCalled();
      expect(chartRealtimeServiceMock.startRealtime).toHaveBeenCalled();
    }));

    it('should add empty value at the beginning of chart and add warning alert when data is truncated', fakeAsync(() => {
      // given
      let datapointsWithValues: DatapointWithValues[];
      spyOn(customMeasurementServiceMock, 'listSeries$').and.returnValue(
        of({
          data: {
            truncated: true,
            values: {
              '2023-03-20T10:31:19.710Z': [{ min: 1, max: 1 }],
              '2023-03-20T10:32:19.710Z': [{ min: 5, max: 5 }]
            }
          }
        } as any as IResult<ISeries>)
      );
      spyOn(echartsOptionsServiceMock, 'getChartOptions').and.callFake(vals => {
        datapointsWithValues = vals;
      });
      // when
      fixture.detectChanges();
      tick();
      // then
      expect(Object.keys(datapointsWithValues[0].values).length).toBe(3);
      const currentAlerts = component.alerts.alertGroups.find(a => a.type === 'warning').value
        .alerts;
      expect(currentAlerts.length).toBe(1);
    }));

    it('should get proper timeRange when global time context is enabled', fakeAsync(() => {
      // given
      let timeRange: { dateFrom: string; dateTo: string };
      spyOn(echartsOptionsServiceMock, 'getChartOptions').and.callFake((_, calculatedTimeRange) => {
        timeRange = calculatedTimeRange;
      });
      component.config = { ...component.config, widgetInstanceGlobalTimeContext: true };
      // when
      fixture.detectChanges();
      tick();
      // then
      expect(timeRange.dateFrom).toBe('2023-03-20T10:30:19.710Z');
      expect(timeRange.dateTo).toBe('2023-03-20T11:00:19.710Z');
    }));

    it('should get proper timeRange when interval is "custom" and realtime is off', fakeAsync(() => {
      // given
      let timeRange: { dateFrom: string; dateTo: string };
      spyOn(echartsOptionsServiceMock, 'getChartOptions').and.callFake((_, calculatedTimeRange) => {
        timeRange = calculatedTimeRange;
      });
      component.config = { ...component.config, interval: 'custom', realtime: false };
      // when
      fixture.detectChanges();
      tick();
      // then
      expect(timeRange.dateFrom).toBe('2023-03-20T10:30:19.710Z');
      expect(timeRange.dateTo).toBe('2023-03-20T11:00:19.710Z');
    }));

    it('should get proper timeRange for interval', fakeAsync(() => {
      // given
      let timeRange: { dateFrom: string; dateTo: string };
      spyOn(echartsOptionsServiceMock, 'getChartOptions').and.callFake((_, calculatedTimeRange) => {
        timeRange = calculatedTimeRange;
      });
      component.config = { ...component.config, interval: 'hours', realtime: false };
      // when
      fixture.detectChanges();
      tick();
      // then
      expect(timeRange.dateFrom).not.toEqual(component.config.dateFrom.toISOString());
      expect(timeRange.dateTo).not.toEqual(component.config.dateTo.toISOString());
      expect(new Date(timeRange.dateTo).valueOf() - new Date(timeRange.dateFrom).valueOf()).toEqual(
        3600_000
      ); // time span is one hour in milliseconds
    }));

    it('should get proper timeRange when realtime is on', fakeAsync(() => {
      // given
      let timeRange: { dateFrom: string; dateTo: string };
      spyOn(echartsOptionsServiceMock, 'getChartOptions').and.callFake((_, calculatedTimeRange) => {
        timeRange = calculatedTimeRange;
      });
      component.config = { ...component.config, interval: 'custom', realtime: true };
      // when
      fixture.detectChanges();
      tick();
      // then
      const calculatedDatesDiff =
        new Date(timeRange.dateTo).valueOf() - new Date(timeRange.dateFrom).valueOf();
      const configDatesDiff =
        new Date(component.config.dateTo).valueOf() - new Date(component.config.dateFrom).valueOf();
      expect(configDatesDiff).toEqual(calculatedDatesDiff);
    }));

    it('should get proper timeRange when interval is "custom", realtime is off and padding is declared', fakeAsync(() => {
      // given
      let timeRange: { dateFrom: string; dateTo: string };
      spyOn(customMeasurementServiceMock, 'listSeries$').and.callFake(options => {
        timeRange = { dateFrom: options.dateFrom, dateTo: options.dateTo };
        return NEVER;
      });
      component.config = { ...component.config, interval: 'custom', realtime: false };
      // when
      fixture.detectChanges();
      tick();
      // then
      expect(timeRange.dateFrom).toBe('2023-03-20T10:29:19.710Z');
      expect(timeRange.dateTo).toBe('2023-03-20T11:01:19.710Z');
    }));
  });

  describe('onChartInit', () => {
    it('should handle echarts initialization when realtime is true', fakeAsync(() => {
      // given
      spyOn(chartRealtimeServiceMock, 'startRealtime');
      component.config = { ...component.config, realtime: true };
      fixture.detectChanges();
      // when
      component.onChartInit(echartsInstance);
      // then
      expect(component.echartsInstance).toBe(echartsInstance);
      expect(chartRealtimeServiceMock.startRealtime).toHaveBeenCalledTimes(1);
      flush();
    }));

    it('should handle echarts initialization when realtime is false', () => {
      // given
      spyOn(chartRealtimeServiceMock, 'startRealtime');
      component.config = { ...component.config, realtime: false };
      fixture.detectChanges();
      // when
      component.onChartInit(echartsInstance);
      // then
      expect(component.echartsInstance).toBe(echartsInstance);
      expect(chartRealtimeServiceMock.startRealtime).not.toHaveBeenCalled();
    });

    it('should update zoom state on echarts initialization', fakeAsync(() => {
      // given
      component.config = { ...component.config, realtime: false };
      fixture.detectChanges();
      // when
      component.onChartInit(echartsInstance);
      // then
      expect(component.zoomHistory.length).toBe(0);
      flushMicrotasks();
      expect(component.zoomHistory.length).toBe(1);
      flush();
    }));

    it('should update zoom state on zoom event', fakeAsync(() => {
      // given
      component.config = { ...component.config, realtime: false };
      fixture.detectChanges();
      // when
      component.onChartInit(echartsInstance);
      tick();
      dataZoomCallback({ batch: [{ from: 0 }] });
      // then
      expect(component.zoomHistory.length).toBe(2);
      expect(chartRealtimeServiceMock.stopRealtime).toHaveBeenCalled();
    }));
  });

  it('toggleZoomIn', () => {
    // given
    spyOn(echartsInstance, 'dispatchAction');
    component.onChartInit(echartsInstance);
    // when
    component.toggleZoomIn();
    // then
    expect(component.zoomInActive).toBe(true);
    expect(echartsInstance.dispatchAction).toHaveBeenCalledWith({
      type: 'takeGlobalCursor',
      key: 'dataZoomSelect',
      dataZoomSelectActive: true
    });
  });

  describe('zoomOut', () => {
    it("should toggle zoomInActive when it's true", fakeAsync(() => {
      // given
      component.zoomInActive = true;
      component.onChartInit(echartsInstance);
      flushMicrotasks();
      // when
      component.zoomOut();
      // then
      expect(component.zoomInActive).toBe(false);
    }));

    it('after zooming in, it should zoom out to previous, known state', fakeAsync(() => {
      // given
      spyOn(echartsInstance, 'dispatchAction');
      // when
      component.onChartInit(echartsInstance);
      flushMicrotasks();
      component.zoomHistory.push({
        startValue: dateFrom.valueOf() + 60_000,
        endValue: dateTo.valueOf() - 60_000
      });
      expect(component.zoomHistory).toHaveLength(2);

      component.zoomOut();
      // then
      expect(component.echartsInstance.dispatchAction).toHaveBeenCalledWith({
        type: 'dataZoom',
        startValue: dateFrom.valueOf(),
        endValue: dateTo.valueOf()
      });
      expect(component.zoomHistory).toHaveLength(1);
    }));

    it('after zooming in, it should zoom out to initial state and start realtime', fakeAsync(() => {
      // given
      spyOn(echartsInstance, 'dispatchAction');
      component.config = { ...component.config, realtime: true };
      // when
      component.onChartInit(echartsInstance);
      flushMicrotasks();
      component.zoomHistory.push({
        startValue: dateFrom.valueOf() + 60_000,
        endValue: dateTo.valueOf() - 60_000
      });
      expect(component.zoomHistory).toHaveLength(2);

      component.zoomOut();
      // then
      expect(component.echartsInstance.dispatchAction).toHaveBeenCalledWith({
        type: 'dataZoom',
        startValue: dateFrom.valueOf(),
        endValue: dateTo.valueOf()
      });
      expect(component.zoomHistory).toHaveLength(1);
      expect(chartRealtimeServiceMock.startRealtime).toHaveBeenCalled();
    }));

    it('it should zoom out from initial state and change config time range', fakeAsync(() => {
      // given
      const currentTimeSpanInMs = dateTo.valueOf() - dateFrom.valueOf();
      spyOn(component.configChangeOnZoomOut, 'emit');
      component.onChartInit(echartsInstance);
      flushMicrotasks();
      // when
      component.zoomOut();
      tick();
      // then
      expect(component.zoomHistory).toHaveLength(1);
      expect(component.zoomHistory[0].startValue).toBe(
        dateFrom.valueOf() - currentTimeSpanInMs / 2
      );
      expect(component.zoomHistory[0].endValue).toBe(dateTo.valueOf() + currentTimeSpanInMs / 2);
      expect(component.configChangeOnZoomOut.emit).toHaveBeenCalledWith({
        dateFrom: new Date(component.zoomHistory[0].startValue),
        dateTo: new Date(component.zoomHistory[0].endValue),
        interval: 'custom'
      });
    }));
  });
});
