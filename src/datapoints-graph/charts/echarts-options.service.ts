import { Injectable } from '@angular/core';
import { DatePipe } from '@c8y/ngx-components';
import type { EChartsOption, SeriesOption } from 'echarts';
import { ECharts } from 'echarts';
import {
  DatapointChartRenderType,
  DatapointWithValues,
  DateString,
  SeriesDatapointInfo,
  SeriesValue,
} from '../model';
import { YAxisService } from './y-axis.service';
import { ChartTypesService } from './chart-types.service';
import type { TooltipFormatterCallback } from 'echarts/types/src/util/types';
import type { TopLevelFormatterParams } from 'echarts/types/src/component/tooltip/TooltipModel';
import { IAlarm, IEvent } from '@c8y/client';

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
    const eventTypes = events.map((event) => event.type);
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
        formatter: this.getTooltipFormatter(events),
        appendToBody: true,
      },
      legend: {
        show: true,
        data: eventTypes.map((eventType) => ({
          name: eventType,
          icon: 'path://M97.3013 63L128.939 95.1315C79.296 134.335 47.7653 191.526 47.7653 255.276C47.7653 319.027 79.296 376.218 128.917 415.421L97.28 447.574C37.76 400.552 0 331.93 0 255.276C0 178.622 37.76 110.001 97.3013 63ZM414.72 63C474.24 110.001 512 178.622 512 255.276C512 331.93 474.24 400.552 414.72 447.574L383.083 415.421C432.704 376.218 464.235 319.027 464.235 255.276C464.235 191.526 432.704 134.335 383.083 95.1315L414.72 63ZM160.405 127.092L192 159.181C162.24 182.681 143.317 217.013 143.317 255.276C143.317 293.539 162.219 327.871 192 351.372L160.405 383.461C120.725 352.119 95.552 306.379 95.552 255.276C95.552 204.174 120.725 158.433 160.405 127.092ZM351.595 127.092C391.296 158.433 416.448 204.174 416.448 255.276C416.448 306.379 391.275 352.119 351.595 383.461L320 351.372C349.781 327.871 368.683 293.539 368.683 255.276C368.683 217.013 349.781 182.703 320 159.181L351.595 127.092ZM256 192.722C291.505 192.722 320.287 221.504 320.287 257.009C320.287 292.514 291.505 321.296 256 321.296C220.495 321.296 191.713 292.514 191.713 257.009C191.713 221.504 220.495 192.722 256 192.722Z',
          itemStyle: {
            color: events.find((event) => event.type === eventType).color,
          },
        })),
        itemHeight: 16,
        textStyle: {
          fontSize: 10,
        },
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

  private getChartSeries(
    datapointsWithValues: DatapointWithValues[],
    events,
    alarms
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

      const newEventSeries = this.getEventSeries(dp, renderType, false, events);
      const newAlarmSeries = this.getAlarmSeries(dp, renderType, false, alarms);
      eventSeries = [...eventSeries, ...newEventSeries];
      alarmSeries = [...alarmSeries, ...newAlarmSeries];
    });
    return [...series, ...eventSeries, ...alarmSeries];
  }

  getAlarmSeries(
    dp: any,
    renderType: DatapointChartRenderType,
    isMinMaxChart = false,
    alarms: IEvent[] = [],
    alarmId?: string
  ): SeriesOption[] {
    if (!alarms?.length) {
      return [];
    }

    const alarmsByType = alarms.reduce((grouped, alarm) => {
      (grouped[alarm.type] = grouped[alarm.type] || []).push(alarm);
      return grouped;
    }, {});

    return Object.entries(alarmsByType).map(
      ([type, alarmsOfType]: [string, IEvent[]]) => {
        return {
          id: `${alarmId ? alarmId : `${type}/${dp.__target.id}`}`,
          name: type,
          showSymbol: false,
          data: alarmsOfType.map((alarm) => [
            alarm.creationTime,
            null,
            'markLineFlag',
          ]),
          markPoint: {
            showSymbol: true,
            data: alarmsOfType.map((alarm) => {
              if (dp.__target.id === alarm.source.id) {
                const dpValuesArray = Object.entries(dp.values).map(
                  ([time, values]) => ({
                    time: new Date(time).getTime(),
                    values,
                  })
                );
                const alarmCreationTime = new Date(
                  alarm.creationTime
                ).getTime();
                const closestDpValue = dpValuesArray.reduce((prev, curr) =>
                  Math.abs(curr.time - alarmCreationTime) <
                  Math.abs(prev.time - alarmCreationTime)
                    ? curr
                    : prev
                );
                return {
                  coord: [
                    alarm.creationTime,
                    closestDpValue
                      ? closestDpValue.values[0].min
                      : closestDpValue.values[1]
                      ? closestDpValue.values[1]
                      : null,
                  ],
                  name: alarm.type,
                  itemStyle: { color: alarm.color },
                  symbol:
                    'path://M97.3013 63L128.939 95.1315C79.296 134.335 47.7653 191.526 47.7653 255.276C47.7653 319.027 79.296 376.218 128.917 415.421L97.28 447.574C37.76 400.552 0 331.93 0 255.276C0 178.622 37.76 110.001 97.3013 63ZM414.72 63C474.24 110.001 512 178.622 512 255.276C512 331.93 474.24 400.552 414.72 447.574L383.083 415.421C432.704 376.218 464.235 319.027 464.235 255.276C464.235 191.526 432.704 134.335 383.083 95.1315L414.72 63ZM160.405 127.092L192 159.181C162.24 182.681 143.317 217.013 143.317 255.276C143.317 293.539 162.219 327.871 192 351.372L160.405 383.461C120.725 352.119 95.552 306.379 95.552 255.276C95.552 204.174 120.725 158.433 160.405 127.092ZM351.595 127.092C391.296 158.433 416.448 204.174 416.448 255.276C416.448 306.379 391.275 352.119 351.595 383.461L320 351.372C349.781 327.871 368.683 293.539 368.683 255.276C368.683 217.013 349.781 182.703 320 159.181L351.595 127.092ZM256 192.722C291.505 192.722 320.287 221.504 320.287 257.009C320.287 292.514 291.505 321.296 256 321.296C220.495 321.296 191.713 292.514 191.713 257.009C191.713 221.504 220.495 192.722 256 192.722Z',
                  symbolSize: 15,
                };
              } else {
                return {
                  coord: [alarm.creationTime, null], // Set the position of the mark point
                  name: alarm.type,
                  itemStyle: { color: alarm.color },
                };
              }
            }),
          },
          markLine: {
            showSymbol: true,
            symbol: ['none', 'none'],
            data: alarmsOfType.map((alarm) => ({
              xAxis: alarm.creationTime,
              label: {
                show: false,
                formatter: alarm.type,
                emphasis: { show: true },
              },
              itemStyle: { color: alarm.color },
            })),
          },
          ...this.chartTypesService.getSeriesOptions(
            dp,
            isMinMaxChart,
            renderType
          ),
        };
      }
    );
  }

  getEventSeries(
    dp: any,
    renderType: DatapointChartRenderType,
    isMinMaxChart = false,
    events: IEvent[] = [],
    eventId?: string
  ): SeriesOption[] {
    if (!events?.length) {
      return [];
    }

    const eventsByType = events.reduce((grouped, event) => {
      (grouped[event.type] = grouped[event.type] || []).push(event);
      return grouped;
    }, {});

    return Object.entries(eventsByType).map(
      ([type, eventsOfType]: [string, IEvent[]]) => {
        return {
          id: `${eventId ? eventId : `${type}/${dp.__target.id}`}`,
          name: type,
          showSymbol: false,
          data: eventsOfType.map((event) => [
            event.creationTime,
            null,
            'markLineFlag',
          ]),
          markPoint: {
            showSymbol: true,
            data: eventsOfType.map((event) => {
              if (dp.__target.id === event.source.id) {
                const dpValuesArray = Object.entries(dp.values).map(
                  ([time, values]) => ({
                    time: new Date(time).getTime(),
                    values,
                  })
                );
                const eventCreationTime = new Date(
                  event.creationTime
                ).getTime();
                const closestDpValue = dpValuesArray.reduce((prev, curr) =>
                  Math.abs(curr.time - eventCreationTime) <
                  Math.abs(prev.time - eventCreationTime)
                    ? curr
                    : prev
                );
                return {
                  coord: [
                    event.creationTime,
                    closestDpValue
                      ? closestDpValue.values[0].min
                      : closestDpValue.values[1]
                      ? closestDpValue.values[1]
                      : null,
                  ],
                  name: event.type,
                  itemStyle: { color: event.color },
                  symbol:
                    'path://M97.3013 63L128.939 95.1315C79.296 134.335 47.7653 191.526 47.7653 255.276C47.7653 319.027 79.296 376.218 128.917 415.421L97.28 447.574C37.76 400.552 0 331.93 0 255.276C0 178.622 37.76 110.001 97.3013 63ZM414.72 63C474.24 110.001 512 178.622 512 255.276C512 331.93 474.24 400.552 414.72 447.574L383.083 415.421C432.704 376.218 464.235 319.027 464.235 255.276C464.235 191.526 432.704 134.335 383.083 95.1315L414.72 63ZM160.405 127.092L192 159.181C162.24 182.681 143.317 217.013 143.317 255.276C143.317 293.539 162.219 327.871 192 351.372L160.405 383.461C120.725 352.119 95.552 306.379 95.552 255.276C95.552 204.174 120.725 158.433 160.405 127.092ZM351.595 127.092C391.296 158.433 416.448 204.174 416.448 255.276C416.448 306.379 391.275 352.119 351.595 383.461L320 351.372C349.781 327.871 368.683 293.539 368.683 255.276C368.683 217.013 349.781 182.703 320 159.181L351.595 127.092ZM256 192.722C291.505 192.722 320.287 221.504 320.287 257.009C320.287 292.514 291.505 321.296 256 321.296C220.495 321.296 191.713 292.514 191.713 257.009C191.713 221.504 220.495 192.722 256 192.722Z',
                  symbolSize: 15,
                };
              } else {
                return {
                  coord: [event.creationTime, null], // Set the position of the mark point
                  name: event.type,
                  itemStyle: { color: event.color },
                };
              }
            }),
          },
          markLine: {
            showSymbol: true,
            symbol: ['none', 'none'],
            data: eventsOfType.map((event) => ({
              xAxis: event.creationTime,
              label: {
                show: false,
                formatter: event.type,
                emphasis: { show: true },
              },
              itemStyle: { color: event.color },
            })),
          },
          ...this.chartTypesService.getSeriesOptions(
            dp,
            isMinMaxChart,
            renderType
          ),
        };
      }
    );
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

  private getTooltipFormatter(
    events?: IEvent[]
  ): TooltipFormatterCallback<TopLevelFormatterParams> {
    return (params) => {
      const XAxisValue: string = params[0].data[0];
      const markedLineHovered = params[0].data[2] === 'markLineFlag';
      const YAxisReadings: string[] = [];
      const allSeries = this.echartsInstance.getOption()
        .series as SeriesOption[];
      allSeries.forEach((series: any) => {
        let value: string;
        if (series.id.endsWith('/min')) {
          const minValue = this.findValueForExactOrEarlierTimestamp(
            series.data,
            XAxisValue
          );
          if (!minValue) {
            return;
          }
          const maxSeries = allSeries.find(
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

          if (seriesValue[1] !== null) {
            value =
              seriesValue[1]?.toString() +
              (series.datapointUnit ? ` ${series.datapointUnit}` : '') +
              `<div style="font-size: 11px">${this.datePipe.transform(
                seriesValue[0]
              )}</div>`;
          }

          if (series.markLine && markedLineHovered) {
            // Get the markLine data for the current XAxisValue
            const markLineData = series.markLine.data.find(
              (d) => d.xAxis === XAxisValue
            );
            if (markLineData && events.length > 0) {
              const event = events?.reduce((closestEvent, currentEvent) => {
                const currentDifference = Math.abs(
                  new Date(currentEvent.creationTime).getTime() -
                    new Date(XAxisValue).getTime()
                );
                const closestDifference = Math.abs(
                  new Date(closestEvent.creationTime).getTime() -
                    new Date(XAxisValue).getTime()
                );
                return currentDifference < closestDifference
                  ? currentEvent
                  : closestEvent;
              });

              if (event && series.id.includes(event.source.id)) {
                // Add the event information to the value
                value = `<div style="font-size: 11px">Event Time: ${event.time}</div>`;
                value += `<div style="font-size: 11px">Event Type: ${event.type}</div>`;
                value += `<div style="font-size: 11px">Event Text: ${event.text}</div>`;
                value += `<div style="font-size: 11px">Event Last Updated: ${event.lastUpdated}</div>`;
              }

              return YAxisReadings.push(value);
            }
          } else if (series.markLine) {
            return;
          }
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
