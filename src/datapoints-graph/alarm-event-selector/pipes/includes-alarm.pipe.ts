import { Pipe, PipeTransform } from '@angular/core';
import {
  AlarmDetails,
  AlarmOrEvent,
  EventDetails,
} from '../alarm-event-selector-modal/alarm-event-selector-modal.model';

@Pipe({
  name: 'includesAlarmOrEvent',
})
export class IncludesAlarmOrEventPipe implements PipeTransform {
  transform(itemList: EventDetails[], item?: EventDetails): boolean;
  transform(itemList: AlarmDetails[], item?: AlarmDetails): boolean;
  transform(itemList: any[], item?: any): boolean {
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
