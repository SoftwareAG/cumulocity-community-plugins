import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AlarmSelectorService {
  async selectAlarms(val) {
    console.log('Selecting alarms');
    return null;
  }
}
