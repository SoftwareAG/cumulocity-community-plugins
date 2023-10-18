import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { DatapointsGraphWidgetViewComponent } from './datapoints-graph-widget-view.component';
import {
  CommonModule,
  DateTimeContext,
  DynamicComponentAlertAggregator,
} from '@c8y/ngx-components';
import { TimeControlsModule } from '../time-controls';
import { ChartsComponent } from '../charts';
import {
  DatapointsGraphKPIDetails,
  DatapointsGraphWidgetConfig,
} from '../model';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { SimpleChanges } from '@angular/core';
import { FetchClient, Realtime } from '@c8y/client';

describe('DatapointsGraphWidgetViewComponent', () => {
  let component: DatapointsGraphWidgetViewComponent;
  let fixture: ComponentFixture<DatapointsGraphWidgetViewComponent>;
  const originalResizeObserver = window.ResizeObserver;
  let client: FetchClient;

  beforeAll(() => {
    class ResizeObserverMock {
      observe = jest.fn().mockName('observe').mockImplementation();
      unobserve = jest.fn().mockName('unobserve').mockImplementation();
      disconnect = jest.fn().mockName('disconnect').mockImplementation();
    }

    window.ResizeObserver = ResizeObserverMock;
  });

  afterAll(() => {
    window.ResizeObserver = originalResizeObserver;
  });

  beforeEach(async () => {
    client = {
      fetch: jest.fn().mockName('fetch').mockImplementation(),
    } as any as FetchClient;
    await TestBed.configureTestingModule({
      imports: [
        CommonModule.forRoot(),
        TimeControlsModule,
        ChartsComponent,
        TooltipModule,
      ],
      declarations: [DatapointsGraphWidgetViewComponent],
      providers: [
        { provide: window, useValue: { ResizeObserver: {} } },
        { provide: FetchClient, useValue: client },
        { provide: Realtime, useValue: {} },
      ],
    });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(DatapointsGraphWidgetViewComponent);
    component = fixture.componentInstance;
    component.alerts = new DynamicComponentAlertAggregator();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('config get/set', () => {
    it('set config should assign provided value to displayConfig by cloning it', () => {
      // given
      const config: DatapointsGraphWidgetConfig = { datapoints: [] };
      // when
      component.config = config;
      // then
      expect(component.displayConfig).not.toBe(config);
      expect(component.displayConfig).toEqual(config);
    });

    it('get config should throw an error when trying to access it', () => {
      // when
      const getConfig = () => {
        return component.config;
      };
      // then
      expect(getConfig).toThrow(
        '"config" property should not be referenced in view component to avoid mutating data.'
      );
    });
  });

  describe('ngOnChanges', () => {
    const dateFrom = new Date('2023-03-19T11:00:19.710Z');
    const dateTo = new Date('2023-03-20T11:00:19.710Z');

    const dashboardTimeRange: DateTimeContext = [
      new Date('2023-03-10T11:00:19.710Z'),
      new Date('2023-03-11T11:00:19.710Z'),
    ];

    it('should not change dateFrom nor dateTo when changed config has no "date" property', () => {
      // given
      const config: DatapointsGraphWidgetConfig = {
        datapoints: [],
        dateFrom,
        dateTo,
      };
      component.config = config;
      // when
      component.ngOnChanges({
        config: { currentValue: config },
      } as any as SimpleChanges);
      // then
      expect(component.displayConfig.dateFrom).toEqual(dateFrom);
      expect(component.displayConfig.dateTo).toEqual(dateTo);
    });

    it(`should not change dateFrom nor dateTo when changed config has "date" property
    but widgetInstanceGlobalTimeContext is false`, () => {
      // given
      const config: DatapointsGraphWidgetConfig = {
        datapoints: [],
        dateFrom,
        dateTo,
        date: dashboardTimeRange,
        widgetInstanceGlobalTimeContext: false,
      };
      component.config = config;
      // when
      component.ngOnChanges({
        config: { currentValue: config },
      } as any as SimpleChanges);
      // then
      expect(component.displayConfig.dateFrom).toEqual(dateFrom);
      expect(component.displayConfig.dateTo).toEqual(dateTo);
    });

    it(`should change dateFrom and dateTo when changed config has "date" property
    and widgetInstanceGlobalTimeContext is true`, fakeAsync(() => {
      // given
      const config: DatapointsGraphWidgetConfig = {
        datapoints: [],
        dateFrom,
        dateTo,
        date: dashboardTimeRange,
        widgetInstanceGlobalTimeContext: true,
      };
      component.config = config;
      fixture.detectChanges();
      // when
      component.ngOnChanges({
        config: { currentValue: config },
      } as any as SimpleChanges);
      tick();
      // then
      expect(component.displayConfig.dateFrom).toEqual(dashboardTimeRange[0]);
      expect(component.displayConfig.dateTo).toEqual(dashboardTimeRange[1]);
    }));
  });

  it('timePropsChanged should override displayConfig properties', fakeAsync(() => {
    // given
    const dateFrom = new Date('2023-03-19T11:00:19.710Z');
    const dateTo = new Date('2023-03-20T11:00:19.710Z');
    component.config = { datapoints: [], dateFrom: null, dateTo: null };
    fixture.detectChanges();
    // when
    component.timePropsChanged({ dateFrom, dateTo });
    tick();
    // then
    expect(component.displayConfig.dateFrom).toEqual(dateFrom);
    expect(component.displayConfig.dateTo).toEqual(dateTo);
  }));

  it('updateTimeRangeOnRealtime should override set form values but not change config', fakeAsync(() => {
    // given
    const dateFrom = new Date('2023-03-19T11:00:19.710Z');
    const dateTo = new Date('2023-03-20T11:00:19.710Z');
    component.config = { datapoints: [], dateFrom: null, dateTo: null };
    fixture.detectChanges();
    // when
    component.updateTimeRangeOnRealtime({ dateFrom, dateTo });
    tick();
    // then
    expect(component.displayConfig.dateFrom).toEqual(null);
    expect(component.displayConfig.dateTo).toEqual(null);
    expect(component.timeControlsFormGroup.value.dateFrom).toEqual(dateFrom);
    expect(component.timeControlsFormGroup.value.dateTo).toEqual(dateTo);
  }));

  it('toggleChart should toggle datapoint "__active" property', () => {
    // given
    const dp: DatapointsGraphKPIDetails = {
      fragment: 'c8y_Temperature',
      series: 'T',
      __active: true,
    };
    component.config = { datapoints: [dp] };
    const clonedDp = component.displayConfig.datapoints[0];
    // when
    component.toggleChart(clonedDp);
    // then
    expect(clonedDp.__active).toBe(false);
  });

  it('toggleChart should set toolboxDisabled to true if no data points are active', () => {
    // given
    const dp: DatapointsGraphKPIDetails = {
      fragment: 'c8y_Temperature',
      series: 'T',
      __active: true,
    };
    component.config = { datapoints: [dp] };
    const clonedDp = component.displayConfig.datapoints[0];
    // when
    component.toggleChart(clonedDp);
    // then
    expect(component.toolboxDisabled).toBe(true);
  });

  it('toggleChart should set toolboxDisabled to false if there are active data points', () => {
    // given
    const dp: DatapointsGraphKPIDetails = {
      fragment: 'c8y_Temperature',
      series: 'T',
      __active: false,
    };
    component.config = { datapoints: [dp] };
    const clonedDp = component.displayConfig.datapoints[0];
    // when
    component.toggleChart(clonedDp);
    // then
    expect(component.toolboxDisabled).toBe(false);
  });

  it('handleDatapointOutOfSync should add datapoint to datapointsOutOfSync', () => {
    // given
    const dp: DatapointsGraphKPIDetails = {
      fragment: 'c8y_Temperature',
      series: 'T',
      __active: true,
      __target: { id: '1' },
    };
    component.config = { datapoints: [dp] };
    const clonedDp = component.displayConfig.datapoints[0];
    // when
    component.handleDatapointOutOfSync(clonedDp);
    // then
    expect(component.datapointsOutOfSync.get(clonedDp)).toBe(true);
  });

  it('if disableZoom is set to true, the button should be hidden', () => {
    // given
    const dp: DatapointsGraphKPIDetails = {
      fragment: 'c8y_Temperature',
      series: 'T',
      __active: true,
      __target: { id: '1' },
    };
    component.config = { datapoints: [dp], disableZoom: true };
    const clonedDp = component.displayConfig.datapoints[0];
    // when
    component.toggleChart(clonedDp);
    fixture.detectChanges();
    // then
    expect(
      fixture.nativeElement.querySelectorAll('.btn-group button').length
    ).toBe(4);
  });

  it('if disableExport is set to true, the button should be hidden', () => {
    // given
    const dp: DatapointsGraphKPIDetails = {
      fragment: 'c8y_Temperature',
      series: 'T',
      __active: true,
      __target: { id: '1' },
    };
    component.config = { datapoints: [dp], disableExport: true };
    const clonedDp = component.displayConfig.datapoints[0];
    // when
    component.toggleChart(clonedDp);
    fixture.detectChanges();
    // then
    expect(
      fixture.nativeElement.querySelectorAll('.btn-group button').length
    ).toBe(4);
  });

  it('if disableExport and disableZoom is set to true, all buttons should be hidden', () => {
    // given
    const dp: DatapointsGraphKPIDetails = {
      fragment: 'c8y_Temperature',
      series: 'T',
      __active: true,
      __target: { id: '1' },
    };
    component.config = {
      datapoints: [dp],
      disableExport: true,
      disableZoom: true,
    };
    const clonedDp = component.displayConfig.datapoints[0];
    // when
    component.toggleChart(clonedDp);
    fixture.detectChanges();
    // then
    expect(
      fixture.nativeElement.querySelectorAll('.btn-group button').length
    ).toBe(2);
  });
});
