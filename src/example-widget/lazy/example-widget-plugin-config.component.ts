import { Component, Input } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';
import {
  DynamicComponent,
  OnBeforeSave,
  AlertService,
} from '@c8y/ngx-components';

@Component({
  selector: 'c8y-community-example-widget-plugin-config',
  template: `
    <div class="form-group">
      <c8y-form-group>
        <label>Text</label>
        <textarea
          style="width:100%"
          [(ngModel)]="config.text"
          name="text"
          [required]="true"
        ></textarea>
      </c8y-form-group>
    </div>
  `,
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
})
export class ExampleWidgetPluginConfigComponent
  implements DynamicComponent, OnBeforeSave
{
  @Input() config = { text: '' };

  constructor(private alert: AlertService) {}

  onBeforeSave(config: ExampleWidgetPluginConfigComponent['config']): boolean {
    if (config.text.trim() === '') {
      this.alert.warning('Please enter a valid text.');
      return false;
    }
    return true;
  }
}
