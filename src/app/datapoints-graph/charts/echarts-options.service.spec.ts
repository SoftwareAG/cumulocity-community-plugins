import { EchartsOptionsService } from './echarts-options.service';
import { TestBed } from '@angular/core/testing';
import { CommonModule, DatePipe } from '@c8y/ngx-components';
import { ChartTypesService } from './chart-types.service';
import { YAxisService } from './y-axis.service';
import { DatapointWithValues } from '../model';
import { DataZoomComponentOption, SeriesOption } from 'echarts';
import { XAXisOption } from 'echarts/types/src/coord/cartesian/AxisModel';
import {
  TooltipOption,
  TopLevelFormatterParams,
} from 'echarts/types/src/component/tooltip/TooltipModel';
import { TooltipFormatterCallback } from 'echarts/types/src/util/types';
import {
  AlarmSeveritiesToTitlePipe,
  AlarmSeverityToIconPipe,
  AlarmSeverityToLabelPipe,
} from '@c8y/ngx-components/alarms';

describe('EchartsOptionsService', () => {
  let service: EchartsOptionsService;
  let yAxisService: YAxisService;
  let chartTypesService: ChartTypesService;
  let datePipe: DatePipe;
  const Y_AXIS_OFFSET = 48;
  const dateFrom = new Date('2023-03-20T10:00:00.000Z');
  const dateTo = new Date('2023-03-20T11:00:00.000Z');
  const timeRange = {
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
  };
  const dp1: DatapointWithValues = {
    lineType: 'line',
    fragment: 'c8y_Temperature',
    series: 'T',
    __active: true,
    __target: { id: 1 },
    values: {},
  };

  const dp2: DatapointWithValues = {
    lineType: 'bars',
    fragment: 'c8y_Temperature',
    series: 'T',
    __active: true,
    __target: { id: 2 },
    values: {},
  };

  const dp3: DatapointWithValues = {
    lineType: 'line',
    fragment: 'c8y_Temperature',
    series: 'T',
    __active: true,
    __target: { id: 3 },
    values: {},
  };

  beforeEach(() => {
    yAxisService = {
      getYAxis: jest.fn().mockName('getYAxis').mockReturnValue([]),
      Y_AXIS_OFFSET,
    } as any as YAxisService;
    chartTypesService = {
      getSeriesOptions: jest
        .fn()
        .mockName('getSeriesOptions')
        .mockReturnValue({}),
    } as any as ChartTypesService;
    datePipe = {
      transform: jest
        .fn()
        .mockName('transform')
        .mockImplementation((a) => a),
    } as any as DatePipe;
    TestBed.configureTestingModule({
      imports: [CommonModule.forRoot()],
      providers: [
        EchartsOptionsService,
        { provide: DatePipe, useValue: datePipe },
        { provide: ChartTypesService, useValue: chartTypesService },
        { provide: YAxisService, useValue: yAxisService },
        AlarmSeverityToIconPipe,
        AlarmSeverityToLabelPipe,
        AlarmSeveritiesToTitlePipe,
      ],
    });
    service = TestBed.inject(EchartsOptionsService);
    service.echartsInstance = {
      getOption: jest.fn().mockName('getOption'),
    } as any;
  });

  it('should exist', () => {
    expect(service).toBeTruthy();
  });

  it('should get options with static values', () => {
    // when
    const options = service.getChartOptions(
      [],
      timeRange,
      {
        YAxis: false,
        XAxis: false,
      },
      [],
      [],
      { displayMarkedLine: true, displayMarkedPoint: true }
    );
    // then
    expect(JSON.stringify(options)).toBe(
      JSON.stringify({
        grid: {
          containLabel: false,
          left: 16,
          top: 32,
          right: 16,
          bottom: 24,
        },
        dataZoom: {
          type: 'inside',
          filterMode: 'none',
          zoomOnMouseWheel: false,
        },
        animation: false,
        toolbox: {
          show: true,
          itemSize: 0,
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
          formatter: (service as any).getTooltipFormatter(),
          appendToBody: true,
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
            onZeroAxisIndex: -1,
          },
          axisLabel: {
            hideOverlap: true,
            borderWidth: 2,
            borderColor: 'transparent',
          },
          splitLine: {
            show: false,
            lineStyle: { opacity: 0.8, type: 'dashed', width: 2 },
          },
        },
        yAxis: [],
        series: [],
      })
    );
  });

  describe('should calculate grid values based on Y axis', () => {
    it('when only one Y axis is on left side and no axis on the right', () => {
      // given
      jest
        .spyOn(yAxisService, 'getYAxis')
        .mockReturnValue([{ position: 'left' }]);
      // when
      const options = service.getChartOptions(
        [],
        timeRange,
        {
          YAxis: false,
          XAxis: false,
        },
        [],
        [],
        { displayMarkedLine: true, displayMarkedPoint: true }
      );
      // then
      expect(options.grid).toEqual({
        containLabel: false,
        left: Y_AXIS_OFFSET,
        top: 32,
        right: 16,
        bottom: 24,
      });
    });

    it('when only one Y axis is on left side and one on the right', () => {
      // given
      jest
        .spyOn(yAxisService, 'getYAxis')
        .mockReturnValue([{ position: 'left' }, { position: 'right' }]);
      // when
      const options = service.getChartOptions(
        [],
        timeRange,
        {
          YAxis: false,
          XAxis: false,
        },
        [],
        [],
        { displayMarkedLine: true, displayMarkedPoint: true }
      );
      // then
      expect(options.grid).toEqual({
        containLabel: false,
        left: Y_AXIS_OFFSET,
        top: 32,
        right: Y_AXIS_OFFSET,
        bottom: 24,
      });
    });

    it('when more than one Y axis is on left side and on the right side', () => {
      // given
      jest
        .spyOn(yAxisService, 'getYAxis')
        .mockReturnValue([
          { position: 'left' },
          { position: 'left' },
          { position: 'left' },
          { position: 'right' },
          { position: 'right' },
        ]);
      // when
      const options = service.getChartOptions(
        [],
        timeRange,
        {
          YAxis: false,
          XAxis: false,
        },
        [],
        [],
        { displayMarkedLine: true, displayMarkedPoint: true }
      );
      // then
      expect(options.grid).toEqual({
        containLabel: false,
        left: Y_AXIS_OFFSET * 3,
        top: 32,
        right: Y_AXIS_OFFSET * 2,
        bottom: 24,
      });
    });
  });

  describe('handle bars charts', () => {
    it('should set dataZoom filterMode "filter" when there is at least one bars chart', () => {
      // when
      const dataZoomOptions = service.getChartOptions(
        [dp1, dp2],
        timeRange,
        {
          YAxis: false,
          XAxis: false,
        },
        [],
        [],
        { displayMarkedLine: true, displayMarkedPoint: true }
      ).dataZoom as DataZoomComponentOption;
      // then
      expect(dataZoomOptions.filterMode).toBe('filter');
    });

    it('should set dataZoom filterMode "none" when there is no bars chart', () => {
      // when
      const dataZoomOptions = service.getChartOptions(
        [dp1],
        timeRange,
        {
          YAxis: false,
          XAxis: false,
        },
        [],
        [],
        { displayMarkedLine: true, displayMarkedPoint: true }
      ).dataZoom as DataZoomComponentOption;
      // then
      expect(dataZoomOptions.filterMode).toBe('none');
    });

    it('should set xAxis axisLine onZeroAxisIndex to "-1" when there are no bars chart', () => {
      // when
      const xAxisOptions = service.getChartOptions(
        [dp1],
        timeRange,
        {
          YAxis: false,
          XAxis: false,
        },
        [],
        [],
        { displayMarkedLine: true, displayMarkedPoint: true }
      ).xAxis as XAXisOption;
      // then
      expect(xAxisOptions.axisLine?.onZeroAxisIndex).toBe(-1);
    });

    it('should set xAxis axisLine onZeroAxisIndex to "1" when there is bars chart on index 1', () => {
      // when
      const xAxisOptions = service.getChartOptions(
        [dp1, dp2],
        timeRange,
        {
          YAxis: false,
          XAxis: false,
        },
        [],
        [],
        { displayMarkedLine: true, displayMarkedPoint: true }
      ).xAxis as XAXisOption;
      // then
      expect(xAxisOptions.axisLine?.onZeroAxisIndex).toBe(1);
    });
  });

  describe('should return tooltip formatter', function () {
    it('for one datapoint', () => {
      // given
      const XAxisValue = '2023-03-20T10:10:00.000Z';
      jest.spyOn(service.echartsInstance!, 'getOption').mockReturnValue({
        series: [
          {
            id: dp1.__target?.id + dp1.fragment + dp1.series,
            data: [[XAxisValue, -10]],
            itemStyle: { color: 'blue' },
            datapointLabel: 'c8y_Temperature → T',
          },
        ],
      });
      const params = [{ data: [XAxisValue, -10] }] as any;

      const tooltipFormatter = (
        service.getChartOptions(
          [dp1],
          timeRange,
          {
            YAxis: false,
            XAxis: false,
          },
          [],
          [],
          { displayMarkedLine: true, displayMarkedPoint: true }
        ).tooltip as TooltipOption
      ).formatter as TooltipFormatterCallback<TopLevelFormatterParams>;
      // when
      const tooltipInnerHtml = tooltipFormatter(params, '');
      // then
      expect(tooltipInnerHtml).toBe(
        `<div style="width: 300px"><div class="d-flex a-i-center p-b-8"><span class='dlt-c8y-icon-circle m-r-4' style='color: blue'></span><strong>c8y_Temperature → T </strong></div><div class="d-flex a-i-center separator-top p-t-8 p-b-8"><label class="text-12 m-r-8 m-b-0">2023-03-20T10:10:00.000Z</label><div class="m-l-auto text-12" >-10</div></div></div>`
      );
    });

    it('for two datapoints that has no value on exact timestamp', () => {
      // given
      const XAxisValue = '2023-03-20T10:10:00.000Z';
      jest.spyOn(service.echartsInstance!, 'getOption').mockReturnValue({
        series: [
          {
            id: dp1.__target?.id + dp1.fragment + dp1.series,
            data: [[XAxisValue, -10]],
            itemStyle: { color: 'blue' },
            datapointLabel: 'c8y_Temperature → T',
            datapointUnit: 'C',
          },
          {
            id: dp3.__target?.id + dp3.fragment + dp3.series,
            data: [
              ['2023-03-20T10:08:00.000Z', 0],
              ['2023-03-20T10:09:00.000Z', 2],
            ],
            itemStyle: { color: 'red' },
            datapointLabel: 'c8y_Temperature → T',
            datapointUnit: 'C',
          },
        ],
      });
      const params = [{ data: [XAxisValue, -10] }] as any;

      const tooltipFormatter = (
        service.getChartOptions(
          [dp1, dp3],
          timeRange,
          {
            YAxis: false,
            XAxis: false,
          },
          [],
          [],
          { displayMarkedLine: true, displayMarkedPoint: true }
        ).tooltip as TooltipOption
      ).formatter as TooltipFormatterCallback<TopLevelFormatterParams>;
      // when
      const tooltipInnerHtml = tooltipFormatter(params, '');
      // then
      expect(tooltipInnerHtml).toBe(
        `<div style="width: 300px"><div class="d-flex a-i-center p-b-8"><span class='dlt-c8y-icon-circle m-r-4' style='color: blue'></span><strong>c8y_Temperature → T </strong></div><div class="d-flex a-i-center separator-top p-t-8 p-b-8"><label class="text-12 m-r-8 m-b-0">2023-03-20T10:10:00.000Z</label><div class="m-l-auto text-12" >-10 C</div></div><div class="d-flex a-i-center p-b-8"><span class='dlt-c8y-icon-circle m-r-4' style='color: red'></span><strong>c8y_Temperature → T </strong></div><div class="d-flex a-i-center separator-top p-t-8 p-b-8"><label class="text-12 m-r-8 m-b-0">2023-03-20T10:09:00.000Z</label><div class="m-l-auto text-12" >2 C</div></div></div>`
      );
    });

    it('for multiple datapoints but some datapoints has no values for exact hovered timestamp or before', () => {
      // given
      const XAxisValue = '2023-03-20T10:10:00.000Z';
      const oneMinuteAfterXAxisValue = new Date(
        new Date(XAxisValue).valueOf() + 60_000
      );
      jest.spyOn(service.echartsInstance!, 'getOption').mockReturnValue({
        series: [
          {
            id: dp1.__target?.id + dp1.fragment + dp1.series,
            data: [[XAxisValue, -10]],
            itemStyle: { color: 'blue' },
            datapointLabel: 'c8y_Temperature → T',
            datapointUnit: 'C',
          },
          {
            id: dp2.__target?.id + dp2.fragment + dp2.series + '/min',
            data: [[oneMinuteAfterXAxisValue, -10]],
            itemStyle: { color: 'blue' },
            datapointLabel: 'c8y_Temperature → T',
            datapointUnit: 'C',
          },
          {
            id: dp2.__target?.id + dp2.fragment + dp2.series + '/max',
            data: [[oneMinuteAfterXAxisValue, 10]],
            itemStyle: { color: 'blue' },
            datapointLabel: 'c8y_Temperature → T',
            datapointUnit: 'C',
          },
          {
            id: dp3.__target?.id + dp3.fragment + dp3.series,
            data: [[oneMinuteAfterXAxisValue, 0]],
            itemStyle: { color: 'red' },
            datapointLabel: 'c8y_Temperature → T',
            datapointUnit: 'C',
          },
        ],
      });
      const params = [{ data: [XAxisValue, -10] }] as any;

      const tooltipFormatter = (
        service.getChartOptions(
          [dp1, dp3],
          timeRange,
          {
            YAxis: false,
            XAxis: false,
          },
          [],
          [],
          { displayMarkedLine: true, displayMarkedPoint: true }
        ).tooltip as TooltipOption
      ).formatter as TooltipFormatterCallback<TopLevelFormatterParams>;
      // when
      const tooltipInnerHtml = tooltipFormatter(params, '');
      // then
      expect(tooltipInnerHtml).toBe(
        `<div style="width: 300px"><div class="d-flex a-i-center p-b-8"><span class='dlt-c8y-icon-circle m-r-4' style='color: blue'></span><strong>c8y_Temperature → T </strong></div><div class="d-flex a-i-center separator-top p-t-8 p-b-8"><label class="text-12 m-r-8 m-b-0">2023-03-20T10:10:00.000Z</label><div class="m-l-auto text-12" >-10 C</div></div></div>`
      );
    });

    it('for one datapoint and chart render type is "area"', () => {
      // given
      const XAxisValue = '2023-03-20T10:10:00.000Z';
      jest.spyOn(service.echartsInstance!, 'getOption').mockReturnValue({
        series: [
          {
            id: dp1.__target?.id + dp1.fragment + dp1.series + '/min',
            data: [[XAxisValue, -10]],
            itemStyle: { color: 'blue' },
            datapointLabel: 'c8y_Temperature → T',
            datapointUnit: 'C',
          },
          {
            id: dp1.__target?.id + dp1.fragment + dp1.series + '/max',
            data: [[XAxisValue, 10]],
            itemStyle: { color: 'blue' },
            datapointLabel: 'c8y_Temperature → T',
            datapointUnit: 'C',
          },
        ],
      });
      const params = [{ data: [XAxisValue, -10] }] as any;

      const tooltipFormatter = (
        service.getChartOptions(
          [dp1],
          timeRange,
          {
            YAxis: false,
            XAxis: false,
          },
          [],
          [],
          { displayMarkedLine: true, displayMarkedPoint: true }
        ).tooltip as TooltipOption
      ).formatter as TooltipFormatterCallback<TopLevelFormatterParams>;
      // when
      const tooltipInnerHtml = tooltipFormatter(params, '');
      // then
      expect(tooltipInnerHtml).toBe(
        `<div style="width: 300px"><div class="d-flex a-i-center p-b-8"><span class='dlt-c8y-icon-circle m-r-4' style='color: blue'></span><strong>c8y_Temperature → T </strong></div><div class="d-flex a-i-center separator-top p-t-8 p-b-8"><label class="text-12 m-r-8 m-b-0">2023-03-20T10:10:00.000Z</label><div class="m-l-auto text-12" >-10 — 10 C</div></div></div>`
      );
    });
  });

  describe('should return data series', () => {
    it('for single datapoint', () => {
      const dpWithValues = {
        ...dp1,
        values: {
          '2023-03-20T10:08:00.000Z': [{ min: 1, max: 1 }],
          '2023-03-20T10:09:00.000Z': [{ min: 2, max: 2 }],
        },
      };
      const series = service.getChartOptions(
        [dpWithValues],
        timeRange,
        {
          YAxis: false,
          XAxis: false,
        },
        [],
        [],
        { displayMarkedLine: true, displayMarkedPoint: true }
      ).series as SeriesOption[];
      // then
      expect(series).toHaveLength(1);
      expect((series[0] as any).id).toBe(
        dp1.__target?.id + dp1.fragment + dp1.series
      );
      expect((series[0] as any).data).toEqual([
        ['2023-03-20T10:08:00.000Z', 1],
        ['2023-03-20T10:09:00.000Z', 2],
      ]);
    });

    it('for single datapoint of "line" type and render type is "area"', () => {
      const dpWithValues: DatapointWithValues = {
        ...dp1,
        renderType: 'area',
        values: {
          '2023-03-20T10:08:00.000Z': [{ min: -10, max: 10 }],
          '2023-03-20T10:09:00.000Z': [{ min: 4, max: 12 }],
        },
      };
      const series = service.getChartOptions(
        [dpWithValues],
        timeRange,
        {
          YAxis: false,
          XAxis: false,
        },
        [],
        [],
        { displayMarkedLine: true, displayMarkedPoint: true }
      ).series as SeriesOption[];
      // then
      expect(series).toHaveLength(2);
      expect((series[0] as any).id).toBe(
        dp1.__target?.id + dp1.fragment + dp1.series + '/min'
      );
      expect((series[1] as any).id).toBe(
        dp1.__target?.id + dp1.fragment + dp1.series + '/max'
      );
      expect((series[0] as any).data).toEqual([
        ['2023-03-20T10:08:00.000Z', -10],
        ['2023-03-20T10:09:00.000Z', 4],
      ]);
      expect((series[1] as any).data).toEqual([
        ['2023-03-20T10:08:00.000Z', 10],
        ['2023-03-20T10:09:00.000Z', 12],
      ]);
    });

    it('for single datapoint of "bars" type and render type is "area"', () => {
      // given
      const dpWithValues: DatapointWithValues = {
        ...dp2,
        renderType: 'area',
        values: {
          '2023-03-20T10:08:00.000Z': [{ min: -10, max: 10 }],
          '2023-03-20T10:09:00.000Z': [{ min: 4, max: 12 }],
        },
      };
      const series = service.getChartOptions(
        [dpWithValues],
        timeRange,
        {
          YAxis: false,
          XAxis: false,
        },
        [],
        [],
        { displayMarkedLine: true, displayMarkedPoint: true }
      ).series as SeriesOption[];
      // then
      expect(series).toHaveLength(2);
      expect((series[0] as any).id).toBe(
        dp2.__target?.id + dp2.fragment + dp2.series + '/min'
      );
      expect((series[1] as any).id).toBe(
        dp2.__target?.id + dp2.fragment + dp2.series + '/max'
      );
      expect((series[0] as any).data).toEqual([
        ['2023-03-20T10:08:00.000Z', -10],
        ['2023-03-20T10:09:00.000Z', 4],
      ]);
      expect((series[1] as any).data).toEqual([
        ['2023-03-20T10:08:00.000Z', 10],
        ['2023-03-20T10:09:00.000Z', 12],
      ]);
    });
  });
});
