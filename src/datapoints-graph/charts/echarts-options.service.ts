import { Injectable } from '@angular/core';
import { DatePipe } from '@c8y/ngx-components';
import type { EChartsOption, SeriesOption } from 'echarts';
import { ECharts } from 'echarts';
import {
  DatapointChartRenderType,
  DatapointWithValues,
  DateString,
  DpValuesItem,
  MarkLineData,
  MarkPointData,
  SeriesDatapointInfo,
  SeriesValue,
} from '../model';
import { YAxisService } from './y-axis.service';
import { ChartTypesService } from './chart-types.service';
import type { TooltipFormatterCallback } from 'echarts/types/src/util/types';
import type { TopLevelFormatterParams } from 'echarts/types/src/component/tooltip/TooltipModel';
import { AlarmStatus, IAlarm, IEvent } from '@c8y/client';
import { ICONS_MAP } from './svg-icons.model';
import { CustomSeriesOptions } from './chart.model';

@Injectable()
export class EchartsOptionsService {
  echartsInstance: ECharts;

  constructor(
    private datePipe: DatePipe,
    private yAxisService: YAxisService,
    private chartTypesService: ChartTypesService
  ) {}

  getChartOptions(
    datapointsWithValues: DatapointWithValues[],
    timeRange: { dateFrom: string; dateTo: string },
    showSplitLines: { YAxis: boolean; XAxis: boolean },
    events: IEvent[],
    alarms: IAlarm[]
  ): EChartsOption {
    const yAxis = this.yAxisService.getYAxis(datapointsWithValues, {
      showSplitLines: showSplitLines.YAxis,
    });
    const leftAxis = yAxis.filter((yx) => yx.position === 'left');
    const gridLeft = leftAxis.length
      ? leftAxis.length * this.yAxisService.Y_AXIS_OFFSET
      : 16;
    const rightAxis = yAxis.filter((yx) => yx.position === 'right');
    const gridRight = rightAxis.length
      ? rightAxis.length * this.yAxisService.Y_AXIS_OFFSET
      : 16;
    return {
      grid: {
        containLabel: false, // axis labels are not taken into account to calculate graph grid
        left: gridLeft,
        top: 32,
        right: gridRight,
        bottom: 24,
      },
      dataZoom: {
        type: 'inside',
        // TODO: use 'none' only when this bug is fixed https://github.com/apache/echarts/issues/17858
        filterMode: datapointsWithValues.some((dp) => dp.lineType === 'bars')
          ? 'filter'
          : 'none',
        zoomOnMouseWheel: false,
      }, // on realtime, 'none' will cause extending chart line to left edge of the chart
      animation: false,
      toolbox: {
        show: true,
        itemSize: 0, // toolbox is needed for zooming in action, but we provide our own buttons
        feature: {
          dataZoom: {
            yAxisIndex: 'none',
          },
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          snap: true,
        },
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        formatter: this.getTooltipFormatter(),
        appendToBody: true,
      },
      legend: {
        show: false,
      },
      xAxis: {
        min: timeRange.dateFrom,
        max: timeRange.dateTo,
        type: 'time',
        animation: false,
        axisPointer: {
          label: {
            show: false,
          },
        },
        axisLine: {
          // align X axis to 0 of Y axis of datapoint with lineType 'bars'
          onZeroAxisIndex: datapointsWithValues.findIndex(
            (dp) => dp.lineType === 'bars'
          ),
        },
        axisLabel: {
          hideOverlap: true,
          borderWidth: 2, // as there is no margin for labels spacing, transparent border is a workaround
          borderColor: 'transparent',
        },
        splitLine: {
          show: showSplitLines.XAxis,
          lineStyle: { opacity: 0.8, type: 'dashed', width: 2 },
        },
      },
      yAxis,
      series: this.getChartSeries(datapointsWithValues, events, alarms),
    };
  }

