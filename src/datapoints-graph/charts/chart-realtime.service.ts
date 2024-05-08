import { Injectable } from '@angular/core';
import { combineLatest, interval, merge, Observable, Subscription } from 'rxjs';
import { IAlarm, IEvent, IMeasurement } from '@c8y/client';
import { buffer, map, switchMap, tap, throttleTime } from 'rxjs/operators';
import {
  DatapointChartRenderType,
  DatapointRealtimeMeasurements,
  DatapointsGraphKPIDetails,
  DatapointsGraphWidgetConfig,
  DatapointWithValues,
  SeriesDatapointInfo,
  SeriesValue,
} from '../model';
import { MeasurementRealtimeService } from '@c8y/ngx-components';
import type { ECharts, SeriesOption } from 'echarts';
import { ChartEventsService } from './chart-events.service';
import { EchartsOptionsService } from './echarts-options.service';
import { ChartAlarmsService } from './chart-alarms.service';

type Milliseconds = number;

@Injectable()
export class ChartRealtimeService {
  private INTERVAL: Milliseconds = 1000;
  private MIN_REALTIME_TIMEOUT: Milliseconds = 250;
  private MAX_REALTIME_TIMEOUT: Milliseconds = 5_000;
  private realtimeSubscription: Subscription;
  private echartsInstance: ECharts;
  private currentTimeRange: { dateFrom: Date; dateTo: Date };

  constructor(
    private measurementRealtime: MeasurementRealtimeService,
    private eventsService: ChartEventsService,
    private echartsOptionsService: EchartsOptionsService,
    private alarmsService: ChartAlarmsService
  ) {}

