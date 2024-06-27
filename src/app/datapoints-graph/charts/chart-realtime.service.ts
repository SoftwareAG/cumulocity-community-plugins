import { Injectable } from '@angular/core';
import {
  combineLatest,
  from,
  interval,
  merge,
  Observable,
  Subscription,
} from 'rxjs';
import { IAlarm, IEvent, IMeasurement } from '@c8y/client';
import { buffer, map, mergeMap, tap, throttleTime } from 'rxjs/operators';
import {
  DatapointChartRenderType,
  DatapointRealtimeMeasurements,
  DatapointsGraphKPIDetails,
  DatapointsGraphWidgetConfig,
  DatapointWithValues,
  SeriesDatapointInfo,
  SeriesValue,
} from '../model';
import {
  AlarmRealtimeService,
  EventRealtimeService,
  MeasurementRealtimeService,
  RealtimeMessage,
} from '@c8y/ngx-components';
import type { ECharts, SeriesOption } from 'echarts';
import { EchartsOptionsService } from './echarts-options.service';
import { AlarmOrEvent } from '../alarm-event-selector';

type Milliseconds = number;

@Injectable()
export class ChartRealtimeService {
  private INTERVAL: Milliseconds = 1000;
  private MIN_REALTIME_TIMEOUT: Milliseconds = 250;
  private MAX_REALTIME_TIMEOUT: Milliseconds = 5_000;
  private realtimeSubscriptionMeasurements: Subscription;
  private realtimeSubscriptionAlarmsEvents: Subscription;
  private echartsInstance: ECharts;
  private currentTimeRange: { dateFrom: Date; dateTo: Date };

  constructor(
    private measurementRealtime: MeasurementRealtimeService,
    private alarmRealtimeService: AlarmRealtimeService,
    private eventRealtimeService: EventRealtimeService,
    private echartsOptionsService: EchartsOptionsService
  ) {}

  startRealtime(
    echartsInstance: ECharts,
    datapoints: DatapointsGraphKPIDetails[],
    timeRange: { dateFrom: string; dateTo: string },
    datapointOutOfSyncCallback: (dp: DatapointsGraphKPIDetails) => void,
    timeRangeChangedCallback: (
      timeRange: Pick<DatapointsGraphWidgetConfig, 'dateFrom' | 'dateTo'>
    ) => void,
    alarmOrEventConfig: AlarmOrEvent[] = []
  ) {
    this.echartsInstance = echartsInstance;
    this.currentTimeRange = {
      dateFrom: new Date(timeRange.dateFrom),
      dateTo: new Date(timeRange.dateTo),
    };

    const activeAlarmsOrEvents = alarmOrEventConfig.filter(
      (alarmOrEvent) => alarmOrEvent.__active
    );
    const uniqueAlarmOrEventTargets = Array.from(
      new Set(activeAlarmsOrEvents.map((aOrE) => aOrE.__target.id))
    );

    const allAlarmsAndEvents$: Observable<IAlarm | IEvent> = from(
      uniqueAlarmOrEventTargets
    ).pipe(
      mergeMap((targetId) => {
        const alarmsRealtime$: Observable<RealtimeMessage<IAlarm>> =
          this.alarmRealtimeService.onAll$(targetId);
        const eventsRealtime$: Observable<RealtimeMessage<IEvent>> =
          this.eventRealtimeService.onAll$(targetId);
        return merge(alarmsRealtime$, eventsRealtime$).pipe(
          map((realtimeMessage) => realtimeMessage.data as IAlarm | IEvent)
        );
      })
    );

    const measurementsForDatapoints: Observable<DatapointRealtimeMeasurements>[] =
      datapoints.map((dp) => {
        const source$: Observable<IMeasurement> =
          this.measurementRealtime.onCreateOfSpecificMeasurement$(
            dp.fragment,
            dp.series,
            dp.__target?.id
          );
        return source$.pipe(
          map((measurement: IMeasurement) => ({ datapoint: dp, measurement }))
        );
      });
    const updateThrottleTime: Milliseconds =
      this.getRealtimeUpdateThrottleTime(timeRange);
    const measurement$ = merge(...measurementsForDatapoints);
    const bufferReset$ = merge(
      measurement$.pipe(throttleTime(updateThrottleTime)),
      interval(this.INTERVAL).pipe(
        tap(() => {
          this.currentTimeRange = {
            dateFrom: new Date(
              (this.currentTimeRange?.dateFrom?.valueOf() || 0) + this.INTERVAL
            ),
            dateTo: new Date(
              (this.currentTimeRange?.dateTo?.valueOf() || 0) + this.INTERVAL
            ),
          };
          timeRangeChangedCallback(this.currentTimeRange);
        }),
        throttleTime(updateThrottleTime)
      )
    ).pipe(throttleTime(this.MIN_REALTIME_TIMEOUT));

    this.realtimeSubscriptionMeasurements = measurement$
      .pipe(buffer(bufferReset$))
      .subscribe((measurements) => {
        this.updateChartInstance(
          measurements,
          null,
          datapointOutOfSyncCallback
        );
      });

    const combined$ = combineLatest([allAlarmsAndEvents$, measurement$]);

    this.realtimeSubscriptionAlarmsEvents = combined$
      .pipe(
        map(([alarmOrEvent, measurements]) => {
          const foundAlarmOrEvent = alarmOrEventConfig.find((aOrE) => {
            return aOrE.filters.type === alarmOrEvent.type;
          });
          if (foundAlarmOrEvent) {
            alarmOrEvent['color'] = foundAlarmOrEvent.color;
          }

          return foundAlarmOrEvent ? { alarmOrEvent, measurements } : null;
        })
      )
      .subscribe((data) => {
        if (!data) {
          return;
        }
        const { alarmOrEvent, measurements } = data;
        this.updateChartInstance(
          [measurements],
          alarmOrEvent,
          datapointOutOfSyncCallback
        );
      });
  }

