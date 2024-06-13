import { Injectable } from '@angular/core';
import { AlarmService, IAlarm, IFetchOptions, IResultList } from '@c8y/client';
import { AlarmDetails } from '../alarm-event-selector';

@Injectable()
export class ChartAlarmsService {
  constructor(private alarmService: AlarmService) {}

  async listAlarms(params?, alarms?: AlarmDetails[]): Promise<IAlarm[]> {
    if (!alarms) {
      return [];
    }
    const promises = alarms.map((alarm) => {
      if (alarm.__severity) {
        params = {
          ...params,
          severity: alarm.__severity,
        };
      }
      const fetchOptions: IFetchOptions = {
        source: alarm.__target.id,
        type: alarm.filters.type,
        withTotalPages: true,
        pageSize: 1000,
        ...params,
      };
      return this.alarmService.list(fetchOptions).then((result) => {
        result.data.forEach((iAlarm) => {
          iAlarm.color = alarm.color;
        });
        return result.data;
      });
    });
    const result = await Promise.all(promises);
    return result.flat();
  }
}