  startRealtime(
    echartsInstance: ECharts,
    datapoints: DatapointsGraphKPIDetails[],
    timeRange: { dateFrom: string; dateTo: string },
    datapointOutOfSyncCallback: (dp: DatapointsGraphKPIDetails) => void,
    timeRangeChangedCallback: (
      timeRange: Pick<DatapointsGraphWidgetConfig, 'dateFrom' | 'dateTo'>
    ) => void
  ) {
    this.echartsInstance = echartsInstance;
    this.currentTimeRange = {
      dateFrom: new Date(timeRange.dateFrom),
      dateTo: new Date(timeRange.dateTo),
    };

    const measurementsForDatapoints: Observable<DatapointRealtimeMeasurements>[] =
      datapoints.map((dp) => {
        const source$: Observable<IMeasurement> =
          this.measurementRealtime.onCreateOfSpecificMeasurement$(
            dp.fragment,
            dp.series,
            dp.__target.id
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
              this.currentTimeRange.dateFrom.valueOf() + this.INTERVAL
            ),
            dateTo: new Date(
              this.currentTimeRange.dateTo.valueOf() + this.INTERVAL
            ),
          };
          timeRangeChangedCallback(this.currentTimeRange);
        }),
        throttleTime(updateThrottleTime)
      )
    ).pipe(throttleTime(this.MIN_REALTIME_TIMEOUT));

    const events$ = interval(this.INTERVAL).pipe(
      switchMap(() => this.loadEvents().pipe(throttleTime(updateThrottleTime)))
    );

    const alarms$ = interval(this.INTERVAL).pipe(
      switchMap(() => this.loadAlarms().pipe(throttleTime(updateThrottleTime)))
    );

    this.realtimeSubscription = combineLatest([
      measurement$.pipe(buffer(bufferReset$)),
      events$,
      alarms$,
    ]).subscribe(([measurements, events, alarms]) => {
      this.updateChartInstance(
        measurements,
        events,
        alarms,
        datapointOutOfSyncCallback
      );
    });
  }

  stopRealtime() {
    this.realtimeSubscription?.unsubscribe();
  }

  private loadEvents(): Observable<any> {
    const timeRange = {
      dateFrom: this.currentTimeRange.dateFrom.toISOString(),
      dateTo: this.currentTimeRange.dateTo.toISOString(),
    };
    return this.eventsService.listEvents$(timeRange, [
      {
        __target: { id: '7713695199' },
        filters: { type: 'TestEvent' },
        color: '#08293F',
      },
      {
        __target: { id: '7713695199' },
        filters: { type: 'AnotherEventType' },
        color: '#349EDF',
      },
      {
        __target: { id: '352734984' },
        filters: { type: 'AnotherEventType' },
        color: '#349EDF',
      },
    ]);
  }

  private loadAlarms(): Observable<any> {
    const timeRange = {
      dateFrom: this.currentTimeRange.dateFrom.toISOString(),
      dateTo: this.currentTimeRange.dateTo.toISOString(),
    };
    return this.alarmsService.listAlarms$(timeRange, [
      {
        __target: { id: '7713695199' },
        filters: { type: 'TestAlarm' },
        color: '#08293F',
      },
      {
        __target: { id: '7713695199' },
        filters: { type: 'AnotherAlarmType' },
        color: '#349EDF',
      },
      {
        __target: { id: '352734984' },
        filters: { type: 'AnotherAlarmType' },
        color: '#349EDF',
      },
    ]);
  }

  private removeValuesBeforeTimeRange(series: SeriesOption): SeriesValue[] {
    const firstValidValueByDateIndex = (series.data as SeriesValue[]).findIndex(
      ([dateString, _]) => {
        return new Date(dateString) >= this.currentTimeRange.dateFrom;
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
    events: IEvent[],
    alarms: IAlarm[],
    datapointOutOfSyncCallback: (dp: DatapointsGraphKPIDetails) => void
  ) {
    const seriesDataToUpdate = new Map<
      DatapointsGraphKPIDetails,
      IMeasurement[]
    >();
    receivedMeasurements.forEach(({ datapoint, measurement }) => {
      if (!seriesDataToUpdate.has(datapoint)) {
        seriesDataToUpdate.set(datapoint, []);
      }
      seriesDataToUpdate.get(datapoint).push(measurement);
    });

    const allDataSeries = this.echartsInstance.getOption()
      .series as SeriesOption[];

    seriesDataToUpdate.forEach((measurements, datapoint) => {
      const newValues: SeriesValue[] = measurements.map((m) => [
        m.time as string,
        m[datapoint.fragment][datapoint.series].value,
      ]);
      const datapointId =
        datapoint.__target.id + datapoint.fragment + datapoint.series;
      const seriesMatchingDatapoint: SeriesOption = allDataSeries.find(
        (s: SeriesOption & SeriesDatapointInfo) => s.datapointId === datapointId
      );
      const seriesDataToUpdate = seriesMatchingDatapoint.data as SeriesValue[];
      seriesDataToUpdate.push(...newValues);

      seriesMatchingDatapoint.data = this.removeValuesBeforeTimeRange(
        seriesMatchingDatapoint
      );

      events.forEach((event) => {
        const eventExists = allDataSeries.some((series: { data: any[] }) =>
          series.data.some((data) => data[0] === event.creationTime)
        );
        if (!eventExists && event.source.id === datapoint.__target.id) {
          const renderType: DatapointChartRenderType =
            datapoint.renderType || 'min';
          if (
            typeof seriesMatchingDatapoint.data === 'object' &&
            seriesMatchingDatapoint.data !== null
          ) {
            const dp: DatapointWithValues = {
              ...datapoint,
              values: seriesMatchingDatapoint.data as {
                [date: string]: { min: number; max: number }[];
              },
            };
            const eventId = `${event.type}+${dp.__target.id}+${Date.now()}`;
            const newEventSeries = this.echartsOptionsService.getEventSeries(
              dp,
              renderType,
              false,
              [event],
              eventId
            );
            allDataSeries.push(...newEventSeries);
          }
        }
      });

      alarms.forEach((alarm) => {
        const alarmExists = allDataSeries.some((series: { data: any[] }) =>
          series.data.some((data) => data[0] === alarm.creationTime)
        );
        if (!alarmExists && alarm.source.id === datapoint.__target.id) {
          const renderType: DatapointChartRenderType =
            datapoint.renderType || 'min';
          if (
            typeof seriesMatchingDatapoint.data === 'object' &&
            seriesMatchingDatapoint.data !== null
          ) {
            const dp: DatapointWithValues = {
              ...datapoint,
              values: seriesMatchingDatapoint.data as {
                [date: string]: { min: number; max: number }[];
              },
            };
            const alarmId = `${alarm.type}+${dp.__target.id}+${Date.now()}`;
            const newAlarmSeries = this.echartsOptionsService.getAlarmSeries(
              dp,
              renderType,
              false,
              [alarm],
              alarmId
            );
            allDataSeries.push(...newAlarmSeries);
          }
        }
      });

      this.checkForValuesAfterTimeRange(
        seriesMatchingDatapoint.data as SeriesValue[],
        datapoint,
        datapointOutOfSyncCallback
      );
    });

    this.echartsInstance.setOption({
      xAxis: {
        min: this.currentTimeRange.dateFrom,
        max: this.currentTimeRange.dateTo,
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
