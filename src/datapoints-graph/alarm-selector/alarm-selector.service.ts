import { Injectable } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import {
  AlarmDetails,
  AlarmSelectorModalOptions,
} from './alarm-selector-modal/alarm-selector-modal.model';
import { AlarmSelectorModalComponent } from './alarm-selector-modal/alarm-selector-modal.component';

@Injectable({ providedIn: 'root' })
export class AlarmSelectorService {
  constructor(protected modal: BsModalService) {}

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
}
