import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import {
  AGGREGATION_ICONS,
  AGGREGATION_TEXTS,
  DatapointsGraphKPIDetails,
  DatapointsGraphWidgetConfig,
  DatapointsGraphWidgetTimeProps,
} from '../model';
import { DynamicComponentAlertAggregator, gettext } from '@c8y/ngx-components';
import { cloneDeep } from 'lodash-es';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs/internal/Subject';
import { ChartEventsService } from './chart-events.service';
import { ChartAlarmsService } from './chart-alarms.service';
import { IAlarm, IEvent } from '@c8y/client';

@Component({
  selector: 'c8y-datapoints-graph-widget-view',
  templateUrl: './datapoints-graph-widget-view.component.html',
  styleUrls: ['./datapoints-graph-widget-view.less'],
  encapsulation: ViewEncapsulation.None,
})
export class DatapointsGraphWidgetViewComponent
  implements OnChanges, OnDestroy
{
  events: IEvent[] = [];
  alarms: IAlarm[] = [];
  filteredAlarms: IAlarm[] = [];
  filteredEvents: IEvent[] = [];
  AGGREGATION_ICONS = AGGREGATION_ICONS;
  AGGREGATION_TEXTS = AGGREGATION_TEXTS;
  alerts: DynamicComponentAlertAggregator;
  datapointsOutOfSync = new Map<DatapointsGraphKPIDetails, boolean>();
  toolboxDisabled = false;
  timeControlsFormGroup: FormGroup;

  @Input() set config(value: DatapointsGraphWidgetConfig) {
    this.displayConfig = cloneDeep(value);
  }
  get config(): never {
    throw Error(
      '"config" property should not be referenced in view component to avoid mutating data.'
    );
  }
  displayConfig: DatapointsGraphWidgetConfig;
  readonly disableZoomInLabel = gettext('Disable zoom in');
  readonly enableZoomInLabel = gettext(
    'Click to enable zoom, then click and drag on the desired area in the chart.'
  );
  readonly hideDatapointLabel = gettext('Hide data point');
  readonly showDatapointLabel = gettext('Show data point');
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private eventsService: ChartEventsService,
    private alarmsService: ChartAlarmsService
  ) {
    this.initForm();
    this.timeControlsFormGroup.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (value) => {
        this.alarms = await this.loadAlarms(value);
        this.events = await this.loadEvents(value);
        this.displayConfig = { ...this.displayConfig, ...value };
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.timeControlsFormGroup.patchValue(this.displayConfig);
    if (
      changes.config?.currentValue?.date &&
      changes.config?.currentValue?.widgetInstanceGlobalTimeContext
    ) {
      this.timePropsChanged({
        dateFrom: this.displayConfig.date[0],
        dateTo: this.displayConfig.date[1],
      });
    }
  }

  timePropsChanged(timeProps: DatapointsGraphWidgetTimeProps): void {
    this.timeControlsFormGroup.patchValue(timeProps);
  }

  async updateTimeRangeOnRealtime(
    timeRange: Pick<DatapointsGraphWidgetConfig, 'dateFrom' | 'dateTo'>
  ): Promise<void> {
    this.alarms = await this.loadAlarms(timeRange);
    this.events = await this.loadEvents(timeRange);
    this.timeControlsFormGroup.patchValue(timeRange, { emitEvent: false });
  }

  toggleChart(datapoint: DatapointsGraphKPIDetails): void {
    datapoint.__active = !datapoint.__active;
    this.displayConfig = { ...this.displayConfig };
    this.toolboxDisabled =
      this.displayConfig.datapoints.filter((dp) => dp.__active).length === 0;
  }

  handleDatapointOutOfSync(dpOutOfSync: DatapointsGraphKPIDetails): void {
    const key = (dp) => dp.__target.id + dp.fragment + dp.series;
    const dpMatch = this.displayConfig.datapoints.find(
      (dp) => key(dp) === key(dpOutOfSync)
    );
    this.datapointsOutOfSync.set(dpMatch, true);
  }

  toggleAlarmEventType(AlarmOrEvent: IAlarm | IEvent) {
    const alarms = this.alarms;
    const typeToHide = AlarmOrEvent.type;

    for (const alarm of alarms) {
      if (alarm.type === typeToHide) {
        alarm.__hidden = !alarm.__hidden;
      }
    }

    this.displayConfig = { ...this.displayConfig };
  }

  private initForm(): void {
    this.timeControlsFormGroup = this.formBuilder.group({
      dateFrom: [null, [Validators.required]],
      dateTo: [null, [Validators.required]],
      interval: ['hours', [Validators.required]],
      aggregation: null,
      realtime: [false, [Validators.required]],
      widgetInstanceGlobalTimeContext: [false, []],
    });
    this.timeControlsFormGroup.patchValue(this.displayConfig);
  }

  private loadEvents(timeRange): Promise<any> {
    const formattedTimeRange = {
      dateFrom: new Date(timeRange.dateFrom).toISOString(),
      dateTo: new Date(timeRange.dateTo).toISOString(),
    };
    return this.eventsService.listEvents$(formattedTimeRange, [
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

  private loadAlarms(timeRange): Promise<any> {
    const formattedTimeRange = {
      dateFrom: new Date(timeRange.dateFrom).toISOString(),
      dateTo: new Date(timeRange.dateTo).toISOString(),
    };
    return this.alarmsService.listAlarms$(formattedTimeRange, [
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
}