  stopRealtime() {
    this.realtimeSubscriptionMeasurements?.unsubscribe();
    this.realtimeSubscriptionAlarmsEvents?.unsubscribe();
  }

  private removeValuesBeforeTimeRange(series: SeriesOption): SeriesValue[] {
    const firstValidValueByDateIndex = (series.data as SeriesValue[]).findIndex(
      ([dateString, _]) => {
        return (
          new Date(dateString) >=
          (this.currentTimeRange?.dateFrom || new Date())
        );
      }
    );
    if (firstValidValueByDateIndex > 1) {
      // we need one value before dateFrom for chart lines to be extended to the left edge of the graph
      series.data = (series.data as SeriesValue[]).slice(
        firstValidValueByDateIndex - 1
      );
    }
    return series.data as SeriesValue[];
  }

  private getRealtimeUpdateThrottleTime(timeRange: {
    dateFrom: string;
    dateTo: string;
  }): Milliseconds {
    const timeRangeInMs =
      new Date(timeRange.dateTo).valueOf() -
      new Date(timeRange.dateFrom).valueOf();
    const calculatedThrottleTime = Math.round(timeRangeInMs / 1000);
    if (calculatedThrottleTime < this.MIN_REALTIME_TIMEOUT) {
      return this.MIN_REALTIME_TIMEOUT;
    } else if (calculatedThrottleTime > this.MAX_REALTIME_TIMEOUT) {
      return this.MAX_REALTIME_TIMEOUT;
    }
    return calculatedThrottleTime;
  }

