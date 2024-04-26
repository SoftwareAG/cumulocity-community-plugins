import { Injectable } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import {
  AlarmDetails,
  AlarmSelectorModalOptions,
} from './alarm-selector-modal/alarm-selector-modal.model';
import { AlarmSelectorModalComponent } from './alarm-selector-modal/alarm-selector-modal.component';
import { AlarmService, IAlarm, IIdentified } from '@c8y/client';
import { uniqBy } from 'lodash-es';
import { ColorService } from '@c8y/ngx-components';

@Injectable({ providedIn: 'root' })
export class AlarmSelectorService {
  constructor(
    private modal: BsModalService,
    private alarmService: AlarmService,
    private color: ColorService
  ) {}

  selectAlarms(
    initialState: Partial<AlarmSelectorModalOptions> = {}
  ): Promise<AlarmDetails[]> {
    const modal = this.modal.show(AlarmSelectorModalComponent, {
      ignoreBackdropClick: true,
      keyboard: false,
      initialState,
      class: 'modal-lg',
    });
    const content = modal.content as AlarmSelectorModalComponent;
    return content.result;
  }

  async getAlarmsOfAsset(
    parentReference: IIdentified
  ): Promise<AlarmDetails[]> {
    const filters = { source: parentReference.id, pageSize: 10 };
    const res = await this.alarmService.list(filters);

    const alarms: AlarmDetails[] = uniqBy(res.data, 'type').map(
      async (a: IAlarm) => {
        return {
          timelineType: 'ALARM',
          color: await this.color.generateColor(a.type),
          label: a.type,
          filters: {
            type: a.type,
          },
          __target: parentReference,
        } as AlarmDetails;
      }
    );
    return await Promise.all(alarms);
  }
}
