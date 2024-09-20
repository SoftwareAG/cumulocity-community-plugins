import {
  AXIS_TYPES,
  CHART_LINE_TYPES,
  CHART_RENDER_TYPES,
  KPIDetails,
} from '@c8y/ngx-components/datapoint-selector';
import { DateTimeContext, gettext } from '@c8y/ngx-components';
import {
  aggregationType,
  AlarmStatusType,
  IMeasurement,
  ISeries,
  Severity,
} from '@c8y/client';
import type {
  BarSeriesOption,
  LineSeriesOption,
  ScatterSeriesOption,
} from 'echarts';
import {
  AlarmDetails,
  EventDetails,
} from '@c8y/ngx-components/alarm-event-selector';
import { TooltipFormatterCallback } from 'echarts/types/src/util/types';
import { TopLevelFormatterParams } from 'echarts/types/src/component/tooltip/TooltipModel';

export type DatapointsGraphKPIDetails = KPIDetails & {
  lineType?: DatapointLineType;
  renderType?: DatapointChartRenderType;
};

export type DatapointsGraphWidgetConfig = {
  datapoints?: DatapointsGraphKPIDetails[] | null;
  alarmsEventsConfigs?: AlarmOrEventExtended[];
  date?: DateTimeContext;
  displayDateSelection?: boolean | null;
  displayAggregationSelection?: boolean | null;
  widgetInstanceGlobalTimeContext?: boolean | null;
  displayMarkedLine?: boolean;
  displayMarkedPoint?: boolean;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  activeAlarmTypesOutOfRange?: string[];
  interval?: Interval['id'] | null;
  aggregation?: aggregationType | null;
  realtime?: boolean | null;
  yAxisSplitLines?: boolean | null;
  xAxisSplitLines?: boolean | null;
};

export type AlarmDetailsExtended = AlarmDetails & {
  __hidden?: boolean;
  __severity?: SeverityType[];
  __status?: AlarmStatusType[];
};

export type EventDetailsExtended = EventDetails & {
  __hidden?: boolean;
};

/**
 * @description: Extended AlarmOrEvent type which includes properties from the incoming alarms/events. This interface can be used when the expected data can be either events or alarms.
 */
export type AlarmOrEventExtended = AlarmDetailsExtended | EventDetailsExtended;

export type DatapointsGraphWidgetTimeProps = Partial<
  Pick<
    DatapointsGraphWidgetConfig,
    'interval' | 'dateFrom' | 'dateTo' | 'aggregation' | 'realtime'
  >
>;

export enum DATE_SELECTION {
  CONFIG = 'config',
  VIEW_AND_CONFIG = 'view_and_config',
  DASHBOARD_CONTEXT = 'dashboard_context',
}

const todayDate = new Date();
export enum TimeSpanInMs {
  'MINUTE' = 1000 * 60,
  'HOUR' = 1000 * 60 * 60,
  'DAY' = 1000 * 60 * 60 * 24,
  'WEEK' = 1000 * 60 * 60 * 24 * 7,
  'MONTH' = todayDate.valueOf() -
    new Date(todayDate.setMonth(todayDate.getMonth() - 1)).valueOf(),
}

export type Interval = {
  id: 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'custom';
  title: string;
  timespanInMs: TimeSpanInMs | null;
};

export const INTERVALS = [
  {
    id: 'minutes',
    title: gettext('Last minute'),
    timespanInMs: TimeSpanInMs.MINUTE,
  },
  {
    id: 'hours',
    title: gettext('Last hour'),
    timespanInMs: TimeSpanInMs.HOUR,
  },
  {
    id: 'days',
    title: gettext('Last day'),
    timespanInMs: TimeSpanInMs.DAY,
  },
  {
    id: 'weeks',
    title: gettext('Last week'),
    timespanInMs: TimeSpanInMs.WEEK,
  },
  {
    id: 'months',
    title: gettext('Last month'),
    timespanInMs: TimeSpanInMs.MONTH,
  },
  { id: 'custom', title: gettext('Custom'), timespanInMs: null },
] as const satisfies ReadonlyArray<Interval>;

