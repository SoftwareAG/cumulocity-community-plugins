import { Injectable } from '@angular/core';
import {
  DatapointChartRenderType,
  DatapointWithValues,
  EchartsSeriesOptions,
} from '../model';
import type { BarSeriesOption, LineSeriesOption } from 'echarts';

function assertUnreachable(_: never): never {
  throw new Error('Case unreachable.');
}

@Injectable()
export class ChartTypesService {
  private RENDER_TYPE_SYMBOL: Record<
    Exclude<DatapointChartRenderType, 'area'>,
    Partial<LineSeriesOption>
  > = {
    min: { symbol: 'triangle', symbolRotate: 0 },
    max: { symbol: 'triangle', symbolRotate: 180 },
  };
  getSeriesOptions(
    { lineType, color }: DatapointWithValues,
    isMinMaxChart = false,
    renderType: DatapointChartRenderType
  ): EchartsSeriesOptions {
    switch (lineType) {
      case 'points':
        return this.pointsSeriesOption(color, isMinMaxChart, renderType);
      case 'linePoints':
        return this.linePointsSeriesOption(color, isMinMaxChart, renderType);
      case 'bars':
        return this.barsSeriesOption(color, isMinMaxChart, renderType);
      case 'step-before':
        return this.stepBeforeSeriesOption(color, isMinMaxChart, renderType);
      case 'step-after':
        return this.stepAfterSeriesOption(color, isMinMaxChart, renderType);
      case 'line':
      case undefined:
        return this.lineSeriesOption(color, isMinMaxChart, renderType);
    }
    return assertUnreachable(lineType);
  }

  private pointsSeriesOption(
    color: string,
    isMinMaxChart: boolean,
    renderType: DatapointChartRenderType
  ): LineSeriesOption {
    const baseOption = this.linePointsSeriesOption(
      color,
      isMinMaxChart,
      renderType
    );
    return {
      ...baseOption,
      lineStyle: { opacity: 0 },
    };
  }

  private lineSeriesOption(
    color: string,
    isMinMaxChart: boolean,
    renderType: DatapointChartRenderType
  ): LineSeriesOption {
    let baseOption: LineSeriesOption = {
      type: 'line',
      lineStyle: {
        color: color,
        width: 1,
        type: 'solid',
      },
      itemStyle: {
        color: color,
      },
      emphasis: {
        scale: 1.2,
        itemStyle: {
          color: color,
        },
      },
      showSymbol: false,
      symbolSize: 4, // symbol is visible on hover
    };
    if (isMinMaxChart) {
      baseOption = {
        ...baseOption,
        ...this.RENDER_TYPE_SYMBOL[renderType],
        symbolSize: 8,
      };
    }
    return baseOption;
  }

  private linePointsSeriesOption(
    color: string,
    isMinMaxChart: boolean,
    renderType: DatapointChartRenderType
  ): LineSeriesOption {
    const baseOption = this.lineSeriesOption(color, isMinMaxChart, renderType);
    return {
      ...baseOption,
      showSymbol: true,
    };
  }

  private barsSeriesOption(
    color: string,
    isMinMaxChart: boolean,
    renderType: DatapointChartRenderType
  ): BarSeriesOption {
    const baseOption: BarSeriesOption = {
      type: 'bar',
      barMinWidth: 1,
      barMaxWidth: 20,
      itemStyle: {
        color,
      },
    };
    if (isMinMaxChart) {
      baseOption.itemStyle.opacity = renderType === 'max' ? 0.6 : 1.0;
    }
    return baseOption;
  }

  private stepBeforeSeriesOption(
    color: string,
    isMinMaxChart: boolean,
    renderType: DatapointChartRenderType
  ): LineSeriesOption {
    const baseOption = this.lineSeriesOption(color, isMinMaxChart, renderType);
    return { ...baseOption, step: 'start' };
  }

  private stepAfterSeriesOption(
    color: string,
    isMinMaxChart: boolean,
    renderType: DatapointChartRenderType
  ): LineSeriesOption {
    const baseOption = this.lineSeriesOption(color, isMinMaxChart, renderType);
    return { ...baseOption, step: 'end' };
  }
}
