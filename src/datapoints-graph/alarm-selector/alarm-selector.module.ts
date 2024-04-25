import { NgModule } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AlarmSelectionListComponent } from './alarm-selection-list/alarm-selection-list.component';
import { CoreModule } from '@c8y/ngx-components';
import { AlarmSelectorListItemComponent } from './alarm-selector-list-item/alarm-selector-list-item.component';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { AlarmAttributesFormComponent } from './alarm-attributes-form/alarm-attributes-form.component';
import { AlarmSelectorModalComponent } from './alarm-selector-modal/alarm-selector-modal.component';

@NgModule({
  imports: [CoreModule, DragDropModule, PopoverModule, TooltipModule],
  declarations: [
    AlarmSelectionListComponent,
    AlarmSelectorListItemComponent,
    AlarmAttributesFormComponent,
    AlarmSelectorModalComponent,
  ],
  exports: [AlarmSelectionListComponent],
})
export class AlarmSelectorModule {}
