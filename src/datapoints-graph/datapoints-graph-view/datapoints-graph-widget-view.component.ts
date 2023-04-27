import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
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

@Component({
  selector: 'c8y-datapoints-graph-widget-view',
  templateUrl: './datapoints-graph-widget-view.component.html',
  styleUrls: ['./datapoints-graph-widget-view.less'],
  encapsulation: ViewEncapsulation.None,
})
export class DatapointsGraphWidgetViewComponent
  implements OnChanges, OnInit, OnDestroy
{
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

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.initForm();
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

  updateTimeRangeOnRealtime(
    timeRange: Pick<DatapointsGraphWidgetConfig, 'dateFrom' | 'dateTo'>
  ): void {
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

  private initForm(): void {
    this.timeControlsFormGroup = this.formBuilder.group({
      dateFrom: [null, [Validators.required]],
      dateTo: [null, [Validators.required]],
      interval: ['hours', [Validators.required]],
      aggregation: null,
      realtime: [false, [Validators.required]],
    });
    this.timeControlsFormGroup.patchValue(this.displayConfig);
  }
}
