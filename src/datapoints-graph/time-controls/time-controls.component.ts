import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  AGGREGATION_LIMITS,
  DatapointsGraphWidgetConfig,
  DatapointsGraphWidgetTimeProps,
  Interval,
  INTERVALS,
  TimeSpanInMs,
} from '../model';
import { DateTimeContext } from '@c8y/ngx-components';
import { aggregationType } from '@c8y/client';

@Component({
  selector: 'c8y-time-controls',
  templateUrl: './time-controls.component.html',
})
export class TimeControlsComponent implements OnInit, OnChanges {
  timeRange: DateTimeContext;
  @Input() controlsAvailable: Partial<
    Record<'timeRange' | 'interval' | 'aggregation' | 'realtime', boolean>
  > = {
    timeRange: true,
    interval: true,
    aggregation: true,
    realtime: true,
  };
  @Input() config: DatapointsGraphWidgetConfig;
  @Output() configTimePropsChange =
    new EventEmitter<DatapointsGraphWidgetTimeProps>();
  disabledAggregations: Partial<Record<aggregationType, boolean>> = {};

  ngOnInit() {
    if (this.config.dateFrom && this.config.dateTo) {
      this.calculateAggregation([this.config.dateFrom, this.config.dateTo]);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    const { dateFrom, dateTo } = changes.config?.currentValue ?? {};
    this.timeRange = [this.castToDate(dateFrom), this.castToDate(dateTo)];
  }

  timeRangeChange([dateFrom, dateTo]: DateTimeContext): void {
    this.configTimePropsChange.emit({
      interval: 'custom',
      dateFrom,
      dateTo,
      ...(this.controlsAvailable.aggregation && {
        aggregation: this.calculateAggregation([dateFrom, dateTo]),
      }),
    });
  }

  intervalChange(intervalId: Interval['id']): void {
    if (intervalId === 'custom') {
      this.configTimePropsChange.emit({ interval: intervalId });
      return;
    }
    const dateTo = new Date();
    const timeSpanInMs = INTERVALS.find(
      (i) => i.id === intervalId
    ).timespanInMs;
    const dateFrom = new Date(dateTo.valueOf() - timeSpanInMs);
    this.configTimePropsChange.emit({
      interval: intervalId,
      dateFrom,
      dateTo,
      ...(this.controlsAvailable.aggregation &&
        !this.config.realtime && {
          aggregation: this.calculateAggregation([dateFrom, dateTo]),
        }),
    });
  }

  aggregationChange(aggregation: aggregationType): void {
    this.configTimePropsChange.emit({ aggregation });
  }

  realtimeChange(realtime: boolean) {
    this.configTimePropsChange.emit({ realtime, aggregation: null });
  }

  private calculateAggregation([
    dateFrom,
    dateTo,
  ]: DateTimeContext): aggregationType {
    const timeRangeInMs = dateTo.valueOf() - dateFrom.valueOf();
    this.disabledAggregations = {
      DAILY: timeRangeInMs <= TimeSpanInMs.DAY,
      HOURLY: timeRangeInMs <= TimeSpanInMs.HOUR,
      MINUTELY: timeRangeInMs <= TimeSpanInMs.MINUTE,
    };
    const isProperAggregation =
      this.config.aggregation &&
      !this.disabledAggregations[this.config.aggregation];
    if (isProperAggregation) {
      return this.config.aggregation;
    }

    if (timeRangeInMs >= AGGREGATION_LIMITS.DAILY_LIMIT) {
      return aggregationType.DAILY;
    } else if (timeRangeInMs >= AGGREGATION_LIMITS.HOURLY_LIMIT) {
      return aggregationType.HOURLY;
    } else if (timeRangeInMs >= AGGREGATION_LIMITS.MINUTELY_LIMIT) {
      return aggregationType.MINUTELY;
    } else {
      return null;
    }
  }

  private castToDate(date: Date | string): Date {
    return date instanceof Date ? date : new Date(date);
  }
}
