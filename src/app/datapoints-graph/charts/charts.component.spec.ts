import {
  ComponentFixture,
  fakeAsync,
  flush,
  flushMicrotasks,
  TestBed,
  tick,
} from '@angular/core/testing';
import { ChartsComponent } from './charts.component';
import {
  CommonModule,
  CoreModule,
  DismissAlertStrategy,
  DynamicComponentAlertAggregator,
  MeasurementRealtimeService,
} from '@c8y/ngx-components';
import { NGX_ECHARTS_CONFIG, NgxEchartsModule } from 'ngx-echarts';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { ChartRealtimeService } from './chart-realtime.service';
import { ChartTypesService } from './chart-types.service';
import { EchartsOptionsService } from './echarts-options.service';
import { CustomMeasurementService } from './custom-measurements.service';
import {
  DatapointsGraphKPIDetails,
  DatapointsGraphWidgetConfig,
  DatapointWithValues,
} from '../model';
import { ECharts, EChartsOption } from 'echarts';
import { take } from 'rxjs/operators';
import { of } from 'rxjs';
import { IResult, ISeries } from '@c8y/client';
import { Component, ViewChild } from '@angular/core';
import { ChartEventsService } from '../datapoints-graph-view/chart-events.service';
import { ChartAlarmsService } from '../datapoints-graph-view/chart-alarms.service';

const dateFrom = new Date('2023-03-20T10:30:19.710Z');
const dateTo = new Date('2023-03-20T11:00:19.710Z');
const dp: DatapointsGraphKPIDetails = {
  fragment: 'c8y_Temperature',
  series: 'T',
  __active: true,
  __target: { id: 1 },
};

@Component({
  selector: 'charts-wrapper',
  template: `<c8y-charts [config]="config" [alerts]="alerts"></c8y-charts>`,
  styles: [
    `
      :host {
        width: 1000px;
        heigth: 500px;
      }
    `,
  ],
})
export class ChartsWrapperComponent {
  config: DatapointsGraphWidgetConfig = {
    datapoints: [dp],
    dateFrom,
    dateTo,
    interval: 'custom',
  };
  alerts = new DynamicComponentAlertAggregator();

  @ViewChild(ChartsComponent) chartsComponent!: ChartsComponent;
}

