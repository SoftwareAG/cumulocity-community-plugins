import { NgModule } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AlarmSelectionListComponent } from './alarm-selection-list/alarm-selection-list.component';
import { CoreModule } from '@c8y/ngx-components';

@NgModule({
  imports: [CoreModule, DragDropModule],
  declarations: [AlarmSelectionListComponent],
  exports: [AlarmSelectionListComponent],
  providers: [],
})
export class AlarmSelectorModule {}