export type Aggregation = {
  value: aggregationType | null;
  name: string;
};

export const AGGREGATIONS: Aggregation[] = [
  { value: null, name: gettext('None') },
  { value: aggregationType.MINUTELY, name: gettext('Minutely') },
  { value: aggregationType.HOURLY, name: gettext('Hourly') },
  { value: aggregationType.DAILY, name: gettext('Daily') },
];

export const AGGREGATION_LIMITS = {
  MINUTELY_LIMIT: TimeSpanInMs.MINUTE * 10,
  HOURLY_LIMIT: TimeSpanInMs.DAY * 1,
  DAILY_LIMIT: TimeSpanInMs.DAY * 4,
};

type DatapointApiValues = ISeries['values'];
export interface DatapointWithValues extends DatapointsGraphKPIDetails {
  values: DatapointApiValues;
}

type DataPointValues = {
  min: number;
  max: number;
};
export type DpValuesItem = {
  time: number;
  values: DataPointValues[];
};

export interface MarkPointData {
  coord: [string, number | DataPointValues | null];
  name: string;
  itemType: string;
  itemStyle: { color: string };
  symbol?: string; // Symbol to display for the mark point (reference to ICONS_MAP)
  symbolSize?: number;
}

export interface MarkLineData {
  xAxis: string | undefined;
  itemType: string;
  label: {
    show: boolean;
    formatter: TooltipFormatterCallback<TopLevelFormatterParams> | string;
  };
  itemStyle: { color: string };
}

export type DatapointLineType = (typeof CHART_LINE_TYPES)[number]['val'];
export type EchartsSeriesOptions =
  | LineSeriesOption
  | ScatterSeriesOption
  | BarSeriesOption;

export type DatapointAxisType = (typeof AXIS_TYPES)[number]['val'];

export type DatapointChartRenderType =
  (typeof CHART_RENDER_TYPES)[number]['val'];

export const REALTIME_TEXTS = {
  ACTIVE: gettext('Realtime active'),
  INACTIVE: gettext('Realtime inactive'),
} as const;

export const AGGREGATION_ICONS = {
  undefined: 'line-chart',
  MINUTELY: 'hourglass',
  HOURLY: 'clock-o',
  DAILY: 'calendar-o',
} as const;

export const AGGREGATION_TEXTS = {
  undefined: gettext('No aggregation'),
  MINUTELY: gettext('Minutely aggregation'),
  HOURLY: gettext('Hourly aggregation'),
  DAILY: gettext('Daily aggregation'),
} as const;

export type DateString = string;
export type SeriesValue = [DateString, number];

export type DatapointRealtimeMeasurements = {
  measurement: IMeasurement;
  datapoint: DatapointsGraphKPIDetails;
};

export type YAxisOptions = {
  showSplitLines: boolean;
};

export interface SeriesDatapointInfo {
  datapointId?: string;
  datapointLabel?: string;
  datapointUnit?: string;
}

export const SEVERITY_LABELS = {
  CRITICAL: gettext('Critical`alarm`') as 'CRITICAL',
  MAJOR: gettext('Major`alarm`') as 'MAJOR',
  MINOR: gettext('Minor`alarm`') as 'MINOR',
  WARNING: gettext('Warning`alarm`') as 'WARNING',
} as const;

export type SeverityType = keyof typeof Severity;

export const ALARM_SEVERITY_ICON = {
  CIRCLE: 'circle',
  HIGH_PRIORITY: 'high-priority',
  WARNING: 'warning',
  EXCLAMATION_CIRCLE: 'exclamation-circle',
} as const;

export const ALARM_SEVERITY_ICON_MAP = {
  [Severity.CRITICAL]: ALARM_SEVERITY_ICON.EXCLAMATION_CIRCLE,
  [Severity.MAJOR]: ALARM_SEVERITY_ICON.WARNING,
  [Severity.MINOR]: ALARM_SEVERITY_ICON.HIGH_PRIORITY,
  [Severity.WARNING]: ALARM_SEVERITY_ICON.CIRCLE,
} as const;
