import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import type { ECharts, EChartsOption } from 'echarts';
import {
  DatapointsGraphKPIDetails,
  DatapointsGraphWidgetConfig,
  DatapointsGraphWidgetTimeProps,
  DatapointWithValues,
  INTERVALS,
} from '../model';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { CustomMeasurementService } from './custom-measurements.service';
import {
  CoreModule,
  DismissAlertStrategy,
  DynamicComponentAlert,
  DynamicComponentAlertAggregator,
  gettext,
  MeasurementRealtimeService,
} from '@c8y/ngx-components';
import { TranslateService } from '@ngx-translate/core';
import { EchartsOptionsService } from './echarts-options.service';
import { ChartRealtimeService } from './chart-realtime.service';
import type { DataZoomOption } from 'echarts/types/src/component/dataZoom/DataZoomModel';
import type { ECActionEvent } from 'echarts/types/src/util/types';
import { ChartTypesService } from './chart-types.service';
import { CommonModule } from '@angular/common';
import { NGX_ECHARTS_CONFIG, NgxEchartsModule } from 'ngx-echarts';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { YAxisService } from './y-axis.service';
import { ChartAlertsComponent } from './chart-alerts/chart-alerts.component';
import { ApiService } from '@c8y/ngx-components/api';
import { CustomAlarmsService } from './custom-alarms.service';
import { CustomEventsService } from './custom-events.service';

type ZoomState = Record<'startValue' | 'endValue', number | string | Date>;

@Component({
  selector: 'c8y-charts',
  templateUrl: './charts.component.html',
  providers: [
    {
      provide: NGX_ECHARTS_CONFIG,
      useFactory: () => ({ echarts: () => import('echarts') }),
    },
    ChartRealtimeService,
    MeasurementRealtimeService,
    ChartTypesService,
    EchartsOptionsService,
    CustomMeasurementService,
    CustomAlarmsService,
    CustomEventsService,
    YAxisService,
  ],
  standalone: true,
  imports: [
    CommonModule,
    CoreModule,
    NgxEchartsModule,
    TooltipModule,
    PopoverModule,
    ChartAlertsComponent,
  ],
})
export class ChartsComponent implements OnChanges, OnInit, OnDestroy {
  chartOption$: Observable<EChartsOption>;
  echartsInstance: ECharts;
  alarms: any;
  events: any;
  zoomHistory: ZoomState[] = [];
  zoomInActive = false;
  @Input() config: DatapointsGraphWidgetConfig;
  @Input() alerts: DynamicComponentAlertAggregator;
  @Output() configChangeOnZoomOut =
    new EventEmitter<DatapointsGraphWidgetTimeProps>();
  @Output() timeRangeChangeOnRealtime = new EventEmitter<
    Pick<DatapointsGraphWidgetConfig, 'dateFrom' | 'dateTo'>
  >();
  @Output() datapointOutOfSync = new EventEmitter<DatapointsGraphKPIDetails>();
  private configChangedSubject = new BehaviorSubject<void>(null);

  @HostListener('keydown.escape') onEscapeKeyDown() {
    if (this.zoomInActive) {
      this.toggleZoomIn();
    }
  }

  constructor(
    private measurementService: CustomMeasurementService,
    private alarmsService: CustomAlarmsService,
    private eventsService: CustomEventsService,
    private translateService: TranslateService,
    private echartsOptionsService: EchartsOptionsService,
    private chartRealtimeService: ChartRealtimeService
  ) {
    this.chartOption$ = this.configChangedSubject.pipe(
      switchMap(() => this.fetchSeriesForDatapoints$()),
      switchMap((datapointsWithValues: DatapointWithValues[]) => {
        if (datapointsWithValues.length === 0) {
          this.echartsInstance?.clear();
          return of(null);
        }
        return of(this.getChartOptions(datapointsWithValues));
      }),
      tap(() => {
        if (this.zoomInActive) {
          this.toggleZoomIn();
        }
        this.chartRealtimeService.stopRealtime();
        this.startRealtimeIfPossible();
        if (this.echartsInstance) {
          this.echartsInstance.on('click', this.onChartClick.bind(this));
        }
      })
    );
  }

  ngOnChanges() {
    this.configChangedSubject.next();
  }

  async ngOnInit() {
    this.alerts.setAlertGroupDismissStrategy(
      'warning',
      DismissAlertStrategy.TEMPORARY_OR_PERMANENT
    );

    this.alarms = (
      await this.alarmsService.listAlarms$(this.getTimeRange(), 'TestAlarm')
    ).data;
    const newTypeAlarm = (
      await this.alarmsService.listAlarms$(
        this.getTimeRange,
        'AnotherTypeAlarm'
      )
    ).data;
    newTypeAlarm.alarms.forEach((alarm) => this.alarms.alarms.push(alarm));
    this.events = (
      await this.eventsService.listEvents$(this.getTimeRange())
    ).data;
  }

