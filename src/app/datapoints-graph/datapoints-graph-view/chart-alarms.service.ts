import { Injectable } from '@angular/core';
import { AlarmService, IAlarm, IFetchOptions } from '@c8y/client';
import { AlarmDetails } from '../alarm-event-selector';

@Injectable()
export class ChartAlarmsService {
  constructor(private alarmService: AlarmService) {}

  /**
   * List alarms for the given alarm details.
   * @param params Additonal fetchOptions
   * @param alarms List of alarm types with details like color, target, etc.
   * @returns List of alarms for the given alarm details
   */
  async listAlarms(params?, alarms?: AlarmDetails[]): Promise<IAlarm[]> {
    if (!alarms) {
      return [];
    }
    const promises = alarms.map((alarm) => {
      if (alarm.__severity?.length > 0) {
        const severities = alarm.__severity.join(',');
        params = {
          ...params,
          severity: severities,
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
          iAlarm['color'] = alarm.color;
        });
        return result.data;
      });
    });
    const result = await Promise.all(promises);
    return result.flat();
  }
}