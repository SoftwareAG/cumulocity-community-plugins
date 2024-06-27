import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExampleWidgetPluginViewComponent } from './example-widget-plugin.component';
import { ExampleWidgetPluginConfigComponent } from './example-widget-plugin-config.component';
import { FormsModule } from '@c8y/ngx-components';

@NgModule({
  declarations: [
    ExampleWidgetPluginViewComponent,
    ExampleWidgetPluginConfigComponent,
  ],
  imports: [CommonModule, FormsModule],
})
export class LazyExampleWidgetPluginModule {}