  getAlarmOrEventSeries(
    dp: DatapointWithValues,
    renderType: DatapointChartRenderType,
    isMinMaxChart = false,
    items: IAlarm[] | IEvent[] = [],
    itemType: 'alarm' | 'event' = 'alarm',
    id?: string | number
  ): SeriesOption[] {
    if (!items.length) {
      return [];
    }

    //filter items that are not __hidden
    const filteredItems = items.filter((item) => !item.__hidden);
    const itemsByType = this.groupByType(filteredItems, 'type');
    const isAlarm = itemType === 'alarm';

    return Object.entries(itemsByType).map(
      ([type, itemsOfType]: [string, any]) => ({
        id: `${type}/${dp.__target.id}+${id ? id : ''}`,
        name: type,
        showSymbol: false,
        typeOfSeries: itemType,
        data: itemsOfType.map((item) => [
          item.creationTime,
          null,
          'markLineFlag',
        ]),
        markPoint: {
          showSymbol: true,
          data: itemsOfType.reduce((acc, item) => {
            if (dp.__target.id === item.source.id) {
              const isCleared = isAlarm && item.status === AlarmStatus.CLEARED;
              const isEvent = !isAlarm;
              return acc.concat(
                this.createMarkPoint(item, dp, isCleared, isEvent)
              );
            } else {
              return acc.concat([
                {
                  coord: [item.creationTime, null],
                  name: item.type,
                  itemType: item.type,
                  itemStyle: { color: item.color },
                },
              ]);
            }
          }, [] as any),
        },
        markLine: {
          showSymbol: true,
          symbol: ['none', 'none'],
          data: this.createMarkLine(itemsOfType),
        },
        ...this.chartTypesService.getSeriesOptions(
          dp,
          isMinMaxChart,
          renderType
        ),
      })
    ) as SeriesOption[];
  }

  getTooltipFormatterForAlarmAndEvents(
    tooltipParams: TooltipFormatterCallback<TopLevelFormatterParams>,
    params: { data: { itemType: string } },
    allEvents: IEvent[],
    allAlarms: IAlarm[]
  ): string {
    const XAxisValue: string = tooltipParams[0].data[0];
    const YAxisReadings: string[] = [];
    const allSeries = this.echartsInstance.getOption()
      .series as CustomSeriesOptions[];

    const allDataPointSeries = allSeries.filter(
      (series) =>
        series.typeOfSeries !== 'alarm' && series.typeOfSeries !== 'event'
    );

    allDataPointSeries.forEach((series: any) => {
      let value: string;
      if (series.id.endsWith('/min')) {
        const minValue = this.findValueForExactOrEarlierTimestamp(
          series.data,
          XAxisValue
        );
        if (!minValue) {
          return;
        }
        const maxSeries = allDataPointSeries.find(
          (s) => s.id === series.id.replace('/min', '/max')
        );
        const maxValue = this.findValueForExactOrEarlierTimestamp(
          maxSeries.data as SeriesValue[],
          XAxisValue
        );
        value =
          `${minValue[1]} — ${maxValue[1]}` +
          (series.datapointUnit ? ` ${series.datapointUnit}` : '') +
          `<div style="font-size: 11px">${this.datePipe.transform(
            minValue[0]
          )}</div>`;
      } else if (series.id.endsWith('/max')) {
        // do nothing, value is handled  in 'min' case
        return;
      } else {
        const seriesValue = this.findValueForExactOrEarlierTimestamp(
          series.data,
          XAxisValue
        );
        if (!seriesValue) {
          return;
        }
        value =
          seriesValue[1]?.toString() +
          (series.datapointUnit ? ` ${series.datapointUnit}` : '') +
          `<div style="font-size: 11px">${this.datePipe.transform(
            seriesValue[0]
          )}</div>`;
      }

      YAxisReadings.push(
        `<span style='display: inline-block; background-color: ${series.itemStyle.color} ; height: 12px; width: 12px; border-radius: 50%; margin-right: 4px;'></span>` + // color circle
          `<strong>${series.datapointLabel}: </strong>` + // name
          value // single value or min-max range
      );
    });

    const event = allEvents.find((e) => e.type === params.data.itemType);
    const alarm = allAlarms.find((a) => a.type === params.data.itemType);

    let value: string;
    if (event) {
      // Add the event information to the value
      value = `<div style="font-size: 11px">Event Time: ${event.time}</div>`;
      value += `<div style="font-size: 11px">Event Type: ${event.type}</div>`;
      value += `<div style="font-size: 11px">Event Text: ${event.text}</div>`;
      value += `<div style="font-size: 11px">Event Last Updated: ${event.lastUpdated}</div>`;
    }

    if (alarm) {
      // Add the alarm information to the value
      value = `<div style="font-size: 11px">Alarm Time: ${alarm.time}</div>`;
      value += `<div style="font-size: 11px">Alarm Type: ${alarm.type}</div>`;
      value += `<div style="font-size: 11px">Alarm Text: ${alarm.text}</div>`;
      value += `<div style="font-size: 11px">Alarm Last Updated: ${alarm.lastUpdated}</div>`;
      value += `<div style="font-size: 11px">Alarm Count: ${alarm.count}</div>`;
    }
    YAxisReadings.push(value);
    return (
      this.datePipe.transform(XAxisValue) + '<br/>' + YAxisReadings.join('')
    );
  }

