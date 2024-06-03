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
import type { ECharts, EChartsOption, SeriesOption } from 'echarts';
import {
  DatapointsGraphKPIDetails,
  DatapointsGraphWidgetConfig,
  DatapointsGraphWidgetTimeProps,
  DatapointWithValues,
  DateString,
  INTERVALS,
  SeriesValue,
} from '../model';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { CustomMeasurementService } from './custom-measurements.service';
import {
  AlarmRealtimeService,
  CoreModule,
  DatePipe,
  DismissAlertStrategy,
  DynamicComponentAlert,
  DynamicComponentAlertAggregator,
  EventRealtimeService,
  gettext,
  MeasurementRealtimeService,
} from '@c8y/ngx-components';
import { TranslateService } from '@ngx-translate/core';
import { EchartsOptionsService } from './echarts-options.service';
import { ChartRealtimeService } from './chart-realtime.service';
import type { DataZoomOption } from 'echarts/types/src/component/dataZoom/DataZoomModel';
import type {
  ECActionEvent,
  TooltipFormatterCallback,
} from 'echarts/types/src/util/types';
import { ChartTypesService } from './chart-types.service';
import { CommonModule } from '@angular/common';
import { NGX_ECHARTS_CONFIG, NgxEchartsModule } from 'ngx-echarts';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { YAxisService } from './y-axis.service';
import { ChartAlertsComponent } from './chart-alerts/chart-alerts.component';
import { AlarmStatus, IAlarm, IEvent } from '@c8y/client';
import { CustomSeriesOptions } from './chart.model';
import {
  AlarmDetails,
  AlarmOrEvent,
  EventDetails,
} from '../alarm-event-selector';
import { ChartEventsService } from '../datapoints-graph-view/chart-events.service';
import { ChartAlarmsService } from '../datapoints-graph-view/chart-alarms.service';
import { cli } from 'cypress';
import { TopLevelFormatterParams } from 'echarts/types/src/component/tooltip/TooltipModel';

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
    AlarmRealtimeService,
    EventRealtimeService,
    ChartTypesService,
    EchartsOptionsService,
    CustomMeasurementService,
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
  zoomHistory: ZoomState[] = [];
  zoomInActive = false;
  alarms: IAlarm[];
  events: IEvent[];
  @Input() config: DatapointsGraphWidgetConfig;
  @Input() alerts: DynamicComponentAlertAggregator;
  @Output() configChangeOnZoomOut =
    new EventEmitter<DatapointsGraphWidgetTimeProps>();
  @Output() timeRangeChangeOnRealtime = new EventEmitter<
    Pick<DatapointsGraphWidgetConfig, 'dateFrom' | 'dateTo'>
  >();
  @Output() datapointOutOfSync = new EventEmitter<DatapointsGraphKPIDetails>();
  @Output() updateAlarmsAndEvents = new EventEmitter<AlarmOrEvent[]>();
  private configChangedSubject = new BehaviorSubject<void>(null);

  @HostListener('keydown.escape') onEscapeKeyDown() {
    if (this.zoomInActive) {
      this.toggleZoomIn();
    }
  }

  constructor(
    private measurementService: CustomMeasurementService,
    private translateService: TranslateService,
    private echartsOptionsService: EchartsOptionsService,
    private chartRealtimeService: ChartRealtimeService,
    private chartEventsService: ChartEventsService,
    private chartAlarmsService: ChartAlarmsService,
    private datePipe: DatePipe
  ) {
    this.chartOption$ = this.configChangedSubject.pipe(
      switchMap(() => this.loadAlarmsAndEvents()),
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
      })
    );
  }

  ngOnChanges() {
    this.configChangedSubject.next();
  }

  ngOnInit() {
    this.alerts.setAlertGroupDismissStrategy(
      'warning',
      DismissAlertStrategy.TEMPORARY_OR_PERMANENT
    );
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
    this.echartsInstance.on('click', this.onChartClick.bind(this));

    let originalFormatter = null;
    this.echartsInstance.on('mouseover', (params: any) => {
      if (
        params?.componentType !== 'markLine' &&
        params?.componentType !== 'markPoint'
      ) {
        return;
      }
      const options = this.echartsInstance.getOption();
      if (!originalFormatter) {
        originalFormatter = options.tooltip[0].formatter;
      }

      const updatedOptions: Partial<SeriesOption> = {
        tooltip: options.tooltip,
      };
      updatedOptions.tooltip[0].formatter = (
        tooltipParams: TooltipFormatterCallback<TopLevelFormatterParams>
      ) => {
        return this.echartsOptionsService.getTooltipFormatterForAlarmAndEvents(
          tooltipParams,
          params,
          this.events,
          this.alarms
        );
      };

      this.echartsInstance.setOption(updatedOptions);
    });

    this.echartsInstance.on('mouseout', () => {
      const options = this.echartsInstance.getOption();
      if (originalFormatter) {
        options.tooltip[0].formatter = originalFormatter;
        this.echartsInstance.setOption(options);
      }
    });
  }

  onChartClick(params) {
    const options = this.echartsInstance.getOption();
    if (!this.isAlarmClick(params)) {
      this.echartsInstance.setOption({
        tooltip: { triggerOn: 'mousemove' },
        series: [
          {
            markArea: {
              data: [],
            },
            markLine: {
              data: [],
            },
          },
        ],
      });
      return;
    }

    const clickedAlarms = this.alarms.filter(
      (alarm) => alarm.type === params.data.itemType
    );

    const updatedOptions = !this.hasMarkArea(options)
      ? {
          tooltip: {
            enterable: true,
            triggerOn: 'click',
          },
          series: [
            {
              markArea: {
                label: {
                  show: false,
                },
                data: this.getMarkedAreaData(clickedAlarms),
              },
              markLine: {
                showSymbol: true,
                symbol: ['none', 'none'],
                data: this.getMarkedLineData(clickedAlarms),
              },
            },
          ],
        }
      : // if markArea already exists, remove it and remove lastUpdated from markLine
        {
          tooltip: { triggerOn: 'mousemove' },
          series: [
            {
              markArea: {
                data: [],
              },
              markLine: {
                data: [],
              },
            },
          ],
        };

    this.echartsInstance.setOption(updatedOptions);
  }

  isAlarmClick(params): boolean {
    return this.alarms.some((alarm) => alarm.type === params.data.itemType);
  }

  hasMarkArea(options): boolean {
    return options?.series?.[0]?.markArea?.data?.length > 0;
  }

  toggleZoomIn(): void {
    this.zoomInActive = !this.zoomInActive;
    this.echartsInstance.dispatchAction({
      type: 'takeGlobalCursor',
      key: 'dataZoomSelect',
      dataZoomSelectActive: this.zoomInActive,
    });
  }

  zoomOut(): void {
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

  private getMarkedAreaData(clickedAlarms: IAlarm[]) {
    const timeRange = this.getTimeRange();

    return clickedAlarms.map((clickedAlarm) => {
      return [
        {
          name: clickedAlarm.type,
          xAxis: clickedAlarm.creationTime,
          itemStyle: {
            color:
              clickedAlarm.status === AlarmStatus.CLEARED
                ? 'rgba(221,255,221,1.00)'
                : 'rgba(255, 173, 177, 0.4)',
          },
        },
        {
          xAxis:
            clickedAlarm.lastUpdated === clickedAlarm.creationTime ||
            clickedAlarm.status !== AlarmStatus.CLEARED
              ? timeRange.dateTo
              : clickedAlarm.lastUpdated,
        },
      ];
    });
  }

  private getMarkedLineData(clickedAlarms: IAlarm[]) {
    clickedAlarms.reduce((acc, alarm) => {
      const isClickedAlarmCleared = alarm.status === AlarmStatus.CLEARED;
      if (isClickedAlarmCleared) {
        return acc.concat([
          {
            xAxis: alarm.creationTime,
            alarmType: alarm.type,
            label: {
              show: false,
              formatter: alarm.type,
            },
            itemStyle: { color: alarm.color },
          },
          {
            xAxis: alarm.lastUpdated,
            alarmType: alarm.type,
            label: {
              show: false,
              formatter: alarm.type,
            },
            itemStyle: { color: alarm.color },
          },
        ]);
      }
      return acc.concat([
        {
          xAxis: alarm.creationTime,
          alarmType: alarm.type,
          label: {
            show: false,
            formatter: alarm.type,
          },
          itemStyle: { color: alarm.color },
        },
      ]);
    }, []);
  }

  private async loadAlarmsAndEvents(): Promise<any> {
    const timeRange = this.getTimeRange();
    const updatedTimeRange = {
      lastUpdatedFrom: timeRange.dateFrom,
      createdTo: timeRange.dateTo,
    };
    const visibleAlarmsOrEvents = this.config.alarmsEventsConfigs.filter(
      (alarmOrEvent) => !alarmOrEvent.__hidden
    );
    const alarms = visibleAlarmsOrEvents.filter(
      (alarmOrEvent) => alarmOrEvent.timelineType === 'ALARM'
    ) as AlarmDetails[];
    const events = visibleAlarmsOrEvents.filter(
      (alarmOrEvent) => alarmOrEvent.timelineType === 'EVENT'
    ) as EventDetails[];

    const [listedEvents, listedAlarms] = await Promise.all([
      this.chartEventsService.listEvents(updatedTimeRange, events),
      this.chartAlarmsService.listAlarms(updatedTimeRange, alarms),
    ]);

    this.events = listedEvents;
    this.alarms = listedAlarms;

    this.updateAlarmsAndEvents.emit(this.config.alarmsEventsConfigs);
  }

  private startRealtimeIfPossible(): void {
    if (this.config.realtime && this.echartsInstance) {
      this.chartRealtimeService.startRealtime(
        this.echartsInstance,
        this.config.datapoints.filter((dp) => dp.__active),
        this.getTimeRange(),
        (dp) => this.datapointOutOfSync.emit(dp),
        (timeRange) => this.timeRangeChangeOnRealtime.emit(timeRange),
        this.config.alarmsEventsConfigs
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
      this.events,
      this.alarms
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

  private findValueForExactOrEarlierTimestamp(
    values: SeriesValue[],
    timestampString: DateString
  ): SeriesValue {
    const timestamp = new Date(timestampString).valueOf();
    return values.reduce((acc, curr) => {
      if (new Date(curr[0]).valueOf() <= timestamp) {
        if (
          acc === null ||
          Math.abs(new Date(curr[0]).valueOf() - timestamp) <
            Math.abs(new Date(acc[0]).valueOf() - timestamp)
        ) {
          return curr;
        }
      }
      return acc;
    }, null);
  }
}