  ngOnDestroy() {
    this.chartRealtimeService.stopRealtime();
  }

  onChartInit(ec: ECharts) {
    this.echartsInstance = ec;
    this.echartsOptionsService.echartsInstance = this.echartsInstance;
    this.startRealtimeIfPossible();

    queueMicrotask(() => {
      this.updateZoomState();
    });
    this.echartsInstance.on('dataZoom', (event: ECActionEvent) => {
      const isZoomInActionFromHiddenToolbox = event.batch?.[0]?.from != null;
      if (isZoomInActionFromHiddenToolbox) {
        this.updateZoomState();
        this.chartRealtimeService.stopRealtime();
      }
    });
  }

  onChartClick(params) {
    if (this.isAlarmClick(params)) {
      const clickedAlarms = this.alarms.alarms.filter(
        (alarm) => alarm.type === params.data.type
      );

      const timeRange = this.getTimeRange();
      const updatedOptions = !this.hasMarkArea(this.echartsInstance.getOption())
        ? {
            series: [
              {
                markArea: {
                  data: clickedAlarms.map((clickedAlarm) => {
                    return [
                      {
                        name: clickedAlarm.type,
                        xAxis: clickedAlarm.creationTime,
                        itemStyle: {
                          color:
                            clickedAlarm.status === 'CLEARED'
                              ? 'rgba(221,255,221,1.00)'
                              : 'rgba(255, 173, 177, 0.4)',
                        },
                      },
                      {
                        xAxis:
                          clickedAlarm.lastUpdated === clickedAlarm.creationTime
                            ? timeRange.dateTo
                            : clickedAlarm.lastUpdated,
                      },
                    ];
                  }),
                },
              },
            ],
          }
        : { series: [{ markArea: { data: [] } }] };

      this.echartsInstance.setOption(updatedOptions);
    }
  }

  isAlarmClick(params): boolean {
    return this.alarms.alarms.some((alarm) => alarm.type === params.data.type);
  }

  hasMarkArea(options): boolean {
    return (
      options &&
      options.series &&
      options.series[0].markArea &&
      options.series[0].markArea.data.length > 0
    );
  }

  toggleZoomIn(): void {
    this.zoomInActive = !this.zoomInActive;
    this.echartsInstance.dispatchAction({
      type: 'takeGlobalCursor',
      key: 'dataZoomSelect',
      dataZoomSelectActive: this.zoomInActive,
    });
  }

  async zoomOut() {
    if (this.zoomInActive) {
      this.toggleZoomIn();
    }
    this.zoomHistory.pop();
    if (this.zoomHistory.length) {
      this.echartsInstance.dispatchAction({
        type: 'dataZoom',
        startValue: this.zoomHistory[this.zoomHistory.length - 1].startValue,
        endValue: this.zoomHistory[this.zoomHistory.length - 1].endValue,
      });
      if (this.zoomHistory.length === 1) {
        // realtime should be only started when graph is not zoomed in and have only initial zoom state in its history
        this.startRealtimeIfPossible();
      }
    } else {
      const currentStartValue =
        this.echartsInstance.getOption().dataZoom[0].startValue;
      const currentEndValue =
        this.echartsInstance.getOption().dataZoom[0].endValue;
      const currentTimeRangeInMs = currentEndValue - currentStartValue;

      // new dateTo should not exceed today date
      const newDateTo = new Date(
        Math.min(
          currentEndValue + currentTimeRangeInMs / 2,
          new Date().valueOf()
        )
      );
      // every zoom out expands current time range times 2
      const newDateFrom = new Date(
        newDateTo.valueOf() - currentTimeRangeInMs * 2
      );

      this.configChangeOnZoomOut.emit({
        dateFrom: newDateFrom,
        dateTo: newDateTo,
        interval: 'custom',
      });
      this.alarms = (
        await this.alarmsService.listAlarms$(
          {
            dateFrom: newDateFrom.toISOString(),
            dateTo: newDateTo.toISOString(),
          },
          'TestAlarm'
        )
      ).data;
      const newTypeAlarm = (
        await this.alarmsService.listAlarms$(
          {
            dateFrom: newDateFrom.toISOString(),
            dateTo: newDateTo.toISOString(),
          },
          'AnotherTypeAlarm'
        )
      ).data;
      newTypeAlarm.alarms.forEach((alarm) => this.alarms.alarms.push(alarm));
      this.events = (
        await this.eventsService.listEvents$({
          dateFrom: newDateFrom.toISOString(),
          dateTo: newDateTo.toISOString(),
        })
      ).data;
      this.zoomHistory.push({
        startValue: newDateFrom.valueOf(),
        endValue: newDateTo.valueOf(),
      });
    }
  }

