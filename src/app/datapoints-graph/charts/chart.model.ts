import {
  ECBasicOption,
  TooltipFormatterCallback,
} from 'echarts/types/src/util/types';
import { MarkLineData, MarkPointData, SeriesValue } from '../model';
import { TopLevelFormatterParams } from 'echarts/types/src/component/tooltip/TooltipModel';

interface ModifiedCustomSeriesOptions extends echarts.EChartsOption {
  // typeOfSeries is used for formatter to distinguish between events/alarms series
  typeOfSeries?: 'alarm' | 'event' | null;
  id: string;
  data: SeriesValue[];
  itemStyle: { color: string };
}

export interface customSeriesMarkLineData {
  data: MarkLineData[];
}

export interface customSeriesMarkPointData {
  data: MarkPointData[];
}

export type CustomSeriesOptions = Omit<ModifiedCustomSeriesOptions, 'tooltip'>;
export interface EchartsCustomOptions extends ECBasicOption {
  tooltip: {
    formatter: TooltipFormatterCallback<TopLevelFormatterParams> | string;
  }[];
}

export interface MeasurementSeries {
  min: number | null;
  max: number | null;
}
