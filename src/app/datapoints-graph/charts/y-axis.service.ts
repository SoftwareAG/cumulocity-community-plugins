import { Injectable } from '@angular/core';
import { DatapointAxisType, DatapointWithValues, YAxisOptions } from '../model';
import type { YAXisOption } from 'echarts/types/src/coord/cartesian/AxisModel';
import { AppStateService } from '@c8y/ngx-components';

@Injectable()
export class YAxisService {
  Y_AXIS_OFFSET = 48;
  private intlNumberFormatCompliantLocale: string;

  constructor(private appStateService: AppStateService) {
    this.intlNumberFormatCompliantLocale =
      this.appStateService.state.lang.replace('_', '-');
  }

  getYAxis(
    datapointsWithValues: DatapointWithValues[],
    YAxisOptions: YAxisOptions
  ): YAXisOption[] {
    const YAxisPlacement: Map<
      DatapointWithValues,
      { position: DatapointAxisType; offset: number }
    > = this.getYAxisPlacement(datapointsWithValues);

    return datapointsWithValues.map((dp) => ({
      type: 'value',
      animation: true,
      axisLine: {
        show: true,
        lineStyle: {
          color: dp.color,
        },
        onZero: false,
      },
      axisLabel: {
        fontSize: 10,
        formatter: (val) =>
          new Intl.NumberFormat(this.intlNumberFormatCompliantLocale, {
            notation: 'compact',
            compactDisplay: 'short',
          }).format(val),
      },
      splitLine: {
        show: YAxisOptions.showSplitLines,
        lineStyle: { color: dp.color, opacity: 0.4, type: 'dashed' },
      },
      position: YAxisPlacement.get(dp).position,
      offset: YAxisPlacement.get(dp).offset,
      axisTick: {
        show: true,
      },
      axisPointer: {
        show: false,
        label: {
          show: false,
        },
      },
      ...(dp.min && { min: dp.min }),
      ...(dp.max && { max: dp.max }),
    }));
  }

  private getYAxisPlacement(
    datapointsWithValues: DatapointWithValues[]
  ): Map<DatapointWithValues, { position: DatapointAxisType; offset: number }> {
    const YAxisPositions = new Map<
      DatapointWithValues,
      { position: DatapointAxisType }
    >();

    datapointsWithValues.forEach((dp) => {
      const position = this.getYAxisPosition(dp, datapointsWithValues);
      YAxisPositions.set(dp, { position });
    });

    const dpLeft = datapointsWithValues.filter(
      (dp) => YAxisPositions.get(dp).position === 'left'
    );
    const dpRight = datapointsWithValues.filter(
      (dp) => YAxisPositions.get(dp).position === 'right'
    );

    const YAxisPlacement = new Map<
      DatapointWithValues,
      { position: DatapointAxisType; offset: number }
    >();
    YAxisPositions.forEach(({ position }, key) => {
      const offset =
        (position === 'left' ? dpLeft : dpRight).indexOf(key) *
        this.Y_AXIS_OFFSET;
      YAxisPlacement.set(key, { position: position, offset });
    });

    return YAxisPlacement;
  }

  private getYAxisPosition(
    datapoint: DatapointAxisType,
    datapointsWithValues: DatapointWithValues[]
  ): DatapointAxisType {
    if (datapoint.yAxisType) {
      return datapoint.yAxisType;
    }
    const currentIndex = datapointsWithValues.indexOf(datapoint);
    const otherIndexLeft = datapointsWithValues.findIndex(
      (dp) => dp !== datapoint && (!dp.yAxisType || dp.yAxisType === 'left')
    );
    if (otherIndexLeft > -1 && otherIndexLeft < currentIndex) {
      return 'right';
    } else {
      return 'left';
    }
  }
}
