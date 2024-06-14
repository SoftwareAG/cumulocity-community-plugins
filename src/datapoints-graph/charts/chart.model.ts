import { SeriesValue } from '../model';

export interface CustomSeriesOptions extends echarts.EChartsOption {
  // typeOfSeries is used for formatter to distinguish between events/alarms series and datapoints
  typeOfSeries?: 'alarm' | 'event' | null;
  id: string;
  data: SeriesValue[];
  itemStyle: { color: string };
}

// Add the following info to a markdown file:

/* Alarm properties related to time:
  time --> Used for filtering alarms in the BE. So it could happen that the alarm is not displayed in the graph
  because lastUpdated might fit the timeframe while time does not. When a new occurrence of the alarm happens, the time property is
  updated together with the lastUpdated property. On the other hand for severity changes (e.g. via smart rules) and
  clearing the alarm, only the lastUpdated property is updated.

  firstOccurrence ----> Time in which the alarm was first raised. So if a new occurrence of the alarm happens,
  the count property is increased, but the firstOccurrence is not updated.
  
  
  creationTime --> Time in which the alarm was created. Can be used to filter alarms in the BE using creationTimeTo and
  creationTimeFrom.


  lastUpdated --> Time in which the alarm was last updated. NOTE: Clearing an alarm updated the lastUpdated, but does
  not update the time property! Can also be used to filter alarms in the BE using lastUpdatedTo and lastUpdatedFrom.
  Note that using only that filter could also miss alarms that were created before the lastUpdatedFrom.
  */
