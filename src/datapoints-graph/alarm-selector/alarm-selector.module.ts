import { NgModule } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AlarmSelectionListComponent } from './alarm-selection-list/alarm-selection-list.component';
import { CoreModule } from '@c8y/ngx-components';
import { AlarmSelectorListItemComponent } from './alarm-selector-list-item/alarm-selector-list-item.component';

@NgModule({
  imports: [CoreModule, DragDropModule],
  declarations: [AlarmSelectionListComponent, AlarmSelectorListItemComponent],
  exports: [AlarmSelectionListComponent],
  providers: [],
})
export class AlarmSelectorModule {}