fdescribe('ChartsComponent', () => {
  let hostComponent: ChartsWrapperComponent;
  let fixture: ComponentFixture<ChartsWrapperComponent>;
  let component: ChartsComponent;
  let customMeasurementServiceMock: CustomMeasurementService;
  let echartsOptionsServiceMock: EchartsOptionsService;
  let chartRealtimeServiceMock: ChartRealtimeService;
  let dataZoomCallback: (_: any) => any;
  let echartsInstance: ECharts;

  const originalResizeObserver = window.ResizeObserver;
  const originalCetComputedStyle = window.getComputedStyle;

  beforeAll(() => {
    class ResizeObserverMock {
      observe = jest.fn().mockName('observe').mockImplementation();
      unobserve = jest.fn().mockName('unobserve').mockImplementation();
      disconnect = jest.fn().mockName('disconnect').mockImplementation();
    }
    window.ResizeObserver = ResizeObserverMock;
    const getComputedStyleMock = () => ({
      getPropertyValue: (_: any) => {
        return 1;
      },
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
              [dateTo.toISOString()]: [{ min: 5, max: 5 }],
            },
          },
        } as IResult<ISeries>),
    } as any as CustomMeasurementService;
    echartsOptionsServiceMock = {
      getChartOptions: jest.fn().mockName('getChartOptions'),
    } as any as EchartsOptionsService;
    chartRealtimeServiceMock = {
      stopRealtime: jest.fn().mockName('stopRealtime'),
      startRealtime: jest.fn().mockName('startRealtime'),
    } as any as ChartRealtimeService;
    echartsInstance = {
      on(_: any, cb: () => any) {
        if (_ === 'dataZoom') {
          dataZoomCallback = cb;
        }
      },
      getOption() {
        return {
          dataZoom: [
            { startValue: dateFrom.valueOf(), endValue: dateTo.valueOf() },
          ],
        };
      },
      dispatchAction: jest.fn().mockName('dispatchAction').mockImplementation(),
    } as any as ECharts;

    await TestBed.configureTestingModule({
      imports: [
        CommonModule.forRoot(),
        ChartsComponent,
        CoreModule,
        NgxEchartsModule,
        TooltipModule,
        PopoverModule,
      ],
      declarations: [ChartsWrapperComponent],
      providers: [
        { provide: window, useValue: { ResizeObserver: {} } },
        {
          provide: NGX_ECHARTS_CONFIG,
          useFactory: () => ({ echarts: () => import('echarts') }),
        },
        ChartRealtimeService,
        MeasurementRealtimeService,
        ChartTypesService,
        EchartsOptionsService,
        CustomMeasurementService,
        ChartEventsService,
        ChartAlarmsService,
      ],
    });
    TestBed.overrideProvider(CustomMeasurementService, {
      useValue: customMeasurementServiceMock,
    });
    TestBed.overrideProvider(EchartsOptionsService, {
      useValue: echartsOptionsServiceMock,
    });
    TestBed.overrideProvider(ChartRealtimeService, {
      useValue: chartRealtimeServiceMock,
    });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(ChartsWrapperComponent);
    fixture.detectChanges();
    hostComponent = fixture.componentInstance;
    component = hostComponent.chartsComponent;
    jest.spyOn(component.alerts, 'setAlertGroupDismissStrategy');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should set alerts dismiss strategy', () => {
    // when
    component.ngOnInit();
    // then
    expect(component.alerts.setAlertGroupDismissStrategy).toHaveBeenCalledWith(
      'warning',
      DismissAlertStrategy.TEMPORARY_OR_PERMANENT
    );
  });

  describe('chartOption$', () => {
    it('should emit null when there are no active datapoints', fakeAsync(() => {
      // given
      let result: EChartsOption | null = null;
      component.config = { datapoints: [] };
      component.chartOption$.pipe(take(1)).subscribe((val) => (result = val));
      // when
      component.ngOnChanges();
      tick();
      // then
      expect(result).toBeNull();
    }));

    it('should invoke EchartsOptionsService getChartOptions and clear alerts when there are active datapoints', (done) => {
      // given
      const spy = jest.spyOn(component.alerts, 'clear');

      component.chartOption$.subscribe(() => {
        expect(echartsOptionsServiceMock.getChartOptions).toHaveBeenCalled();
        expect(spy).toHaveBeenCalled();
        done();
      });

      // when
      component.ngOnChanges();
    });

    it('should restart realtime', (done) => {
      // given
      component.config = { ...component.config, realtime: true };
      component.echartsInstance = {} as any;
      jest
        .spyOn(echartsOptionsServiceMock, 'getChartOptions')
        .mockReturnValue({});
      jest.spyOn(component, 'onChartInit').mockImplementation();

      component.chartOption$.subscribe(() => {
        expect(chartRealtimeServiceMock.stopRealtime).toHaveBeenCalled();
        expect(chartRealtimeServiceMock.startRealtime).toHaveBeenCalled();
        done();
      });
      // when
      component.ngOnChanges();
    });

    it('should add empty value at the beginning of chart and add warning alert when data is truncated', (done) => {
      // given
      let datapointsWithValues: DatapointWithValues[] = [];
      jest.spyOn(customMeasurementServiceMock, 'listSeries$').mockReturnValue(
        of({
          data: {
            truncated: true,
            values: {
              '2023-03-20T10:31:19.710Z': [{ min: 1, max: 1 }],
              '2023-03-20T10:32:19.710Z': [{ min: 5, max: 5 }],
            },
          },
        } as any as IResult<ISeries>)
      );
      jest
        .spyOn(echartsOptionsServiceMock, 'getChartOptions')
        .mockImplementation((vals: any) => (datapointsWithValues = vals));
      jest.spyOn(component, 'onChartInit').mockImplementation();

      component.chartOption$.subscribe(() => {
        expect(Object.keys(datapointsWithValues[0].values).length).toBe(3);
        const currentAlerts = component.alerts.alertGroups.find(
          (a) => a.type === 'warning'
        )?.value.alerts;
        expect(currentAlerts?.length).toBe(1);
        done();
      });
      // when
    });

    it('should get proper timeRange when global time context is enabled', (done) => {
      // given
      let timeRange: { dateFrom: string; dateTo: string } = {
        dateFrom: '',
        dateTo: '',
      };
      jest
        .spyOn(echartsOptionsServiceMock, 'getChartOptions')
        .mockImplementation(
          (_, calculatedTimeRange: any) => (timeRange = calculatedTimeRange)
        );
      jest.spyOn(component, 'onChartInit').mockImplementation();
      component.config = {
        ...component.config,
        widgetInstanceGlobalTimeContext: true,
      };

      component.chartOption$.subscribe(() => {
        expect(timeRange.dateFrom).toBe('2023-03-20T10:30:19.710Z');
        expect(timeRange.dateTo).toBe('2023-03-20T11:00:19.710Z');
        done();
      });
      // when
      component.ngOnChanges();
    });

    it('should get proper timeRange when interval is "custom" and realtime is off', (done) => {
      // given
      let timeRange: { dateFrom: string; dateTo: string } = {
        dateFrom: '',
        dateTo: '',
      };
      jest
        .spyOn(echartsOptionsServiceMock, 'getChartOptions')
        .mockImplementation(
          (_, calculatedTimeRange: any) => (timeRange = calculatedTimeRange)
        );
      jest.spyOn(component, 'onChartInit').mockImplementation();
      component.config = {
        ...component.config,
        interval: 'custom',
        realtime: false,
      };

      component.chartOption$.subscribe(() => {
        expect(timeRange.dateFrom).toBe('2023-03-20T10:30:19.710Z');
        expect(timeRange.dateTo).toBe('2023-03-20T11:00:19.710Z');
        done();
      });
      // when
      component.ngOnChanges();
    });

    it('should get proper timeRange for interval', (done) => {
      // given
      let timeRange: { dateFrom: string; dateTo: string } = {
        dateFrom: '',
        dateTo: '',
      };
      jest
        .spyOn(echartsOptionsServiceMock, 'getChartOptions')
        .mockImplementation(
          (_, calculatedTimeRange: any) => (timeRange = calculatedTimeRange)
        );
      jest.spyOn(component, 'onChartInit').mockImplementation();
      component.config = {
        ...component.config,
        interval: 'hours',
        realtime: false,
      };

      component.chartOption$.subscribe(() => {
        expect(timeRange.dateFrom).not.toEqual(
          component.config.dateFrom?.toISOString()
        );
        expect(timeRange.dateTo).not.toEqual(
          component.config.dateTo?.toISOString()
        );
        expect(
          new Date(timeRange.dateTo).valueOf() -
            new Date(timeRange.dateFrom).valueOf()
        ).toEqual(3600_000); // time span is one hour in milliseconds
        done();
      });
      // when
      component.ngOnChanges();
    });

    it('should get proper timeRange when realtime is on', (done) => {
      // given
      let timeRange: { dateFrom: string; dateTo: string } = {
        dateFrom: '',
        dateTo: '',
      };
      jest
        .spyOn(echartsOptionsServiceMock, 'getChartOptions')
        .mockImplementation(
          (_, calculatedTimeRange: any) => (timeRange = calculatedTimeRange)
        );
      jest.spyOn(component, 'onChartInit').mockImplementation();
      component.config = {
        ...component.config,
        interval: 'custom',
        realtime: true,
      };

      component.chartOption$.subscribe(() => {
        const calculatedDatesDiff =
          new Date(timeRange.dateTo).valueOf() -
          new Date(timeRange.dateFrom).valueOf();
        const configDatesDiff =
          new Date(component.config?.dateTo as Date).valueOf() -
          new Date(component.config?.dateFrom as Date).valueOf();
        expect(configDatesDiff).toEqual(calculatedDatesDiff);
        done();
      });
      // when
      component.ngOnChanges();
    });

    it('should get proper timeRange when interval is "custom", realtime is off and padding is declared', (done) => {
      // given
      let timeRange: { dateFrom: string; dateTo: string };
      jest
        .spyOn(customMeasurementServiceMock, 'listSeries$')
        .mockImplementation((options: any) => {
          timeRange = { dateFrom: options.dateFrom, dateTo: options.dateTo };
          return of({ data: { values: null } } as any);
        });
      component.config = {
        ...component.config,
        interval: 'custom',
        realtime: false,
      };

      component.chartOption$.subscribe(() => {
        expect(timeRange?.dateFrom).toBe('2023-03-20T10:29:19.710Z');
        expect(timeRange?.dateTo).toBe('2023-03-20T11:01:19.710Z');
        done();
      });
      // when
      component.ngOnChanges();
    });
  });

  describe('onChartInit', () => {
    it('should handle echarts initialization when realtime is true', fakeAsync(() => {
      // given
      jest.spyOn(chartRealtimeServiceMock, 'startRealtime');
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
      jest.spyOn(chartRealtimeServiceMock, 'startRealtime');
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

    it('should update zoom state on zoom event', (done) => {
      // given
      jest.spyOn(console, 'error').mockImplementation();
      component.config = { ...component.config, realtime: false };
      fixture.detectChanges();
      // when
      component.onChartInit(echartsInstance);
      dataZoomCallback({ batch: [{ from: 0 }] });

      // then
      queueMicrotask(() => {
        expect(component.zoomHistory.length).toBe(2);
        expect(chartRealtimeServiceMock.stopRealtime).toHaveBeenCalled();
        done();
      });
    });
  });

  it('toggleZoomIn', () => {
    // given
    jest.spyOn(echartsInstance, 'dispatchAction');
    component.onChartInit(echartsInstance);
    // when
    component.toggleZoomIn();
    // then
    expect(component.zoomInActive).toBe(true);
    expect(echartsInstance.dispatchAction).toHaveBeenCalledWith({
      type: 'takeGlobalCursor',
      key: 'dataZoomSelect',
      dataZoomSelectActive: true,
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
      jest.spyOn(echartsInstance, 'dispatchAction');
      // when
      component.onChartInit(echartsInstance);
      flushMicrotasks();
      component.zoomHistory.push({
        startValue: dateFrom.valueOf() + 60_000,
        endValue: dateTo.valueOf() - 60_000,
      });
      expect(component.zoomHistory).toHaveLength(2);

      component.zoomOut();
      // then
      expect(component.echartsInstance.dispatchAction).toHaveBeenCalledWith({
        type: 'dataZoom',
        startValue: dateFrom.valueOf(),
        endValue: dateTo.valueOf(),
      });
      expect(component.zoomHistory).toHaveLength(1);
    }));

    it('after zooming in, it should zoom out to initial state and start realtime', fakeAsync(() => {
      // given
      jest.spyOn(echartsInstance, 'dispatchAction');
      component.config = { ...component.config, realtime: true };
      // when
      component.onChartInit(echartsInstance);
      flushMicrotasks();
      component.zoomHistory.push({
        startValue: dateFrom.valueOf() + 60_000,
        endValue: dateTo.valueOf() - 60_000,
      });
      expect(component.zoomHistory).toHaveLength(2);

      component.zoomOut();
      // then
      expect(component.echartsInstance.dispatchAction).toHaveBeenCalledWith({
        type: 'dataZoom',
        startValue: dateFrom.valueOf(),
        endValue: dateTo.valueOf(),
      });
      expect(component.zoomHistory).toHaveLength(1);
      expect(chartRealtimeServiceMock.startRealtime).toHaveBeenCalled();
    }));

    it('it should zoom out from initial state and change config time range', fakeAsync(() => {
      // given
      const currentTimeSpanInMs = dateTo.valueOf() - dateFrom.valueOf();
      jest.spyOn(component.configChangeOnZoomOut, 'emit');
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
      expect(component.zoomHistory[0].endValue).toBe(
        dateTo.valueOf() + currentTimeSpanInMs / 2
      );
      expect(component.configChangeOnZoomOut.emit).toHaveBeenCalledWith({
        dateFrom: new Date(component.zoomHistory[0].startValue),
        dateTo: new Date(component.zoomHistory[0].endValue),
        interval: 'custom',
      });
    }));
  });
});
