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
import type {
  CallbackDataParams,
  TooltipFormatterCallback,
} from 'echarts/types/src/util/types';
import type { TopLevelFormatterParams } from 'echarts/types/src/component/tooltip/TooltipModel';
import { AlarmStatus, IAlarm, IEvent, SeverityType } from '@c8y/client';
import { ICONS_MAP } from './svg-icons.model';
import { CustomSeriesOptions } from './chart.model';
import { AlarmSeverityToIconPipe } from '../alarms-filtering/alarm-severity-to-icon.pipe';
import { AlarmSeverityToLabelPipe } from '../alarms-filtering/alarm-severity-to-label.pipe';
import { Router } from '@angular/router';

type TooltipPositionCallback = (
  point: [number, number], // position of mouse in chart [X, Y]; 0,0 is top left corner
  _: any, // tooltip data
  dom: HTMLElement | unknown, // tooltip element
  __: any, // valid only when mouse is on graphic elements; not relevant in our case
  size: {
    contentSize: [number, number]; // size of tooltip
    viewSize: [number, number]; // size of the chart
  } | null // size of chart
) => Partial<Record<'top' | 'bottom' | 'left' | 'right', number>>;

const INDEX_HTML = '/index.html';

@Injectable()
export class EchartsOptionsService {
  echartsInstance: ECharts | undefined;
  private TOOLTIP_WIDTH = 300;
  private tooltipPositionCallback: TooltipPositionCallback | undefined;

  constructor(
    private datePipe: DatePipe,
    private yAxisService: YAxisService,
    private chartTypesService: ChartTypesService,
    private severityIconPipe: AlarmSeverityToIconPipe,
    private severityLabelPipe: AlarmSeverityToLabelPipe,
    private router: Router
  ) {}

