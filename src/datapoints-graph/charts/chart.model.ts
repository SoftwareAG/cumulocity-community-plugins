export interface CustomSeriesOptions extends echarts.EChartsOption {
  // typeOfSeries is used for formatter to distinguish between events/alarms series and datapoints
  typeOfSeries?: string;
  id: string;
}

// Add the following info to a markdown file:

/* Alarm properties related to time:
  time --> Used for filtering alarms in the BE. So it could happen that the alarm is not displayed in the graph
  because lastUpdated might fit the timeframe while time does not.

  firstOccurrrence ----> Value which should be used to display the first occurrence of the alarm in the graph.
  creationTime --> Should NOT be used as it is the time in which the request was created, not the time in which the alarm was created.
  lastUpdated --> Time in which the alarm was last updated. NOTE: Clearing an alarm updated the lastUpdated, but does
  not update the time property!
  */