  private updateChartInstance(
    receivedMeasurements: DatapointRealtimeMeasurements[],
    alarmOrEvent: IAlarm | IEvent | null,
    datapointOutOfSyncCallback: (dp: DatapointsGraphKPIDetails) => void
  ) {
    const isEvent = (item: IAlarm | IEvent): item is IEvent =>
      !('severity' in item);
    const isAlarm = (item: IAlarm | IEvent): item is IAlarm =>
      'severity' in item;

    const seriesDataToUpdate = new Map<
      DatapointsGraphKPIDetails,
      IMeasurement[]
    >();

    receivedMeasurements.forEach(({ datapoint, measurement }) => {
      if (!seriesDataToUpdate.has(datapoint)) {
        seriesDataToUpdate.set(datapoint, []);
      }
      seriesDataToUpdate.get(datapoint)?.push(measurement);
    });

    const allDataSeries = this.echartsInstance?.getOption()[
      'series'
    ] as (SeriesOption & SeriesDatapointInfo)[];

    seriesDataToUpdate.forEach((measurements, datapoint) => {
      const newValues: SeriesValue[] = measurements.map((m) => [
        m.time as string,
        m[datapoint.fragment][datapoint.series].value,
      ]);
      const datapointId =
        datapoint.__target?.id + datapoint.fragment + datapoint.series;
      const seriesMatchingDatapoint = allDataSeries.find(
        (s) => s.datapointId === datapointId
      );
      if (!seriesMatchingDatapoint) {
        return;
      }
      const seriesDataToUpdate = seriesMatchingDatapoint.data as SeriesValue[];
      seriesDataToUpdate.push(...newValues);

      seriesMatchingDatapoint.data = this.removeValuesBeforeTimeRange(
        seriesMatchingDatapoint
      );

      if (alarmOrEvent) {
        const renderType: DatapointChartRenderType =
          datapoint.renderType || 'min';
        const dp: DatapointWithValues = {
          ...datapoint,
          values: seriesMatchingDatapoint.data as {
            [date: string]: { min: number; max: number }[];
          },
        };

        if (isEvent(alarmOrEvent)) {
          // if event series with the same id already exists, return
          const eventExists = allDataSeries.some((series) =>
            (series.data as { data: any[] }[]).some(
              (data) => data[0] === (alarmOrEvent as IEvent).creationTime
            )
          );
          if (eventExists) {
            return;
          }
          const newEventSeries =
            this.echartsOptionsService.getAlarmOrEventSeries(
              dp,
              renderType,
              false,
              [alarmOrEvent],
              'event',
              alarmOrEvent.creationTime
            );
          allDataSeries.push(...newEventSeries);
        } else if (isAlarm(alarmOrEvent)) {
          const alarmExists = allDataSeries.some((series: { data: any[] }) =>
            series.data.some(
              (data) => data[0] === (alarmOrEvent as IEvent).creationTime
            )
          );
          if (alarmExists) {
            const alarmSeries = allDataSeries.find((series: { data: any[] }) =>
              series.data.some(
                (data) => data[0] === (alarmOrEvent as IAlarm).creationTime
              )
            );
            // update the last value of the markline to the new value
            alarmSeries.markLine.data[1].xAxis = (alarmOrEvent as IAlarm)[
              'lastUpdated'
            ];
            // update the last value of the markpoint to the new value
            alarmSeries.markPoint.data[1].coord[0] = (alarmOrEvent as IAlarm)[
              'lastUpdated'
            ];
          } else {
            const newAlarmSeries =
              this.echartsOptionsService.getAlarmOrEventSeries(
                dp,
                renderType,
                false,
                [alarmOrEvent],
                'alarm',
                (alarmOrEvent as IEvent).id
              );

            allDataSeries.push(...newAlarmSeries);
          }
        }
      }

      this.checkForValuesAfterTimeRange(
        seriesMatchingDatapoint.data as SeriesValue[],
        datapoint,
        datapointOutOfSyncCallback
      );
    });

    this.echartsInstance?.setOption({
      xAxis: {
        min: this.currentTimeRange?.dateFrom,
        max: this.currentTimeRange?.dateTo,
      },
      series: allDataSeries,
    });
  }

  private checkForValuesAfterTimeRange(
    data: SeriesValue[],
    datapoint: DatapointsGraphKPIDetails,
    datapointOutOfSyncCallback: (dp: DatapointsGraphKPIDetails) => void
  ) {
    const now = new Date();
    const valueAfterNowExists = data.some(([dateString, _]: SeriesValue) => {
      return new Date(dateString).valueOf() > now.valueOf();
    });
    if (valueAfterNowExists) {
      datapointOutOfSyncCallback(datapoint);
    }
  }
}
