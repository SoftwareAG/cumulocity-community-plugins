import {
  AXIS_TYPES,
  CHART_LINE_TYPES,
  CHART_RENDER_TYPES,
  KPIDetails,
} from '@c8y/ngx-components/datapoint-selector';
import { DateTimeContext, gettext } from '@c8y/ngx-components';
import { aggregationType, IMeasurement, ISeries } from '@c8y/client';
import type {
  BarSeriesOption,
  LineSeriesOption,
  ScatterSeriesOption,
} from 'echarts';
import { AlarmOrEvent } from '../alarm-event-selector';

export type DatapointsGraphKPIDetails = KPIDetails & {
  lineType?: DatapointLineType;
  renderType?: DatapointChartRenderType;
};

export type DatapointsGraphWidgetConfig = {
  datapoints: DatapointsGraphKPIDetails[];
  alarmsEventsConfigs: AlarmOrEvent[];
  date?: DateTimeContext;
  displayDateSelection?: boolean;
  displayAggregationSelection?: boolean;
  widgetInstanceGlobalTimeContext?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  interval?: Interval['id'];
  aggregation?: aggregationType;
  realtime?: boolean;
  yAxisSplitLines?: boolean;
  xAxisSplitLines?: boolean;
};

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
  timespanInMs?: number;
};

export const INTERVALS: Interval[] = [
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
  { id: 'custom', title: gettext('Custom') },
];

export type Aggregation = {
  value: aggregationType;
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
  datapointId: string;
  datapointLabel: string;
  datapointUnit: string;
}
