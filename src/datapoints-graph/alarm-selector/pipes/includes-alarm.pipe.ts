import { Pipe, PipeTransform } from '@angular/core';
import { AlarmDetails } from '../alarm-selector-modal/alarm-selector-modal.model';

@Pipe({
  name: 'includesAlarm',
})
export class IncludesAlarmPipe implements PipeTransform {
  transform(alarmList: AlarmDetails[], alarm?: AlarmDetails): boolean {
    if (!Array.isArray(alarmList) || !alarm) {
      return false;
    }
    return alarmList.some(
      (tmp) =>
        tmp.label === alarm.label &&
        tmp.filters.type === alarm.filters.type &&
        tmp.__target?.id === alarm.__target?.id
    );
  }
}
