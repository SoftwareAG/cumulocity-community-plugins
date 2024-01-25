import { NgModule } from '@angular/core';
import {
  HOOK_COMPONENTS,
  DynamicComponentDefinition,
  gettext,
} from '@c8y/ngx-components';

@NgModule({
  imports: [],
  exports: [],
  providers: [
    {
      provide: HOOK_COMPONENTS,
      multi: true,
      useValue: [
        {
          id: 'angular.widget.plugin',
          label: gettext('Module Federation widget'),
          description: 'Widget added via Module Federation',
          loadComponent: () =>
            import('./lazy').then((m) => m.ExampleWidgetPluginViewComponent),
          previewImage: '/apps/sag-pkg-community-plugins/c8y-widget-preview-img/widget-plugin-pr.png',
          loadConfigComponent: () =>
            import('./lazy').then((m) => m.ExampleWidgetPluginConfigComponent),
        },
      ] as DynamicComponentDefinition[],
    },
  ],
})
export class ExampleWidgetPluginModule {}
