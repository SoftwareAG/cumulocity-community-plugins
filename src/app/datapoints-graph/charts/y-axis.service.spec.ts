import { YAxisService } from './y-axis.service';
import { DatapointWithValues } from '../model';
import { TestBed } from '@angular/core/testing';
import { AppStateService } from '@c8y/ngx-components';
import { YAXisOption } from 'echarts/types/src/coord/cartesian/AxisModel';

describe('YAxisService', () => {
  let service: YAxisService;
  const lang = 'ja-JP';
  const dp1: DatapointWithValues = {
    lineType: 'line',
    fragment: 'c8y_Temperature',
    series: 'T',
    __active: true,
    __target: { id: 1 },
    color: 'blue',
    values: {},
  };
  const dp2: DatapointWithValues = {
    lineType: 'line',
    fragment: 'c8y_Temperature',
    series: 'T',
    __active: true,
    __target: { id: 2 },
    color: 'red',
    values: {},
  };
  const dp3: DatapointWithValues = {
    lineType: 'line',
    fragment: 'c8y_Temperature',
    series: 'T',
    __active: true,
    __target: { id: 3 },
    color: 'green',
    values: {},
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        YAxisService,
        {
          provide: AppStateService,
          useValue: {
            state: { lang: lang },
          },
        },
      ],
    });
    service = TestBed.inject(YAxisService);
  });

  it('should set locale to value compliant with Intl.NumberFormat', () => {
    // given
    const YAxis: YAXisOption = service.getYAxis([dp1], {
      showSplitLines: false,
    })[0];
    // when
    const YAxisValue = (YAxis.axisLabel as any).formatter(1_400_000_000);
    // then
    expect(YAxisValue).toEqual('14億');
  });

  it('should return Y axis option with generic values', () => {
    // when
    const YAxis = service.getYAxis([dp1], { showSplitLines: false })[0];
    // then
    expect(JSON.stringify(YAxis)).toEqual(
      JSON.stringify({
        type: 'value',
        animation: true,
        axisLine: {
          show: true,
          lineStyle: {
            color: 'blue',
          },
          onZero: false,
        },
        axisLabel: {
          fontSize: 10,
          formatter: (val) =>
            new Intl.NumberFormat('en-GB', {
              notation: 'compact',
              compactDisplay: 'short',
            }).format(val),
        },
        splitLine: {
          show: false,
          lineStyle: { color: 'blue', opacity: 0.4, type: 'dashed' },
        },
        position: 'left',
        offset: 0,
        axisTick: {
          show: true,
        },
        axisPointer: {
          show: false,
          label: {
            show: false,
          },
        },
      })
    );
  });

  it('should return Y axis option with min and max values', () => {
    // when
    const YAxis = service.getYAxis([{ ...dp1, min: -100, max: 100 }], {
      showSplitLines: false,
    })[0];
    // then
    expect(YAxis.min).toEqual(-100);
    expect(YAxis.max).toEqual(100);
  });

  describe('should handle multiple Y axis positions and offsets', () => {
    it('when there are more than one axis and all have no yAxisType declared', () => {
      // when
      const YAxis = service.getYAxis([dp1, dp2, dp3], {
        showSplitLines: false,
      });
      // then
      expect(YAxis[0].position).toBe('left');
      expect(YAxis[1].position).toBe('right');
      expect(YAxis[2].position).toBe('right');
      expect(YAxis[0].offset).toBe(0);
      expect(YAxis[1].offset).toBe(0);
      expect(YAxis[2].offset).toBe(48);
    });

    it('when there are axis positioned to left and one with no position declared', () => {
      // when
      const YAxis = service.getYAxis(
        [{ ...dp1, yAxisType: 'left' }, { ...dp2, yAxisType: 'left' }, dp3],
        { showSplitLines: false }
      );
      // then
      expect(YAxis[0].position).toBe('left');
      expect(YAxis[1].position).toBe('left');
      expect(YAxis[2].position).toBe('right');
      expect(YAxis[0].offset).toBe(0);
      expect(YAxis[1].offset).toBe(48);
      expect(YAxis[2].offset).toBe(0);
    });

    it('when all axis are positioned', () => {
      // when
      const YAxis = service.getYAxis(
        [
          { ...dp1, yAxisType: 'left' },
          { ...dp2, yAxisType: 'right' },
          { ...dp3, yAxisType: 'left' },
        ],
        { showSplitLines: false }
      );
      // then
      expect(YAxis[0].position).toBe('left');
      expect(YAxis[1].position).toBe('right');
      expect(YAxis[2].position).toBe('left');
      expect(YAxis[0].offset).toBe(0);
      expect(YAxis[1].offset).toBe(0);
      expect(YAxis[2].offset).toBe(48);
    });
  });
});
