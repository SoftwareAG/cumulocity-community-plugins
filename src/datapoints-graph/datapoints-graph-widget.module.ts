import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DynamicComponentDefinition,
  DynamicComponentErrorStrategy,
  DynamicDatapointsResolver,
  gettext,
  HOOK_COMPONENTS,
} from '@c8y/ngx-components';
import { ContextWidgetConfig } from '@c8y/ngx-components/context-dashboard';

async function loadViewComponent() {
  const { DatapointsGraphWidgetViewComponent } = await import(
    './datapoints-graph-view'
  );
  return DatapointsGraphWidgetViewComponent;
}

async function loadConfigComponent() {
  const { DatapointsGraphWidgetConfigComponent } = await import(
    './datapoints-graph-config'
  );
  return DatapointsGraphWidgetConfigComponent;
}

@NgModule({
  imports: [CommonModule],
  providers: [
    {
      provide: HOOK_COMPONENTS,
      multi: true,
      useValue: [
        {
          id: 'datapoints-graph',
          label: gettext('Data points graph'),
          description: gettext(
            'A graph display of a collection of data points'
          ),
          loadComponent: loadViewComponent,
          loadConfigComponent: loadConfigComponent,
          previewImage:
            '/apps/sag-pkg-community-plugins/c8y-widget-preview-img/datapoints-graph-widget.png',
          resolve: {
            datapoints: DynamicDatapointsResolver,
          },
          data: {
            settings: {
              noNewWidgets: false,
              widgetDefaults: {
                _width: 4,
                _height: 4,
              },
              noDeviceTarget: true,
              groupsSelectable: false,
            },
            displaySettings: {
              globalTimeContext: true,
            },
          } as ContextWidgetConfig,
          errorStrategy: DynamicComponentErrorStrategy.CUSTOM,
        } as DynamicComponentDefinition,
      ],
    },
  ],
})
export class DatapointsGraphWidgetModule {}
