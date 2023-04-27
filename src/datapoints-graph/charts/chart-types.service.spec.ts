import { ChartTypesService } from './chart-types.service';
import { DatapointWithValues } from '../model';

describe('ChartTypesService', () => {
  let service: ChartTypesService;
  const color = 'blue';
  let dp: DatapointWithValues;
  beforeEach(() => {
    service = new ChartTypesService();
  });

  describe('should return options for lineType "points"', () => {
    beforeEach(() => {
      dp = { lineType: 'points', color } as any as DatapointWithValues;
    });

    it('when it\'s not min/max chart and render type is "min"', () => {
      // when
      const options = service.getSeriesOptions(dp, false, 'min');
      // then
      expect(options).toEqual({
        // from lineSeriesOption
        type: 'line',
        itemStyle: {
          color: color
        },
        emphasis: {
          scale: 1.2,
          itemStyle: {
            color: color
          }
        },
        symbolSize: 4,
        // from linePointsSeriesOption
        showSymbol: true,
        // from pointsSeriesOption
        lineStyle: { opacity: 0 }
      });
    });
  });

  describe('should return options for lineType "points"', () => {
    beforeEach(() => {
      dp = { lineType: 'linePoints', color } as any as DatapointWithValues;
    });

    it('when it\'s not min/max chart and render type is "min"', () => {
      // when
      const isMinMaxChart = false;
      const options = service.getSeriesOptions(dp, isMinMaxChart, 'min');
      // then
      expect(options).toEqual({
        // from lineSeriesOptions
        type: 'line',
        lineStyle: {
          color: color,
          width: 1,
          type: 'solid'
        },
        itemStyle: {
          color: color
        },
        emphasis: {
          scale: 1.2,
          itemStyle: {
            color: color
          }
        },
        symbolSize: 4,
        // from linePointsSeriesOption
        showSymbol: true
      });
    });
  });

  describe('should return options for lineType "bars"', () => {
    beforeEach(() => {
      dp = { lineType: 'bars', color } as any as DatapointWithValues;
    });

    it('when it\'s not min/max chart and render type is "min"', () => {
      // when
      const isMinMaxChart = false;
      const options = service.getSeriesOptions(dp, isMinMaxChart, 'min');
      // then
      expect(options).toEqual({
        type: 'bar',
        barMinWidth: 1,
        barMaxWidth: 20,
        itemStyle: {
          color
        }
      });
    });

    it('when it\'s min/max chart and render type is "max"', () => {
      // when
      const isMinMaxChart = true;
      const options = service.getSeriesOptions(dp, isMinMaxChart, 'max');
      // then
      expect(options).toEqual({
        type: 'bar',
        barMinWidth: 1,
        barMaxWidth: 20,
        itemStyle: {
          color,
          opacity: 0.6
        }
      });
    });
  });

  describe('should return options for lineType "step-before"', () => {
    beforeEach(() => {
      dp = { lineType: 'step-before', color } as any as DatapointWithValues;
    });

    it('when it\'s not min/max chart and render type is "min"', () => {
      // when
      const isMinMaxChart = false;
      const options = service.getSeriesOptions(dp, isMinMaxChart, 'min');
      // then
      expect(options).toEqual({
        // from lineSeriesOption
        type: 'line',
        lineStyle: {
          color: color,
          width: 1,
          type: 'solid'
        },
        itemStyle: {
          color: color
        },
        emphasis: {
          scale: 1.2,
          itemStyle: {
            color: color
          }
        },
        showSymbol: false,
        symbolSize: 4,
        // from stepBeforeSeriesOption
        step: 'start'
      });
    });
  });

  describe('should return options for lineType "step-after"', () => {
    beforeEach(() => {
      dp = { lineType: 'step-after', color } as any as DatapointWithValues;
    });

    it('when it\'s not min/max chart and render type is "min"', () => {
      // when
      const isMinMaxChart = false;
      const options = service.getSeriesOptions(dp, isMinMaxChart, 'min');
      // then
      expect(options).toEqual({
        // from lineSeriesOption
        type: 'line',
        lineStyle: {
          color: color,
          width: 1,
          type: 'solid'
        },
        itemStyle: {
          color: color
        },
        emphasis: {
          scale: 1.2,
          itemStyle: {
            color: color
          }
        },
        showSymbol: false,
        symbolSize: 4,
        // from stepBeforeSeriesOption
        step: 'end'
      });
    });
  });

  describe('should return options for lineType "line"', () => {
    beforeEach(() => {
      dp = { lineType: 'line', color } as any as DatapointWithValues;
    });

    it('when it\'s not min/max chart and render type is "min"', () => {
      // when
      const isMinMaxChart = false;
      const options = service.getSeriesOptions(dp, isMinMaxChart, 'min');
      // then
      expect(options).toEqual({
        // from lineSeriesOption
        type: 'line',
        lineStyle: {
          color: color,
          width: 1,
          type: 'solid'
        },
        itemStyle: {
          color: color
        },
        emphasis: {
          scale: 1.2,
          itemStyle: {
            color: color
          }
        },
        showSymbol: false,
        symbolSize: 4
      });
    });
  });
});
