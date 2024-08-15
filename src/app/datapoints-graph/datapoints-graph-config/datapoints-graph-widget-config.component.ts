import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {
  ControlContainer,
  FormBuilder,
  NgForm,
  Validators,
} from '@angular/forms';
import { Observable } from 'rxjs/internal/Observable';
import {
  DynamicComponentAlertAggregator,
  gettext,
  OnBeforeSave,
} from '@c8y/ngx-components';
import {
  DatapointsGraphKPIDetails,
  DatapointsGraphWidgetConfig,
  DatapointsGraphWidgetTimeProps,
  DATE_SELECTION,
  Interval,
} from '../model';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import {
  DatapointAttributesFormConfig,
  DatapointSelectorModalOptions,
} from '@c8y/ngx-components/datapoint-selector';
import { ActivatedRoute } from '@angular/router';
import { omit } from 'lodash-es';
import { aggregationType } from '@c8y/client';
import {
  AlarmDetails,
  EventDetails,
} from '@c8y/ngx-components/alarm-event-selector';

@Component({
  selector: 'c8y-datapoints-graph-widget-config',
  templateUrl: './datapoints-graph-widget-config.component.html',
  styleUrls: ['./datapoints-graph-widget-config.less'],
  encapsulation: ViewEncapsulation.None,
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
})
export class DatapointsGraphWidgetConfigComponent
  implements OnInit, OnBeforeSave, OnDestroy
{
  alerts: DynamicComponentAlertAggregator | undefined;
  @Input() config: DatapointsGraphWidgetConfig | undefined;
  formGroup: ReturnType<DatapointsGraphWidgetConfigComponent['initForm']>;
  DATE_SELECTION = DATE_SELECTION;
  dateSelection: DATE_SELECTION | undefined;
  dateSelectionHelp = this.translate.instant(
    gettext(`Choose how to select a date range, the available options are:
  <ul class="m-l-0 p-l-8 m-t-8 m-b-0">
    <li>
      <b>Widget configuration:</b>
      restricts the date selection only to the widget configuration
    </li>
    <li>
      <b>Widget and widget configuration:</b>
      restricts the date selection to the widget view and widget configuration only
    </li>
    <li>
      <b>Dashboard time range:</b>
      restricts date selection to the global dashboard configuration only
    </li>
  </ul>`)
  );
  datapointSelectDefaultFormOptions: Partial<DatapointAttributesFormConfig> = {
    showRange: true,
    showChart: true,
  };
  datapointSelectionConfig: Partial<DatapointSelectorModalOptions> = {};
  activeDatapointsExists = false;
  alarmsOrEventsHaveNoMatchingDps: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private form: NgForm,
    private translate: TranslateService,
    private route: ActivatedRoute
  ) {
    this.formGroup = this.initForm();
  }

  ngOnInit() {
    const context = this.route.root.firstChild?.snapshot.data?.['contextData'];
    if (context?.id) {
      this.datapointSelectionConfig.contextAsset = context;
    }
    this.form.form.addControl('config', this.formGroup);
    this.formGroup.patchValue(this.config || {});
    this.formGroup.controls.alarms.setValue(
      this.config?.alarmsEventsConfigs?.filter(
        (ae) => ae.timelineType === 'ALARM'
      ) as AlarmDetails[]
    );
    this.formGroup.controls.events.setValue(
      this.config?.alarmsEventsConfigs?.filter(
        (ae) => ae.timelineType === 'EVENT'
      ) as EventDetails[]
    );

    this.initDateSelection();
    this.setActiveDatapointsExists();
    this.checkForMatchingDatapoints();
    this.formGroup.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.config = {
          ...value,
          alarmsEventsConfigs: [
            ...(this.formGroup.value.alarms || []),
            ...(this.formGroup.value.events || []),
          ],
        };
        this.setActiveDatapointsExists();
        this.checkForMatchingDatapoints();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onBeforeSave(
    config?: DatapointsGraphWidgetConfig
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (this.formGroup.valid && config) {
      Object.assign(config, omit(this.formGroup.value, ['alarms', 'events']), {
        alarmsEventsConfigs: [
          ...(this.formGroup.value.alarms || []),
          ...(this.formGroup.value.events || []),
        ],
      });

      return true;
    }
    return false;
  }

  timePropsChanged(timeProps: DatapointsGraphWidgetTimeProps): void {
    this.formGroup.patchValue(timeProps);
  }

  updateTimeRangeOnRealtime(
    timeRange: Pick<DatapointsGraphWidgetConfig, 'dateFrom' | 'dateTo'>
  ): void {
    this.formGroup.patchValue(timeRange, { emitEvent: false });
  }

  dateSelectionChange(dateSelection: DATE_SELECTION): void {
    if (dateSelection === DATE_SELECTION.CONFIG) {
      this.formGroup.patchValue({
        displayDateSelection: false,
        widgetInstanceGlobalTimeContext: false,
      });
    } else if (dateSelection === DATE_SELECTION.VIEW_AND_CONFIG) {
      this.formGroup.patchValue({
        displayDateSelection: true,
        widgetInstanceGlobalTimeContext: false,
      });
    } else if (dateSelection === DATE_SELECTION.DASHBOARD_CONTEXT) {
      this.formGroup.patchValue({
        displayDateSelection: false,
        widgetInstanceGlobalTimeContext: true,
        realtime: false,
      });
    }
  }

  private checkForMatchingDatapoints(): void {
    const allMatch = this.config?.alarmsEventsConfigs?.every((ae) =>
      this.formGroup.value.datapoints?.some(
        (dp) => dp.__target?.id === ae.__target?.id
      )
    );

    queueMicrotask(() => {
      if (allMatch) {
        this.alarmsOrEventsHaveNoMatchingDps = false;
      } else {
        this.alarmsOrEventsHaveNoMatchingDps = true;
      }
    });
  }

  private initForm() {
    const form = this.formBuilder.group({
      datapoints: [
        [] as DatapointsGraphKPIDetails[],
        [Validators.required, Validators.minLength(1)],
      ],
      alarms: [[] as AlarmDetails[]],
      events: [[] as EventDetails[]],
      displayMarkedLine: [true, []],
      displayMarkedPoint: [true, []],
      displayDateSelection: [false, []],
      displayAggregationSelection: [false, []],
      widgetInstanceGlobalTimeContext: [false, []],
      canDecoupleGlobalTimeContext: [false, []],
      dateFrom: [null as unknown as Date, [Validators.required]],
      dateTo: [null as unknown as Date, [Validators.required]],
      interval: ['hours' as Interval['id'], [Validators.required]],
      aggregation: [null as aggregationType | null, []],
      realtime: [false, [Validators.required]],
      yAxisSplitLines: [false, [Validators.required]],
      xAxisSplitLines: [false, [Validators.required]],
    });
    return form;
  }

  private initDateSelection(): void {
    if (this.config?.widgetInstanceGlobalTimeContext) {
      this.dateSelection = DATE_SELECTION.DASHBOARD_CONTEXT;
    } else if (this.config?.displayDateSelection) {
      this.dateSelection = DATE_SELECTION.VIEW_AND_CONFIG;
    } else {
      this.dateSelection = DATE_SELECTION.CONFIG;
    }
  }

  private setActiveDatapointsExists() {
    this.activeDatapointsExists =
      (this.config?.datapoints?.filter((dp) => dp.__active)?.length || 0) > 0;
  }
}
