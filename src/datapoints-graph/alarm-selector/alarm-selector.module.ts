import { NgModule } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AlarmSelectionListComponent } from './alarm-selection-list/alarm-selection-list.component';
import { CoreModule } from '@c8y/ngx-components';
import { AlarmSelectorListItemComponent } from './alarm-selector-list-item/alarm-selector-list-item.component';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { AlarmAttributesFormComponent } from './alarm-attributes-form/alarm-attributes-form.component';
import { AlarmSelectorModalComponent } from './alarm-selector-modal/alarm-selector-modal.component';
import { AlarmSelectorComponent } from './alarm-selector.component';
import { AssetSelectorModule } from '@c8y/ngx-components/assets-navigator';

@NgModule({
  imports: [
    CoreModule,
    DragDropModule,
    PopoverModule,
    TooltipModule,
    AssetSelectorModule,
  ],
  declarations: [
    AlarmSelectionListComponent,
    AlarmSelectorListItemComponent,
    AlarmAttributesFormComponent,
    AlarmSelectorModalComponent,
    AlarmSelectorComponent,
  ],
  exports: [AlarmSelectionListComponent],
})
export class AlarmSelectorModule {}
