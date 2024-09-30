import { TestBed } from '@angular/core/testing';
import { ChartAlarmsService } from './chart-alarms.service';
import { AlarmService, IAlarm, IFetchResponse } from '@c8y/client';
import { AlarmDetails } from '@c8y/ngx-components/alarm-event-selector';

describe('ChartAlarmsService', () => {
  let service: ChartAlarmsService;
  let alarmService: AlarmService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChartAlarmsService, AlarmService],
    });
    service = TestBed.inject(ChartAlarmsService);
    alarmService = TestBed.inject(AlarmService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('listAlarms', () => {
    it('should return a list of alarms', async () => {
      const mockAlarmsData: IAlarm[] = [
        { id: '1', text: 'Alarm 1' } as IAlarm,
        { id: '2', text: 'Alarm 2' } as IAlarm,
        { id: '3', text: 'Alarm 3' } as IAlarm,
      ];
      const mockAlarms = Promise.resolve({
        data: mockAlarmsData,
        res: { status: 200, headers: {} } as IFetchResponse,
      });
      jest.spyOn(alarmService, 'list').mockResolvedValue(mockAlarms);

      const result = await service.listAlarms({}, [
        {
          timelineType: 'ALARM',
          filters: { type: 'type' },
          __target: { id: '1' },
        } as AlarmDetails,
      ]);

      expect(result).toEqual(mockAlarmsData);
    });
  });
});