  private getChartSeries(
    datapointsWithValues: DatapointWithValues[],
    events: IEvent[],
    alarms: IAlarm[]
  ): SeriesOption[] {
    const series: SeriesOption[] = [];
    let eventSeries: SeriesOption[] = [];
    let alarmSeries: SeriesOption[] = [];
    datapointsWithValues.forEach((dp, idx) => {
      const renderType: DatapointChartRenderType = dp.renderType || 'min';
      if (renderType === 'area') {
        series.push(this.getSingleSeries(dp, 'min', idx, true));
        series.push(this.getSingleSeries(dp, 'max', idx, true));
      } else {
        series.push(this.getSingleSeries(dp, renderType, idx, false));
      }

      const newEventSeries = this.getAlarmOrEventSeries(
        dp,
        renderType,
        false,
        events,
        'event'
      );
      const newAlarmSeries = this.getAlarmOrEventSeries(
        dp,
        renderType,
        false,
        alarms,
        'alarm'
      );
      eventSeries = [...eventSeries, ...newEventSeries];
      alarmSeries = [...alarmSeries, ...newAlarmSeries];
    });
    return [...series, ...eventSeries, ...alarmSeries];
  }

  private groupByType(
    items: IAlarm[] | IEvent[],
    typeField: string
  ): Record<string, IAlarm[] | IEvent[]> {
    return items.reduce((grouped, item) => {
      (grouped[item[typeField]] = grouped[item[typeField]] || []).push(item);
      return grouped;
    }, {} as any);
  }

  private getClosestDpValueToTargetTime(
    dpValuesArray: DpValuesItem[],
    targetTime: number
  ): DpValuesItem {
    return dpValuesArray.reduce((prev, curr) =>
      Math.abs(curr.time - targetTime) < Math.abs(prev.time - targetTime)
        ? curr
        : prev
    );
  }

  /**
   * This method creates a markPoint on the chart which represents the icon of the alarm or event.
   * @param item Single alarm or event
   * @param dp Data point
   * @param isCleared If the alarm is cleared in case of alarm
   * @param isEvent If the item is an event
   * @returns MarkPointDataItemOption[]
   */
  private createMarkPoint(
    item: IAlarm | IEvent,
    dp: DatapointWithValues,
    isCleared: boolean,
    isEvent: boolean
  ): MarkPointData[] {
    const dpValuesArray: DpValuesItem[] = Object.entries(dp.values).map(
      ([time, values]) => ({
        time: new Date(time).getTime(),
        values,
      })
    );
    const creationTime = new Date(item.creationTime).getTime();
    const closestDpValue = this.getClosestDpValueToTargetTime(
      dpValuesArray,
      creationTime
    );
    const lastUpdatedTime = new Date(item.lastUpdated).getTime();
    const closestDpValueLastUpdated = this.getClosestDpValueToTargetTime(
      dpValuesArray,
      lastUpdatedTime
    );

    if (isEvent) {
      return [
        {
          coord: [
            item.creationTime,
            closestDpValue?.values[0]?.min ?? closestDpValue?.values[1] ?? null,
          ],
          name: item.type,
          itemType: item.type,
          itemStyle: { color: item.color },
          symbol: ICONS_MAP.EVENT,
          symbolSize: 15,
        },
      ];
    }

    return isCleared
      ? [
          {
            coord: [
              item.creationTime,
              closestDpValue?.values[0]?.min ??
                closestDpValue?.values[1] ??
                null,
            ],
            name: item.type,
            itemType: item.type,
            itemStyle: { color: item.color },
            symbol: ICONS_MAP[item.severity],
            symbolSize: 15,
          },
          {
            coord: [
              item.lastUpdated,
              closestDpValueLastUpdated?.values[0]?.min ??
                closestDpValueLastUpdated?.values[1] ??
                null,
            ],
            name: item.type,
            itemType: item.type,
            itemStyle: { color: item.color },
            symbol: ICONS_MAP.CLEARED,
            symbolSize: 15,
          },
        ]
      : [
          {
            coord: [
              item.creationTime,
              closestDpValue?.values[0]?.min ??
                closestDpValue?.values[1] ??
                null,
            ],
            name: item.type,
            itemType: item.type,
            itemStyle: { color: item.color },
            symbol: ICONS_MAP[item.severity],
            symbolSize: 15,
          },
          {
            coord: [
              item.lastUpdated,
              closestDpValueLastUpdated?.values[0]?.min ??
                closestDpValueLastUpdated?.values[1] ??
                null,
            ],
            name: item.type,
            itemType: item.type,
            itemStyle: { color: item.color },
            symbol: ICONS_MAP[item.severity],
            symbolSize: 15,
          },
        ];
  }