  saveAsImage() {
    this.echartsInstance.setOption({
      legend: {
        show: true,
      },
    });
    const url = this.echartsInstance.getDataURL({
      pixelRatio: 2,
      backgroundColor: '#fff',
      type: 'png',
    });
    const link = document.createElement('a');
    link.href = url;
    link.download = 'datapoints-graph-screenshot';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.echartsInstance.setOption({
      legend: {
        show: false,
      },
    });
  }

  private startRealtimeIfPossible(): void {
    if (this.config.realtime && this.echartsInstance) {
      this.chartRealtimeService.startRealtime(
        this.echartsInstance,
        this.config.datapoints.filter((dp) => dp.__active),
        this.getTimeRange(),
        (dp) => this.datapointOutOfSync.emit(dp),
        (timeRange) => this.timeRangeChangeOnRealtime.emit(timeRange)
      );
    }
  }

  private updateZoomState(): void {
    const { startValue, endValue }: DataZoomOption =
      this.echartsInstance.getOption().dataZoom[0];
    this.zoomHistory.push({ startValue, endValue });
  }

  private getChartOptions(
    datapointsWithValues: DatapointWithValues[]
  ): EChartsOption {
    const timeRange = this.getTimeRange();

    return this.echartsOptionsService.getChartOptions(
      datapointsWithValues,
      timeRange,
      {
        YAxis: this.config.yAxisSplitLines,
        XAxis: this.config.xAxisSplitLines,
      },
      this.alarms.alarms,
      this.events?.events
    );
  }

  private fetchSeriesForDatapoints$(): Observable<DatapointWithValues[]> {
    const activeDatapoints = this.config?.datapoints?.filter(
      (dp) => dp.__active
    );
    if (!activeDatapoints || activeDatapoints.length === 0) {
      return of([]);
    }
    const datapointsWithValuesRequests: Observable<DatapointWithValues>[] = [];
    const timeRange = this.getTimeRange(60_000);
    for (const dp of activeDatapoints) {
      const request = this.measurementService
        .listSeries$({
          ...timeRange,
          source: dp.__target.id,
          series: [`${dp.fragment}.${dp.series}`],
          ...(this.config.aggregation && {
            aggregationType: this.config.aggregation,
          }),
        })
        .pipe(
          map((res) => {
            const values = res.data.values;
            if (res.data.truncated) {
              values[this.config.dateFrom.toISOString()] = [
                { min: null, max: null },
              ];
            } else {
              this.alerts.clear();
            }
            return { ...dp, values, truncated: res.data.truncated };
          })
        );

      datapointsWithValuesRequests.push(request);
    }
    return forkJoin(datapointsWithValuesRequests).pipe(
      tap((dpsWithValues: DatapointWithValues[]) => {
        if (dpsWithValues.some((dp) => dp.truncated)) {
          this.addTruncatedDataAlert();
        }
      })
    );
  }

  private addTruncatedDataAlert(): void {
    if (
      this.alerts.alertGroups.find((a) => a.type === 'warning')?.value?.alerts
        ?.length
    ) {
      return;
    }
    const alert = new DynamicComponentAlert({
      type: 'warning',
      text: this.translateService.instant(
        gettext(
          'Truncated data. Change aggregation or select shorter date range.'
        )
      ),
    });

    this.alerts.addAlerts(alert);
  }

  private getTimeRange(additionalPadding?: number): {
    dateFrom: string;
    dateTo: string;
  } {
    let timeRange: { dateFrom: Date; dateTo: Date };
    if (
      this.config.widgetInstanceGlobalTimeContext ||
      (this.config.interval === 'custom' && !this.config.realtime)
    ) {
      timeRange = {
        dateFrom: new Date(this.config.dateFrom),
        dateTo: new Date(this.config.dateTo),
      };
    } else {
      let timeRangeInMs: number;
      if (this.config.interval && this.config.interval !== 'custom') {
        timeRangeInMs = INTERVALS.find(
          (i) => i.id === this.config.interval
        ).timespanInMs;
      } else if (this.config.realtime) {
        timeRangeInMs =
          new Date(this.config.dateTo).valueOf() -
          new Date(this.config.dateFrom).valueOf();
      }
      const now = new Date();
      timeRange = {
        dateFrom: new Date(now.valueOf() - timeRangeInMs),
        dateTo: now,
      };
    }
    if (additionalPadding) {
      timeRange.dateFrom = new Date(
        timeRange.dateFrom.valueOf() - additionalPadding
      );
      timeRange.dateTo = new Date(
        timeRange.dateTo.valueOf() + additionalPadding
      );
    }
    return {
      dateFrom: timeRange.dateFrom.toISOString(),
      dateTo: timeRange.dateTo.toISOString(),
    };
  }
}
