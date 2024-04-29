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
  AlarmOrEvent,
  DEFAULT_SEVERITY_VALUES,
  TimelineType,
} from './alarm-event-selector-modal/alarm-event-selector-modal.model';
import { AlarmEventSelectorService } from './alarm-event-selector.service';
import { ColorService, gettext } from '@c8y/ngx-components';

@Component({
  selector: 'c8y-alarm-event-selector',
  templateUrl: './alarm-event-selector.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => AlarmEventSelectorComponent),
    },
  ],
})
export class AlarmEventSelectorComponent implements OnInit {
  @Input() selectType: TimelineType = 'ALARM';
  @Input() contextAsset: IIdentified;
  @Input() allowChangingContext = true;
  @Input() selectedItems = new Array<AlarmOrEvent>();
  @Input() allowSearch = true;
  @Input() defaultActiveState = true;
  @Output() selectionChange = new EventEmitter<AlarmOrEvent[]>();
  searchString = '';
  maxNumberOfItems = 50;

  loadingItems = false;
  assetSelection = new BehaviorSubject<IIdentified>(null);
  items$: Observable<AlarmOrEvent[]>;
  filteredItems$: Observable<AlarmOrEvent[]>;
  searchStringChanges$: Observable<string>;
  blankItem: AlarmOrEvent;
  timelineTypeTexts: ReturnType<AlarmEventSelectorService['timelineTypeTexts']>;
  private searchString$ = new BehaviorSubject('');

  constructor(
    private alarmEventSelectorService: AlarmEventSelectorService,
    private color: ColorService
  ) {}

  async ngOnInit(): Promise<void> {
    this.timelineTypeTexts = this.alarmEventSelectorService.timelineTypeTexts(
      this.selectType
    );

    await this.setupObservables();

    if (this.contextAsset) {
      this.selectionChanged(this.contextAsset);
    }
  }

  itemAdded(item: AlarmOrEvent): void {
    item.__active = this.defaultActiveState;
    this.selectedItems = [...this.selectedItems, item];
    this.emitCurrentSelection();
  }

  itemRemoved(alarm: AlarmOrEvent): void {
    this.selectedItems = this.selectedItems.filter(
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

  trackByFn(_index: number, item: AlarmOrEvent): string {
    return `${item.filters.type}-${item.__target?.id}`;
  }

  searchStringChanged(newValue = ''): void {
    this.searchString$.next(newValue);
    this.searchString = newValue;
  }

  private async setupObservables(): Promise<void> {
    const blankItemColor = await this.color.generateColor(null);
    this.items$ = this.assetSelection.pipe(
      tap(() => {
        this.loadingItems = true;
      }),
      tap((asset) => {
        this.blankItem = this.getBlankItem(asset, blankItemColor);
      }),
      switchMap((asset) =>
        asset?.id
          ? this.alarmEventSelectorService.getItemsOfAsset(
              asset,
              this.selectType
            )
          : []
      ),
      tap(() => (this.loadingItems = false)),
      shareReplay(1)
    );

    this.searchStringChanges$ = this.searchString$.pipe(
      distinctUntilChanged(),
      debounceTime(500),
      shareReplay(1)
    );

    this.filteredItems$ = combineLatest([
      this.searchStringChanges$,
      this.items$,
    ]).pipe(
      map(([searchString, items]) => {
        if (!searchString) {
          return items;
        }
        const lowerCaseSearchString = searchString.toLowerCase();
        return items.filter((item) =>
          this.includesSearchString(item, lowerCaseSearchString)
        );
      }),
      map((filtered) => filtered.slice(0, this.maxNumberOfItems))
    );
  }

  private selectAsset(asset: IIdentified) {
    this.assetSelection.next(asset);
    this.searchStringChanged();
  }

  private emitCurrentSelection() {
    this.selectionChange.emit(this.selectedItems);
  }

  private includesSearchString(
    alarm: AlarmOrEvent,
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

  private getBlankItem(
    asset: IIdentified,
    blankItemColor: string
  ): AlarmOrEvent {
    if (!asset) {
      return null;
    } else if (this.selectType === 'ALARM') {
      return {
        timelineType: 'ALARM',
        color: blankItemColor,
        label: '',
        filters: {
          type: '',
          severities: DEFAULT_SEVERITY_VALUES,
        },
        __target: asset,
      };
    } else {
      return {
        timelineType: 'EVENT',
        color: blankItemColor,
        label: '',
        filters: {
          type: '',
        },
        __target: asset,
      };
    }
  }
}
