import { Component } from '@angular/core';
import { IIdentified } from '@c8y/client';
import { gettext } from '@c8y/ngx-components';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AlarmDetails } from './alarm-selector-modal.model';

@Component({
  selector: 'c8y-alarm-selector-modal',
  templateUrl: './alarm-selector-modal.component.html',
})
export class AlarmSelectorModalComponent {
  contextAsset: IIdentified;
  allowChangingContext = true;
  allowSearch = true;
  selectedAlarms = new Array<AlarmDetails>();
  title: string = gettext('Alarms selector');
  saveButtonLabel: string = gettext('Add alarms');
  readonly result: Promise<AlarmDetails[]> = new Promise((resolve, reject) => {
    this.save = resolve;
    this.cancel = reject;
  });

  private save: (value: AlarmDetails[]) => void;
  private cancel: (reason?: any) => void;

  constructor(private bsModal: BsModalRef) {}

  saveChanges(): void {
    this.bsModal.hide();
    this.save(this.selectedAlarms);
  }

  close() {
    this.bsModal.hide();
    this.cancel();
  }

  selectionChange(selection: Array<AlarmDetails>) {
    this.selectedAlarms = selection;
  }
}