  getChartOptions(
    datapointsWithValues: DatapointWithValues[],
    timeRange: { dateFrom: string; dateTo: string },
    showSplitLines: { YAxis: boolean; XAxis: boolean },
    events: IEvent[],
    alarms: IAlarm[],
    displayOptions: {
      displayMarkedLine: boolean;
      displayMarkedPoint: boolean;
      mergeMatchingDatapoints: boolean;
    }
  ): EChartsOption {
    const yAxis = this.yAxisService.getYAxis(datapointsWithValues, {
      showSplitLines: showSplitLines.YAxis,
      mergeMatchingDatapoints: displayOptions.mergeMatchingDatapoints,
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
        position: this.tooltipPosition(),
        transitionDuration: 0,
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
      series: this.getChartSeries(
        datapointsWithValues,
        events,
        alarms,
        displayOptions
      ),
    };
  }

  /**
   * This method is used to get the series for alarms and events.
   * @param dp - The data point.
   * @param renderType - The render type.
   * @param isMinMaxChart - If the chart is min max chart.
   * @param items - All alarms or events which should be displayed on the chart.
   * @param itemType - The item type.
   * @param id - The id of the device
   */
  getAlarmOrEventSeries(
    dp: DatapointWithValues,
    renderType: DatapointChartRenderType,
    isMinMaxChart = false,
    items: IAlarm[] | IEvent[] = [],
    itemType: 'alarm' | 'event' = 'alarm',
    displayOptions = { displayMarkedLine: true, displayMarkedPoint: true },
    id?: string | number
  ): CustomSeriesOptions[] {
    if (!items.length) {
      return [];
    }

    if (
      !displayOptions.displayMarkedLine &&
      !displayOptions.displayMarkedPoint
    ) {
      return [];
    }

    //filter items that are not __hidden
    const filteredItems: IAlarm[] | IEvent[] = items.filter(
      (item) => !item['__hidden']
    );
    const itemsByType = this.groupByType(filteredItems, 'type');
    const isAlarm = itemType === 'alarm';

    return Object.entries(itemsByType).flatMap(
      ([type, itemsOfType]: [string, (IAlarm | IEvent)[]]) => {
        // Main series data
        const mainData = itemsOfType.map((item) => [
          item.creationTime,
          null,
          'markLineFlag',
        ]);

        // MarkPoint data
        const markPointData = itemsOfType.reduce<MarkPointData[]>(
          (acc, item) => {
            if (dp.__target?.id === item.source.id) {
              const isCleared = isAlarm && item.status === AlarmStatus.CLEARED;
              const isEvent = !isAlarm;
              return acc.concat(
                this.createMarkPoint(item, dp, isCleared, isEvent)
              );
            } else {
              if (!item.creationTime) {
                return [];
              }
              return acc.concat([
                {
                  coord: [item.creationTime, null],
                  name: item.type,
                  itemType: item.type,
                  itemStyle: { color: item['color'] },
                },
              ]);
            }
          },
          []
        );

        // Construct series with markPoint
        const seriesWithMarkPoint = {
          id: `${type}/${dp.__target?.id}+${id ? id : ''}-markPoint`,
          name: `${type}-markPoint`,
          typeOfSeries: itemType,
          data: mainData,
          silent: true,
          markPoint: {
            showSymbol: true,
            symbolKeepAspect: true,
            data: markPointData,
          },
          ...this.chartTypesService.getSeriesOptions(
            dp,
            isMinMaxChart,
            renderType
          ),
        };

        // Construct series with markLine
        const seriesWithMarkLine = {
          id: `${type}/${dp.__target?.id}+${id ? id : ''}-markLine`,
          name: `${type}-markLine`,
          typeOfSeries: itemType,
          data: mainData,
          markLine: {
            showSymbol: false,
            symbol: ['none', 'none'], // no symbol at the start/end of the line
            data: this.createMarkLine(itemsOfType),
          },
          ...this.chartTypesService.getSeriesOptions(
            dp,
            isMinMaxChart,
            renderType
          ),
        };

        //depending on the options return only the required series
        if (
          displayOptions.displayMarkedLine &&
          displayOptions.displayMarkedPoint
        ) {
          return [seriesWithMarkLine, seriesWithMarkPoint];
        } else if (displayOptions.displayMarkedLine) {
          return [seriesWithMarkLine];
        } else if (displayOptions.displayMarkedPoint) {
          return [seriesWithMarkPoint];
        } else {
          return null;
        }
      }
    ) as CustomSeriesOptions[];
  }

  /**
   * This method is used to get tooltip formatter for alarms and events.
   * @param tooltipParams - The tooltip parameters.
   * @param params - The parameters data.
   * @param allEvents - All events.
   * @param allAlarms - All alarms.
   * @returns The formatted string for the tooltip.
   */
  getTooltipFormatterForAlarmAndEvents(
    tooltipParams: CallbackDataParams,
    params: { data: { itemType: string } },
    allEvents: IEvent[],
    allAlarms: IAlarm[]
  ): string {
    if (!Array.isArray(tooltipParams)) {
      return '';
    }
    const XAxisValue: string = tooltipParams[0].data[0];
    const YAxisReadings: string[] = [];
    const allSeries = this.echartsInstance?.getOption()[
      'series'
    ] as CustomSeriesOptions[];

    // filter out alarm and event series
    const allDataPointSeries = allSeries.filter(
      (series) =>
        series['typeOfSeries'] !== 'alarm' && series['typeOfSeries'] !== 'event'
    );

    this.processSeries(allDataPointSeries, XAxisValue, YAxisReadings);

    // find event and alarm of the same type as the hovered markedLine or markedPoint
    const event = allEvents.find((e) => e.type === params.data.itemType);
    const alarm = allAlarms.find((a) => a.type === params.data.itemType);

    let value: string = '';
    if (event) {
      value = this.processEvent(event);
    }

    if (alarm) {
      this.processAlarm(alarm).then((alarmVal) => {
        value = alarmVal;
        YAxisReadings.push(value);
        const options = this.echartsInstance?.getOption() as EChartsOption;
        if (!options.tooltip || !Array.isArray(options.tooltip)) {
          return;
        }
        const updatedOptions: Partial<SeriesOption> = {
          tooltip: options['tooltip'][0],
        };

        if (!updatedOptions.tooltip) {
          return;
        }
        updatedOptions.tooltip.formatter = `<div style="width: ${this.TOOLTIP_WIDTH}px">${YAxisReadings.join('')}</div>`;
        updatedOptions.tooltip.transitionDuration = 0;
        updatedOptions.tooltip.position = this.tooltipPosition();
        this.echartsInstance?.setOption(updatedOptions);
        return;
      });
    }
    YAxisReadings.push(value);

    return `<div style="width: 300px">${YAxisReadings.join('')}</div>`;
  }

  private tooltipPosition(): TooltipPositionCallback {
    let lastPositionOfTooltip: Partial<
      Record<'top' | 'bottom' | 'left' | 'right', number>
    > = {};
    if (this.tooltipPositionCallback) {
      return this.tooltipPositionCallback;
    }

    this.tooltipPositionCallback = (
      point: [number, number], // position of mouse in chart [X, Y]; 0,0 is top left corner
      _: any, // tooltip data
      dom: HTMLElement | unknown, // tooltip element
      __: any,
      size: {
        contentSize: [number, number]; // size of tooltip
        viewSize: [number, number];
      } | null // size of chart
    ) => {
      const offset = 10;
      const [mouseX, mouseY] = point;
      const chartWidth = size?.viewSize[0] || 0;
      const chartHeight = size?.viewSize[1] || 0;
      const tooltipWidth = size?.contentSize[0] || 0;
      const tooltipHeight = size?.contentSize[1] || 0;
      const tooltipRect = (dom as HTMLElement)?.getBoundingClientRect();
      const tooltipOverflowsBottomEdge =
        tooltipRect.bottom > window.innerHeight;

      const tooltipOverflowsRightEdge = tooltipRect.right > window.innerWidth;

      const tooltipWouldOverflowBottomEdgeOnPositionChange =
        !lastPositionOfTooltip.top &&
        tooltipRect.bottom + 2 * offset + tooltipHeight > window.innerHeight;

      const tooltipWouldOverflowRightEdgeOnPositionChange =
        !lastPositionOfTooltip.left &&
        tooltipRect.right + 2 * offset + tooltipWidth > window.innerWidth;

      let verticalPosition: { top: number } | { bottom: number } = {
        top: mouseY + offset,
      };
      let horizontalPosition: { left: number } | { right: number } = {
        left: mouseX + offset,
      };

      if (
        tooltipOverflowsBottomEdge ||
        tooltipWouldOverflowBottomEdgeOnPositionChange
      ) {
        verticalPosition = {
          bottom: chartHeight - mouseY + offset,
        };
      }
      if (
        tooltipOverflowsRightEdge ||
        tooltipWouldOverflowRightEdgeOnPositionChange
      ) {
        horizontalPosition = {
          right: chartWidth - mouseX + offset,
        };
      }

      lastPositionOfTooltip = {
        ...verticalPosition,
        ...horizontalPosition,
      };
      return lastPositionOfTooltip;
    };
    return this.tooltipPositionCallback;
  }

  /**
   * This method is used to add the data point info to the tooltip.
   * @param allDataPointSeries - All the data point series.
   * @param XAxisValue - The X Axis value.
   * @param YAxisReadings - The Y Axis readings.
   */
  private processSeries(
    allDataPointSeries: CustomSeriesOptions[],
    XAxisValue: string,
    YAxisReadings: string[]
  ): void {
    allDataPointSeries.forEach((series: any) => {
      let value: string = '';
      if (series.id.endsWith('/min')) {
        value = this.processMinSeries(series, allDataPointSeries, XAxisValue);
      } else if (!series.id.endsWith('/max')) {
        value = this.processRegularSeries(series, XAxisValue);
      }

      if (value) {
        YAxisReadings.push(
          `<div class="d-flex a-i-center p-b-8"><span class='dlt-c8y-icon-circle m-r-4' style='color: ${series.itemStyle.color};'></span>` + // color circle
            `<strong>${series.datapointLabel}</strong></div>` + // name
            `${value}` // single value or min-max range
        );
      }
    });
  }

  /**
   * This method is used to process the min series.
   * @param series - The series.
   * @param allDataPointSeries - All the data point series.
   * @param XAxisValue - The X Axis value.
   * @returns The processed value.
   */
  private processMinSeries(
    series: any,
    allDataPointSeries: CustomSeriesOptions[],
    XAxisValue: string
  ): string {
    const minValue = this.findValueForExactOrEarlierTimestamp(
      series.data,
      XAxisValue
    );
    if (!minValue) {
      return '';
    }
    const maxSeries = allDataPointSeries.find(
      (s) => s['id'] === series.id.replace('/min', '/max')
    );
    const maxValue = this.findValueForExactOrEarlierTimestamp(
      maxSeries!['data'] as SeriesValue[],
      XAxisValue
    );
    return (
      `<div class="d-flex a-i-center separator-top p-t-8 p-b-8"><label class="text-12 m-r-8 m-b-0">${this.datePipe.transform(minValue[0])}</label>` +
      `<span class="m-l-auto text-12">${minValue[1]} — ${maxValue![1]}` +
      (series.datapointUnit ? ` ${series.datapointUnit}` : '') +
      `</span></div>`
    );
  }

  /**
   * This method is used to process the regular series.
   * @param series - The series.
   * @param XAxisValue - The X Axis value.
   * @returns The processed value.
   */
  private processRegularSeries(series: any, XAxisValue: string): string {
    const seriesValue = this.findValueForExactOrEarlierTimestamp(
      series.data,
      XAxisValue
    );
    if (!seriesValue) {
      return '';
    }
    return (
      `<div class="d-flex a-i-center p-t-8 p-b-8 separator-top">` +
      `<label class="m-b-0 m-r-8 text-12">${this.datePipe.transform(
        seriesValue[0]
      )}</label><span class="m-l-auto text-12">` +
      seriesValue[1]?.toString() +
      (series.datapointUnit ? ` ${series.datapointUnit}` : '') +
      `</span></div>`
    );
  }

  /**
   * This method is used to process the event tooltip.
   * @param event - The event object.
   * @returns The processed value.
   */
  private processEvent(event: IEvent): string {
    let value = `<ul class="list-unstyled small separator-top">`;
    value += `<li class="p-t-4 p-b-4 d-flex separator-bottom text-no-wrap"><label class="small m-b-0 m-r-8">Event type</label><code class="m-l-auto">${event.type}</code></li>`;
    value += `<li class="p-t-4 p-b-4 d-flex separator-bottom text-no-wrap"><label class="small m-b-0 m-r-8">Event text</label><span class="m-l-auto">${event.text}<span></li>`;
    value += `<li class="p-t-4 p-b-4 d-flex separator-bottom text-no-wrap"><label class="small m-b-0 m-r-8">Last update</label><span class="m-l-auto">${this.datePipe.transform(event['lastUpdated'])}<span></li>`;
    value += `</ul>`;
    return value;
  }

  /**
   * This method is used to process the alarm tooltip.
   * @param alarm - The alarm object.
   * @returns The processed value.
   */
  private async processAlarm(alarm: IAlarm): Promise<string> {
    let value = `<ul class="list-unstyled small separator-top m-0">`;
    value += `<li class="p-t-4 p-b-4 d-flex a-i-center separator-bottom text-no-wrap"><label class="text-label-small m-b-0 m-r-8">Alarm Severity</label>`;
    value += `<span class="small d-inline-flex a-i-center gap-4 m-l-auto"><i class="stroked-icon icon-14 status dlt-c8y-icon-${this.severityIconPipe.transform(alarm.severity)} ${alarm.severity.toLowerCase()}" > </i> ${this.severityLabelPipe.transform(alarm.severity)} </span></li>`;
    value += `<li class="p-t-4 p-b-4 d-flex separator-bottom text-no-wrap"><label class="text-label-small m-b-0 m-r-8">Alarm Type</label><span class="small m-l-auto"><code>${alarm.type}</code></span></li>`;
    value += `<li class="p-t-4 p-b-4 d-flex separator-bottom text-no-wrap"><label class="text-label-small m-b-0 m-r-8">Message</label><span class="small m-l-auto" style="overflow: hidden; text-overflow: ellipsis;" title="${alarm.text}">${alarm.text}</span></li>`;
    value += `<li class="p-t-4 p-b-4 d-flex separator-bottom text-no-wrap"><label class="text-label-small m-b-0 m-r-8">Last Updated</label><span class="small m-l-auto">${this.datePipe.transform(alarm['lastUpdated'])}</span></li>`;
    const exists = await this.alarmRouteExists();
    if (exists) {
      const currentUrl = window.location.href;
      const baseUrlIndex = currentUrl.indexOf(INDEX_HTML);
      const baseUrl = currentUrl.substring(0, baseUrlIndex + INDEX_HTML.length);
      value += `<li class="p-t-4 p-b-4 d-flex separator-bottom text-no-wrap"><label class="text-label-small m-b-0 m-r-8">Link</label><span class="small m-l-auto"><a href="${baseUrl}#/alarms/${alarm.id}">Alarm Details</a></span></li>`;
    }
    value += `<li class="p-t-4 p-b-4 d-flex text-no-wrap"><label class="text-label-small m-b-0 m-r-8">Alarm count</label><span class="small m-l-auto"><span class="badge badge-info">${alarm.count}</span></span></li>`;
    value += `</ul>`;
    return value;
  }

  private async alarmRouteExists(): Promise<boolean> {
    const exists = this.router.config.some((route) => {
      return `${route.path}` === 'alarms';
    });
    return exists;
  }

  private getChartSeries(
    datapointsWithValues: DatapointWithValues[],
    events: IEvent[],
    alarms: IAlarm[],
    displayOptions: { displayMarkedLine: boolean; displayMarkedPoint: boolean }
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
        'event',
        displayOptions
      );
      const newAlarmSeries = this.getAlarmOrEventSeries(
        dp,
        renderType,
        false,
        alarms,
        'alarm',
        displayOptions
      );
      eventSeries = [...eventSeries, ...newEventSeries];
      alarmSeries = [...alarmSeries, ...newAlarmSeries];
    });
    const deduplicateFilterCallback = (
      obj1: SeriesOption,
      i: number,
      arr: SeriesOption[]
    ): obj1 is SeriesOption =>
      arr.findIndex((obj2) => obj2['id'] === obj1['id']) === i;
    const deduplicatedEvents = eventSeries.filter(deduplicateFilterCallback);
    const deduplicatedAlarms = alarmSeries.filter(deduplicateFilterCallback);
    return [...series, ...deduplicatedEvents, ...deduplicatedAlarms];
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

  /**
   * This method interpolates between two data points. The goal is to place the markPoint on the chart in the right place.
   * @param dpValuesArray array of data points
   * @param targetTime time of the alarm or event
   * @returns interpolated data point
   */
  private interpolateBetweenTwoDps(
    dpValuesArray: DpValuesItem[],
    targetTime: number
  ): DpValuesItem {
    let maxValue: number;
    let minValue: number;
    return dpValuesArray.reduce((acc, curr, idx, arr) => {
      if (new Date(curr.time).getTime() <= targetTime) {
        if (idx === arr.length - 1) {
          return {
            time: targetTime,
            values: [{ min: minValue, max: maxValue }],
          };
        }
        const nextDp = arr[idx + 1];
        if (new Date(nextDp.time).getTime() >= targetTime) {
          const timeDiff =
            new Date(nextDp.time).getTime() - new Date(curr.time).getTime();
          const targetTimeDiff = targetTime - new Date(curr.time).getTime();
          const minValueDiff = nextDp.values[0]?.min - curr.values[0]?.min;
          const maxValueDiff = nextDp.values[0]?.max - curr.values[0]?.max;
          minValue =
            curr.values[0]?.min + (minValueDiff * targetTimeDiff) / timeDiff;
          maxValue =
            curr.values[0]?.max + (maxValueDiff * targetTimeDiff) / timeDiff;
          return {
            time: targetTime,
            values: [{ min: minValue, max: maxValue }],
          };
        }
      }
      return acc;
    });
  }

  private getClosestDpValueToTargetTime(
    dpValuesArray: DpValuesItem[],
    targetTime: number
  ): DpValuesItem {
    return dpValuesArray.reduce((prev, curr) =>
      //should take the value closest to the target time, for realtime the current time would always change
      Math.abs(new Date(curr.time).getTime() - targetTime) <
      Math.abs(new Date(prev.time).getTime() - targetTime)
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
    if (!item.creationTime) {
      return [];
    }

    const dpValuesArray: DpValuesItem[] = Object.entries(dp.values).map(
      ([time, values]) => ({
        time: new Date(time).getTime(),
        values,
      })
    );
    const creationTime = new Date(item.creationTime).getTime();
    const closestDpValue = this.interpolateBetweenTwoDps(
      dpValuesArray,
      creationTime
    );
    const dpValuesForNewAlarms = this.getClosestDpValueToTargetTime(
      dpValuesArray,
      creationTime
    );
    const lastUpdatedTime = new Date(item['lastUpdated']).getTime();
    const closestDpValueLastUpdated = this.interpolateBetweenTwoDps(
      dpValuesArray,
      lastUpdatedTime
    );
    const dpValuesForNewAlarmsLastUpdated = this.getClosestDpValueToTargetTime(
      dpValuesArray,
      lastUpdatedTime
    );

    if (isEvent) {
      return [
        {
          coord: [
            item.creationTime,
            closestDpValue?.values[0]?.min ??
              closestDpValue?.values[1] ??
              dpValuesForNewAlarms?.values[0]?.min ??
              dpValuesForNewAlarms?.values[1] ??
              null,
          ],
          name: item.type,
          itemType: item.type,
          itemStyle: {
            color: item['color'],
          },
          symbol: 'circle',
          symbolSize: 24,
        },
        {
          coord: [
            item.creationTime,
            closestDpValue?.values[0]?.min ??
              closestDpValue?.values[1] ??
              dpValuesForNewAlarms?.values[0]?.min ??
              dpValuesForNewAlarms?.values[1] ??
              null,
          ],
          name: item.type,
          itemType: item.type,
          itemStyle: { color: 'white' },
          symbol: ICONS_MAP.EVENT,
          symbolSize: 16,
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
                dpValuesForNewAlarms?.values[0]?.min ??
                dpValuesForNewAlarms?.values[1] ??
                null,
            ],
            name: item.type,
            itemType: item.type,
            itemStyle: {
              color: item['color'],
            },
            symbol: 'circle',
            symbolSize: 24,
          },
          {
            coord: [
              item.creationTime,
              closestDpValue?.values[0]?.min ??
                closestDpValue?.values[1] ??
                dpValuesForNewAlarms?.values[0]?.min ??
                dpValuesForNewAlarms?.values[1] ??
                null,
            ],
            name: item.type,
            itemType: item.type,
            itemStyle: { color: 'white' },
            symbol: ICONS_MAP[item.severity as SeverityType],
            symbolSize: 16,
          },
          {
            coord: [
              item['lastUpdated'],
              closestDpValueLastUpdated?.values[0]?.min ??
                closestDpValueLastUpdated?.values[1] ??
                dpValuesForNewAlarmsLastUpdated?.values[0]?.min ??
                dpValuesForNewAlarmsLastUpdated?.values[1] ??
                null,
            ],
            name: item.type,
            itemType: item.type,
            itemStyle: {
              color: item['color'],
            },
            symbol: 'circle',
            symbolSize: 24,
          },
          {
            coord: [
              item['lastUpdated'],
              closestDpValueLastUpdated?.values[0]?.min ??
                closestDpValueLastUpdated?.values[1] ??
                dpValuesForNewAlarmsLastUpdated?.values[0]?.min ??
                dpValuesForNewAlarmsLastUpdated?.values[1] ??
                null,
            ],
            name: item.type,
            itemType: item.type,
            itemStyle: { color: 'white' },
            symbol: ICONS_MAP.CLEARED,
            symbolSize: 16,
          },
        ]
      : [
          {
            coord: [
              item.creationTime,
              closestDpValue?.values[0]?.min ??
                closestDpValue?.values[1] ??
                dpValuesForNewAlarms?.values[0]?.min ??
                dpValuesForNewAlarms?.values[1] ??
                null,
            ],
            name: item.type,
            itemType: item.type,
            itemStyle: {
              color: item['color'],
            },
            symbol: 'circle',
            symbolSize: 24,
          },
          {
            coord: [
              item.creationTime,
              closestDpValue?.values[0]?.min ??
                closestDpValue?.values[1] ??
                dpValuesForNewAlarms?.values[0]?.min ??
                dpValuesForNewAlarms?.values[1] ??
                null,
            ],
            name: item.type,
            itemType: item.type,
            itemStyle: { color: 'white' },
            symbol: ICONS_MAP[item.severity as SeverityType],
            symbolSize: 16,
          },
          {
            coord: [
              item['lastUpdated'],
              closestDpValueLastUpdated?.values[0]?.min ??
                closestDpValueLastUpdated?.values[1] ??
                dpValuesForNewAlarmsLastUpdated?.values[0]?.min ??
                dpValuesForNewAlarmsLastUpdated?.values[1] ??
                null,
            ],
            name: item.type,
            itemType: item.type,
            itemStyle: {
              color: item['color'],
            },
            symbol: 'circle',
            symbolSize: 24,
          },
          {
            coord: [
              item['lastUpdated'],
              closestDpValueLastUpdated?.values[0]?.min ??
                closestDpValueLastUpdated?.values[1] ??
                dpValuesForNewAlarmsLastUpdated?.values[0]?.min ??
                dpValuesForNewAlarmsLastUpdated?.values[1] ??
                null,
            ],
            name: item.type,
            itemType: item.type,
            itemStyle: { color: 'white' },
            symbol: ICONS_MAP[item.severity as SeverityType],
            symbolSize: 16,
          },
        ];
  }

  /**
   * This method creates a markLine on the chart which represents the line between every alarm or event on the chart.
   * @param items Array of alarms or events
   * @returns MarkLineDataItemOptionBase[]
   */
  private createMarkLine<T extends IAlarm | IEvent>(
    items: T[]
  ): MarkLineData[] {
    return items.reduce<MarkLineData[]>((acc, item) => {
      if (!item.creationTime) {
        return acc;
      }
      if (item.creationTime === item['lastUpdated']) {
        return acc.concat([
          {
            xAxis: item.creationTime,
            itemType: item.type,
            label: { show: false, formatter: () => item.type },
            itemStyle: { color: item['color'] },
          },
        ]);
      } else {
        return acc.concat([
          {
            xAxis: item.creationTime,
            itemType: item.type,
            label: { show: false, formatter: () => item.type },
            itemStyle: { color: item['color'] },
          },
          {
            xAxis: item['lastUpdated'],
            itemType: item.type,
            label: { show: false, formatter: () => item.type },
            itemStyle: { color: item['color'] },
          },
        ]);
      }
    }, []);
  }

  private getSingleSeries(
    dp: DatapointWithValues,
    renderType: Exclude<DatapointChartRenderType, 'area'>,
    idx: number,
    isMinMaxChart = false
  ): SeriesOption & SeriesDatapointInfo {
    const datapointId = dp.__target?.id + dp.fragment + dp.series;
    return {
      datapointId,
      datapointUnit: dp.unit || '',
      // 'id' property is needed as 'seriesId' in tooltip formatter
      id: isMinMaxChart ? `${datapointId}/${renderType}` : `${datapointId}`,
      name: `${dp.label} (${dp.__target?.['name']})`,
      // datapointLabel used to proper display of tooltip
      datapointLabel: dp.label || '',
      data: Object.entries(dp.values).map(([dateString, values]) => {
        return [dateString, values[0][renderType]];
      }),
      yAxisIndex: idx,
      ...this.chartTypesService.getSeriesOptions(dp, isMinMaxChart, renderType),
    };
  }

  /**
   * This method creates a general tooltip formatter for the chart.
   * @returns TooltipFormatterCallback<TopLevelFormatterParams>
   */
  private getTooltipFormatter(): TooltipFormatterCallback<TopLevelFormatterParams> {
    return (params) => {
      if (!Array.isArray(params) || !params[0]?.data) {
        return '';
      }
      const data = params[0].data as [string, ...any[]];
      const XAxisValue: string = data[0];
      const YAxisReadings: string[] = [];
      const allSeries = this.echartsInstance?.getOption()[
        'series'
      ] as CustomSeriesOptions[];

      const allDataPointSeries = allSeries.filter(
        (series) =>
          series['typeOfSeries'] !== 'alarm' &&
          series['typeOfSeries'] !== 'event'
      );

      allDataPointSeries.forEach((series: CustomSeriesOptions) => {
        let value: string;
        const id = series['id'] as string;
        if (id.endsWith('/min')) {
          const minValue = this.findValueForExactOrEarlierTimestamp(
            series['data'] as SeriesValue[],
            XAxisValue
          );
          if (!minValue) {
            return;
          }
          const maxSeries = allDataPointSeries.find(
            (s) => s['id'] === id.replace('/min', '/max')
          );
          if (!maxSeries) {
            return;
          }
          const maxValue = this.findValueForExactOrEarlierTimestamp(
            maxSeries['data'] as SeriesValue[],
            XAxisValue
          );
          if (maxValue === null) {
            return;
          }
          value =
            `<div class="d-flex a-i-center separator-top p-t-8 p-b-8">` +
            `<label class="text-12 m-r-8 m-b-0">${this.datePipe.transform(minValue[0])}</label>` +
            `<div class="m-l-auto text-12" >${minValue[1]} — ${maxValue[1]}` +
            (series['datapointUnit'] ? ` ${series['datapointUnit']}` : '') +
            `</div></div>`;
        } else if (id.endsWith('/max')) {
          // do nothing, value is handled  in 'min' case
          return;
        } else {
          const seriesValue = this.findValueForExactOrEarlierTimestamp(
            series['data'] as SeriesValue[],
            XAxisValue
          );
          if (!seriesValue) {
            return;
          }
          value =
            `<div class="d-flex a-i-center separator-top p-t-8 p-b-8">` +
            `<label class="text-12 m-r-8 m-b-0">${this.datePipe.transform(seriesValue[0])}</label>` +
            `<div class="m-l-auto text-12" >${seriesValue[1]?.toString()}` +
            (series['datapointUnit'] ? ` ${series['datapointUnit']}` : '') +
            `</div></div>`;
        }

        const itemStyle = series['itemStyle'] as { color: string };

        YAxisReadings.push(
          `<div class="d-flex a-i-center p-b-8"><span class='dlt-c8y-icon-circle m-r-4' style='color: ${itemStyle.color}'></span>` + // color circle
            `<strong>${series['datapointLabel']} </strong></div>` + // name
            `${value}` // single value or min-max range
        );
      });

      return `<div style="width: ${this.TOOLTIP_WIDTH}px">${YAxisReadings.join('')}</div>`;
    };
  }

  private findValueForExactOrEarlierTimestamp(
    values: SeriesValue[],
    timestampString: DateString
  ): SeriesValue | null {
    const timestamp = new Date(timestampString).valueOf();
    return values.reduce((acc: SeriesValue | null, curr: SeriesValue) => {
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
