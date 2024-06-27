import { Pipe, PipeTransform } from '@angular/core';
import { AlarmDetails, EventDetails } from '../alarm-event-selector.model';

@Pipe({
  name: 'includesAlarmOrEvent',
})
export class IncludesAlarmOrEventPipe implements PipeTransform {
  transform<T extends AlarmDetails | EventDetails>(
    itemList: T[],
    item?: T
  ): boolean {
    if (!Array.isArray(itemList) || !item) {
      return false;
    }
    return itemList.some(
      (tmp) =>
        tmp.label === item.label &&
        tmp.filters.type === item.filters.type &&
        tmp.__target?.id === item.__target?.id
    );
  }
}
