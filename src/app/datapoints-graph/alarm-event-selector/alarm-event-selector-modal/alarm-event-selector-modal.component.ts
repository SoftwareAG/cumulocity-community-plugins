import { Component } from '@angular/core';
import { IIdentified } from '@c8y/client';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AlarmOrEvent, TimelineType } from '../alarm-event-selector.model';

@Component({
  selector: 'c8y-alarm-event-selector-modal',
  templateUrl: './alarm-event-selector-modal.component.html',
})
export class AlarmEventSelectorModalComponent {
  selectType: TimelineType = 'ALARM';
  contextAsset: IIdentified;
  allowChangingContext = true;
  allowSearch = true;
  selectedItems = new Array<AlarmOrEvent>();
  title: string;
  saveButtonLabel: string;
  readonly result: Promise<AlarmOrEvent[]> = new Promise((resolve, reject) => {
    this.save = resolve;
    this.cancel = reject;
  });

  private save: (value: AlarmOrEvent[]) => void;
  private cancel: (reason?: any) => void;

  constructor(private bsModal: BsModalRef) {}

  saveChanges(): void {
    this.bsModal.hide();
    this.save(this.selectedItems);
  }

  close() {
    this.bsModal.hide();
    this.cancel();
  }

  selectionChange(selection: Array<AlarmOrEvent>) {
    this.selectedItems = selection;
  }
}
