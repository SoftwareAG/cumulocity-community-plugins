import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { IIdentified } from '@c8y/client';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs/operators';
import {
  AlarmDetails,
  DEFAULT_SEVERITY_VALUES,
} from './alarm-selector-modal/alarm-selector-modal.model';
import { AlarmSelectorService } from './alarm-selector.service';
import { ColorService } from '@c8y/ngx-components';

@Component({
  selector: 'c8y-alarm-selector',
  templateUrl: './alarm-selector.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => AlarmSelectorComponent),
    },
  ],
})
export class AlarmSelectorComponent implements OnInit {
  @Input() contextAsset: IIdentified;
  @Input() allowChangingContext = true;
  @Input() selectedAlarms = new Array<AlarmDetails>();
  @Input() allowSearch = true;
  @Input() defaultActiveState = true;
  @Output() selectionChange = new EventEmitter<AlarmDetails[]>();
  searchString = '';
  maxNumberOfAlarms = 50;

  loadingAlarms = false;
  assetSelection = new BehaviorSubject<IIdentified>(null);
  alarms$: Observable<AlarmDetails[]>;
  filteredAlarms$: Observable<AlarmDetails[]>;
  searchStringChanges$: Observable<string>;
  blankAlarm: AlarmDetails;

  private searchString$ = new BehaviorSubject('');

  constructor(
    private alarmSelectorService: AlarmSelectorService,
    private color: ColorService
  ) {}

  ngOnInit(): void {
    this.setupObservables();

    if (this.contextAsset) {
      this.selectionChanged(this.contextAsset);
    }
  }

  alarmAdded(alarm: AlarmDetails): void {
    alarm.__active = this.defaultActiveState;
    this.selectedAlarms = [...this.selectedAlarms, alarm];
    this.emitCurrentSelection();
  }

  alarmRemoved(alarm: AlarmDetails): void {
    this.selectedAlarms = this.selectedAlarms.filter(
      (tmp) =>
        tmp.label !== alarm.label ||
        tmp.filters.type !== alarm.filters.type ||
        tmp.__target?.id !== alarm.__target?.id
    );
    this.emitCurrentSelection();
  }

  selectionChanged(evt: IIdentified | IIdentified[]): void {
    if (Array.isArray(evt) && evt.length !== 0) {
      return this.selectAsset(evt[0]);
    }

    if (!Array.isArray(evt) && evt.items) {
      return this.selectionChanged(evt.items);
    }

    if (!Array.isArray(evt) && evt.id) {
      return this.selectAsset(evt);
    }

    // reset selection
    this.assetSelection.next(null);
  }

  trackByFn(_index: number, item: AlarmDetails): string {
    return `${item.filters.type}-${item.__target?.id}`;
  }

  searchStringChanged(newValue = ''): void {
    this.searchString$.next(newValue);
    this.searchString = newValue;
  }

  private async setupObservables(): Promise<void> {
    const blankAlarmColor = await this.color.generateColor(null);
    this.alarms$ = this.assetSelection.pipe(
      tap(() => {
        this.loadingAlarms = true;
      }),
      tap((asset) => {
        this.blankAlarm = asset
          ? {
              timelineType: 'ALARM',
              color: blankAlarmColor,
              label: '',
              filters: {
                type: '',
                severities: DEFAULT_SEVERITY_VALUES,
              },
              __target: asset,
            }
          : null;
      }),
      switchMap((asset) =>
        asset?.id ? this.alarmSelectorService.getAlarmsOfAsset(asset) : []
      ),
      tap(() => (this.loadingAlarms = false)),
      shareReplay(1)
    );

    this.searchStringChanges$ = this.searchString$.pipe(
      distinctUntilChanged(),
      debounceTime(500),
      shareReplay(1)
    );

    this.filteredAlarms$ = combineLatest([
      this.searchStringChanges$,
      this.alarms$,
    ]).pipe(
      map(([searchString, alarms]) => {
        if (!searchString) {
          return alarms;
        }
        const lowerCaseSearchString = searchString.toLowerCase();
        return alarms.filter((alarm) =>
          this.includesSearchString(alarm, lowerCaseSearchString)
        );
      }),
      map((filtered) => filtered.slice(0, this.maxNumberOfAlarms))
    );
  }

  private selectAsset(asset: IIdentified) {
    this.assetSelection.next(asset);
    this.searchStringChanged();
  }

  private clearSelection(): void {
    this.selectedAlarms = [];
    this.emitCurrentSelection();
  }

  private emitCurrentSelection() {
    this.selectionChange.emit(this.selectedAlarms);
  }

  private includesSearchString(
    alarm: AlarmDetails,
    lowerCaseSearchString: string
  ): boolean {
    const label = alarm.label?.toLowerCase();
    if (label && label.includes(lowerCaseSearchString)) {
      return true;
    }

    const type = alarm.filters.type?.toLowerCase();
    if (type && type.includes(lowerCaseSearchString)) {
      return true;
    }

    return false;
  }
}