  /*
   * This method creates a markLine on the chart which represents the line between the for every alarm or event on the chart.
   * @param items Array of alarms or events
   * @returns MarkLineDataItemOptionBase[]
   */
  private createMarkLine<T extends IAlarm | IEvent>(items: T): MarkLineData[] {
    return items.reduce((acc, item) => {
      if (item.creationTime === item.lastUpdated) {
        return acc.concat([
          {
            xAxis: item.creationTime,
            itemType: item.type,
            label: { show: false, formatter: item.type },
            itemStyle: { color: item.color },
          },
        ]);
      } else {
        return acc.concat([
          {
            xAxis: item.creationTime,
            itemType: item.type,
            label: { show: false, formatter: item.type },
            itemStyle: { color: item.color },
          },
          {
            xAxis: item.lastUpdated,
            itemType: item.type,
            label: { show: false, formatter: item.type },
            itemStyle: { color: item.color },
          },
        ]);
      }
    }, [] as any);
  }

  private getSingleSeries(
    dp: DatapointWithValues,
    renderType: Exclude<DatapointChartRenderType, 'area'>,
    idx: number,
    isMinMaxChart = false
  ): SeriesOption & SeriesDatapointInfo {
    const datapointId = dp.__target.id + dp.fragment + dp.series;
    return {
      datapointId,
      datapointUnit: dp.unit,
      // 'id' property is needed as 'seriesId' in tooltip formatter
      id: isMinMaxChart ? `${datapointId}/${renderType}` : `${datapointId}`,
      name: `${dp.label} (${dp.__target.name})`,
      // datapointLabel used to proper display of tooltip
      datapointLabel: dp.label,
      data: Object.entries(dp.values).map(([dateString, values]) => {
        return [dateString, values[0][renderType]];
      }),
      yAxisIndex: idx,
      ...this.chartTypesService.getSeriesOptions(dp, isMinMaxChart, renderType),
    };
  }

  /*
   * This method creates a general tooltip formatter for the chart.
   * @returns TooltipFormatterCallback<TopLevelFormatterParams>
   */
  private getTooltipFormatter(): TooltipFormatterCallback<TopLevelFormatterParams> {
    return (params) => {
      const XAxisValue: string = params[0].data[0];
      const YAxisReadings: string[] = [];
      const allSeries = this.echartsInstance.getOption()
        .series as CustomSeriesOptions[];

      const allDataPointSeries = allSeries.filter(
        (series) =>
          series.typeOfSeries !== 'alarm' && series.typeOfSeries !== 'event'
      );

      allDataPointSeries.forEach((series: any) => {
        let value: string;
        if (series.id.endsWith('/min')) {
          const minValue = this.findValueForExactOrEarlierTimestamp(
            series.data,
            XAxisValue
          );
          if (!minValue) {
            return;
          }
          const maxSeries = allDataPointSeries.find(
            (s) => s.id === series.id.replace('/min', '/max')
          );
          const maxValue = this.findValueForExactOrEarlierTimestamp(
            maxSeries.data as SeriesValue[],
            XAxisValue
          );
          value =
            `${minValue[1]} — ${maxValue[1]}` +
            (series.datapointUnit ? ` ${series.datapointUnit}` : '') +
            `<div style="font-size: 11px">${this.datePipe.transform(
              minValue[0]
            )}</div>`;
        } else if (series.id.endsWith('/max')) {
          // do nothing, value is handled  in 'min' case
          return;
        } else {
          const seriesValue = this.findValueForExactOrEarlierTimestamp(
            series.data,
            XAxisValue
          );
          if (!seriesValue) {
            return;
          }
          value =
            seriesValue[1]?.toString() +
            (series.datapointUnit ? ` ${series.datapointUnit}` : '') +
            `<div style="font-size: 11px">${this.datePipe.transform(
              seriesValue[0]
            )}</div>`;
        }

        YAxisReadings.push(
          `<span style='display: inline-block; background-color: ${series.itemStyle.color} ; height: 12px; width: 12px; border-radius: 50%; margin-right: 4px;'></span>` + // color circle
            `<strong>${series.datapointLabel}: </strong>` + // name
            value // single value or min-max range
        );
      });

      return (
        this.datePipe.transform(XAxisValue) + '<br/>' + YAxisReadings.join('')
      );
    };
  }

  private findValueForExactOrEarlierTimestamp(
    values: SeriesValue[],
    timestampString: DateString
  ): SeriesValue {
    const timestamp = new Date(timestampString).valueOf();
    return values.reduce((acc, curr) => {
      if (new Date(curr[0]).valueOf() <= timestamp) {
        if (
          acc === null ||
          Math.abs(new Date(curr[0]).valueOf() - timestamp) <
            Math.abs(new Date(acc[0]).valueOf() - timestamp)
        ) {
          return curr;
        }
      }
      return acc;
    }, null);
  }
}
