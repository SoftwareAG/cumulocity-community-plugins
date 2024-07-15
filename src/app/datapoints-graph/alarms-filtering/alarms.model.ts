import { InjectionToken } from '@angular/core';
import {
  AlarmStatusSettings,
  AlarmStatusType,
  AlarmStatus,
  IAlarm,
  SeverityFilter,
  SeverityType,
  Severity,
} from '@c8y/client';
import { NavigatorNode, NavigatorNodeData, Route } from '@c8y/ngx-components';

export interface AlarmsModuleConfig {
  /**
   * Indicates whether the application is a combination of Angular and AngularJS.
   * @optional
   */
  hybrid?: boolean;

  /**
   * The root node of the navigator, which can be either a `NavigatorNode` or `NavigatorNodeData`.
   * This serves as the entry point for navigation structure for Alarms views.
   * @optional
   */
  rootNavigatorNode?: NavigatorNode | NavigatorNodeData;

  /**
   * An array of `Route` objects representing the navigation routes available.
   * Each route defines a navigation path and its associated components related to Alarms.
   * @optional
   */
  route?: Route[];
}

export const ALARMS_MODULE_CONFIG = new InjectionToken('AlarmsModuleConfig');

export type AlarmCount = { [key in SeverityType]: number };

export const ALARM_STATUS_ICON = {
  ALERT_IDLE: 'c8y-alert-idle',
  BELL_SLASH: 'bell-slash',
  BELL: 'bell',
} as const;

export type AlarmStatusIcon =
  (typeof ALARM_STATUS_ICON)[keyof typeof ALARM_STATUS_ICON];

/**
 * A lookup table to map alarm statuses to corresponding icons.
 */
export const AlarmIconMap: Record<AlarmStatusType, AlarmStatusIcon> = {
  [AlarmStatus.CLEARED]: ALARM_STATUS_ICON.ALERT_IDLE,
  [AlarmStatus.ACKNOWLEDGED]: ALARM_STATUS_ICON.BELL_SLASH,
  [AlarmStatus.ACTIVE]: ALARM_STATUS_ICON.BELL,
} as const;

export const ALARM_SEVERITY_ICON = {
  CIRCLE: 'circle',
  HIGH_PRIORITY: 'high-priority',
  WARNING: 'warning',
  EXCLAMATION_CIRCLE: 'exclamation-circle',
} as const;

export type AlarmSeverityIcon =
  (typeof ALARM_SEVERITY_ICON)[keyof typeof ALARM_SEVERITY_ICON];
/**
 * A lookup table to map alarm severity types to corresponding icons.
 */
export const ALARM_SEVERITY_ICON_MAP: Record<SeverityType, AlarmSeverityIcon> =
  {
    [Severity.CRITICAL]: ALARM_SEVERITY_ICON.EXCLAMATION_CIRCLE,
    [Severity.MAJOR]: ALARM_SEVERITY_ICON.WARNING,
    [Severity.MINOR]: ALARM_SEVERITY_ICON.HIGH_PRIORITY,
    [Severity.WARNING]: ALARM_SEVERITY_ICON.CIRCLE,
  } as const;

export type FormFilters = {
  showCleared: boolean;
  severityOptions: SeverityFilter;
};

export type SelectedAlarm = IAlarm | null;

export const DEFAULT_ALARM_COUNTS: AlarmCount = {
  CRITICAL: 0,
  MAJOR: 0,
  MINOR: 0,
  WARNING: 0,
};

export const DEFAULT_SEVERITY_VALUES: SeverityFilter = {
  [Severity.CRITICAL]: true,
  [Severity.MAJOR]: true,
  [Severity.MINOR]: true,
  [Severity.WARNING]: true,
};

export const DEFAULT_STATUS_VALUES: AlarmStatusSettings = {
  [AlarmStatus.ACTIVE]: true,
  [AlarmStatus.ACKNOWLEDGED]: true,
  [AlarmStatus.CLEARED]: true,
};

export const ALARMS_PATH = 'alarms';

export type CustomFragment = {
  [key: string]: unknown;
};

/**
 * Default properties of a alarm. Used to extract the custom properties from a Alarm object.
 */
export const ALARM_DEFAULT_PROPERTIES = [
  'severity',
  'source',
  'type',
  'time',
  'text',
  'id',
  'status',
  'count',
  'name',
  'history',
  'self',
  'creationTime',
  'firstOccurrenceTime',
  'lastUpdated',
] as const satisfies ReadonlyArray<keyof IAlarm>;

export const THROTTLE_REALTIME_REFRESH = 1_000;
