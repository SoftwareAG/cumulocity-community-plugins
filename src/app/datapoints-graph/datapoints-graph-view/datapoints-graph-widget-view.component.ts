import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  AGGREGATION_ICONS,
  AGGREGATION_TEXTS,
  DatapointsGraphKPIDetails,
  DatapointsGraphWidgetConfig,
  DatapointsGraphWidgetTimeProps,
  SEVERITY_LABELS,
  SeverityType,
  Interval,
} from '../model';
import { DynamicComponentAlertAggregator, gettext } from '@c8y/ngx-components';
import { cloneDeep } from 'lodash-es';
import { FormBuilder, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs/internal/Subject';
import {
  AlarmDetails,
  AlarmOrEvent,
  EventDetails,
} from '../alarm-event-selector';
import {
  ALARM_STATUS_LABELS,
  AlarmStatusType,
  SeveritySettings,
  aggregationType,
} from '@c8y/client';
import type { KPIDetails } from '@c8y/ngx-components/datapoint-selector';
import { ChartsComponent } from '../charts';

@Component({
  selector: 'c8y-datapoints-graph-widget-view',
  templateUrl: './datapoints-graph-widget-view.component.html',
  styleUrls: ['./datapoints-graph-widget-view.less'],
  encapsulation: ViewEncapsulation.None,
})
export class DatapointsGraphWidgetViewComponent
  implements OnChanges, OnDestroy
{
  events: EventDetails[] = [];
  alarms: AlarmDetails[] = [];
  AGGREGATION_ICONS = AGGREGATION_ICONS;
  AGGREGATION_TEXTS = AGGREGATION_TEXTS;
  alerts: DynamicComponentAlertAggregator | undefined;
  datapointsOutOfSync = new Map<DatapointsGraphKPIDetails, boolean>();
  toolboxDisabled = false;
  timeControlsFormGroup: ReturnType<
    DatapointsGraphWidgetViewComponent['initForm']
  >;
  isMarkedAreaEnabled = false;
  /*
   * @description: The type of alarm that has marked area enabled.
   */
  enabledMarkedAreaAlarmType: string | undefined;

  @Input() set config(value: DatapointsGraphWidgetConfig) {
    this.displayConfig = cloneDeep(value);
  }
  get config(): never {
    throw Error(
      '"config" property should not be referenced in view component to avoid mutating data.'
    );
  }
  @ViewChild(ChartsComponent) chartComponent!: ChartsComponent;
  displayConfig: DatapointsGraphWidgetConfig | undefined;
  readonly disableZoomInLabel = gettext('Disable zoom in');
  readonly enableZoomInLabel = gettext(
    'Click to enable zoom, then click and drag on the desired area in the chart.'
  );
  readonly hideDatapointLabel = gettext('Hide data point');
  readonly showDatapointLabel = gettext('Show data point');
  readonly severitiesList = Object.keys(SEVERITY_LABELS) as SeverityType[];
  private destroy$ = new Subject<void>();

  constructor(private formBuilder: FormBuilder) {
    this.timeControlsFormGroup = this.initForm();
    this.timeControlsFormGroup.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.displayConfig = { ...this.displayConfig, ...value };
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.timeControlsFormGroup.patchValue(this.displayConfig || {});
    const config: DatapointsGraphWidgetConfig = changes['config']?.currentValue;
    if (
      config?.date &&
      config?.widgetInstanceGlobalTimeContext &&
      this.displayConfig?.date
    ) {
      this.timePropsChanged({
        dateFrom: this.displayConfig?.date[0],
        dateTo: this.displayConfig?.date[1],
      });
    }
  }

  timePropsChanged(timeProps: DatapointsGraphWidgetTimeProps): void {
    this.timeControlsFormGroup.patchValue(timeProps);
  }

  updateTimeRangeOnRealtime(
    timeRange: Pick<DatapointsGraphWidgetConfig, 'dateFrom' | 'dateTo'>
  ): void {
    this.timeControlsFormGroup.patchValue(timeRange, { emitEvent: false });
  }

  toggleChart(datapoint: DatapointsGraphKPIDetails): void {
    datapoint.__active = !datapoint.__active;
    this.displayConfig = { ...this.displayConfig };
    this.toolboxDisabled =
      this.displayConfig.datapoints?.filter((dp) => dp.__active).length === 0;
  }

  handleDatapointOutOfSync(dpOutOfSync: DatapointsGraphKPIDetails): void {
    const key = (dp: KPIDetails) => dp.__target?.id + dp.fragment + dp.series;
    const dpMatch = this.displayConfig?.datapoints?.find(
      (dp) => key(dp) === key(dpOutOfSync)
    );
    if (!dpMatch) {
      return;
    }
    this.datapointsOutOfSync.set(dpMatch, true);
  }

  toggleMarkedArea(alarm: AlarmDetails) {
    this.enabledMarkedAreaAlarmType = alarm.filters.type;
    const params = {
      data: {
        itemType: alarm.filters.type,
      },
    };
    this.chartComponent.onChartClick(params);
  }

  toggleAlarmEventType(alarmOrEvent: AlarmOrEvent): void {
    if (alarmOrEvent.timelineType === 'ALARM') {
      this.alarms = this.alarms.map((alarm) => {
        if (alarm.filters.type === alarmOrEvent.filters.type) {
          alarm.__hidden = !alarm.__hidden;
        }
        return alarm;
      });
    } else {
      this.events = this.events.map((event) => {
        if (event.filters.type === alarmOrEvent.filters.type) {
          event.__hidden = !event.__hidden;
        }
        return event;
      });
    }
    this.displayConfig = { ...this.displayConfig };
  }

  updateAlarmsAndEvents(alarmsEventsConfigs: AlarmOrEvent[]): void {
    this.alarms = alarmsEventsConfigs.filter(
      (alarm) => alarm.timelineType === 'ALARM'
    ) as AlarmDetails[];
    this.events = alarmsEventsConfigs.filter(
      (event) => event.timelineType === 'EVENT'
    ) as EventDetails[];
  }

  filterSeverity(eventTarget: {
    showCleared: boolean;
    severityOptions: SeveritySettings;
  }): void {
    this.alarms = this.alarms.map((alarm) => {
      if (!alarm.__severity) {
        alarm.__severity = [];
      }
      alarm.__severity = Object.keys(eventTarget.severityOptions).filter(
        (severity): severity is keyof SeveritySettings =>
          eventTarget.severityOptions[severity as keyof SeveritySettings]
      ) as SeverityType[];

      if (!alarm.__status) {
        alarm.__status = [];
      }
      const statuses = Object.keys(ALARM_STATUS_LABELS) as AlarmStatusType[];
      const filteredStatuses = eventTarget.showCleared
        ? statuses
        : statuses.filter((status) => status !== 'CLEARED');
      alarm.__status = filteredStatuses;
      return alarm;
    });
    this.displayConfig = { ...this.displayConfig };
  }

  private initForm() {
    const form = this.formBuilder.group({
      dateFrom: [undefined as unknown as Date, [Validators.required]],
      dateTo: [undefined as unknown as Date, [Validators.required]],
      interval: ['hours' as Interval['id'], [Validators.required]],
      aggregation: [null as aggregationType | null, []],
      realtime: [false, [Validators.required]],
      widgetInstanceGlobalTimeContext: [false, []],
    });
    form.patchValue(this.displayConfig || {});
    return form;
  }
}
