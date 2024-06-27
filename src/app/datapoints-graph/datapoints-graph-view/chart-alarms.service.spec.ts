import { TestBed } from '@angular/core/testing';
import { ChartAlarmsService } from './chart-alarms.service';
import { AlarmService, IAlarm } from '@c8y/client';

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
      const mockAlarms: IAlarm[] = [
        { id: '1', text: 'Alarm 1' },
        { id: '2', text: 'Alarm 2' },
        { id: '3', text: 'Alarm 3' },
      ];
      jest.spyOn(alarmService, 'list').mockResolvedValue(mockAlarms);

      const result = await service.listAlarms();

      expect(result).toEqual(mockAlarms);
    });

    it('should filter alarms based on the provided parameters', async () => {
      const mockAlarms: IAlarm[] = [
        { id: '1', text: 'Alarm 1', severity: 'MAJOR' },
        { id: '2', text: 'Alarm 2', severity: 'MINOR' },
        { id: '3', text: 'Alarm 3', severity: 'CRITICAL' },
      ];
      jest.spyOn(alarmService, 'list').mockResolvedValue(mockAlarms);

      const result = await service.listAlarms({ severity: 'MAJOR' });

      expect(result).toEqual([{ id: '1', text: 'Alarm 1', severity: 'MAJOR' }]);
    });
  });
});
