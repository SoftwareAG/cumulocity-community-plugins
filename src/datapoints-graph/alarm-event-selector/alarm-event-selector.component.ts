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
  AlarmOrEvent,
  TimelineType,
  TimelineTypeTexts,
} from './alarm-event-selector.model';
import { AlarmEventSelectorService } from './alarm-event-selector.service';
import { AssetSelectionChangeEvent } from '@c8y/ngx-components/assets-navigator';

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
  @Input() timelineType: TimelineType = 'ALARM';
  @Input() contextAsset: IIdentified;
  @Input() allowChangingContext = true;
  @Input() selectedItems = new Array<AlarmOrEvent>();
  @Input() allowSearch = true;
  @Output() selectionChange = new EventEmitter<AlarmOrEvent[]>();
  filterString = '';
  maxNumberOfItems = 50;

  loadingItems = false;
  assetSelection = new BehaviorSubject<IIdentified>(null);
  items$: Observable<AlarmOrEvent[]>;
  filteredItems$: Observable<AlarmOrEvent[]>;
  filterStringChanges$: Observable<string>;
  timelineTypeTexts: TimelineTypeTexts;
  private filterString$ = new BehaviorSubject('');
  isExpanded = false;

  constructor(private alarmEventSelectorService: AlarmEventSelectorService) {}

  async ngOnInit(): Promise<void> {
    this.timelineTypeTexts = this.alarmEventSelectorService.timelineTypeTexts(
      this.timelineType
    );
    await this.setupObservables();
    if (this.contextAsset) {
      this.selectAsset(this.contextAsset);
    }
  }

  itemAdded(item: AlarmOrEvent): void {
    item.__active = true;
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

  assetSelectionChanged(evt: AssetSelectionChangeEvent): void {
    if (evt.items) {
      return this.selectAsset(evt.items.length ? evt.items[0] : evt.items);
    }
    // reset selection
    this.assetSelection.next(null);
  }

  trackByFn(_index: number, item: AlarmOrEvent): string {
    return `${item.filters.type}-${item.__target?.id}`;
  }

  filterStringChanged(newValue = ''): void {
    this.filterString$.next(newValue);
    this.filterString = newValue;
  }

  private async setupObservables(): Promise<void> {
    this.items$ = this.assetSelection.pipe(
      tap(() => {
        this.loadingItems = true;
      }),
      switchMap((asset) =>
        asset?.id
          ? this.alarmEventSelectorService.getItemsOfAsset(
              asset,
              this.timelineType
            )
          : []
      ),
      tap(() => (this.loadingItems = false)),
      shareReplay(1)
    );

    this.filterStringChanges$ = this.filterString$.pipe(
      distinctUntilChanged(),
      debounceTime(500),
      shareReplay(1)
    );

    this.filteredItems$ = combineLatest([
      this.filterStringChanges$,
      this.items$,
    ]).pipe(
      map(([filterString, items]) => {
        if (!filterString) {
          return items;
        }
        const lowerCaseFilterString = filterString.toLowerCase();
        return items.filter((item) =>
          this.includesFilterString(item, lowerCaseFilterString)
        );
      }),
      map((filtered) => filtered.slice(0, this.maxNumberOfItems))
    );
  }

  private selectAsset(asset: IIdentified) {
    this.assetSelection.next(asset);
    this.filterStringChanged();
  }

  private emitCurrentSelection() {
    this.selectionChange.emit(this.selectedItems);
  }

  private includesFilterString(
    alarm: AlarmOrEvent,
    lowerCaseFilterString: string
  ): boolean {
    const label = alarm.label?.toLowerCase();
    if (label && label.includes(lowerCaseFilterString)) {
      return true;
    }

    const type = alarm.filters.type?.toLowerCase();
    if (type && type.includes(lowerCaseFilterString)) {
      return true;
    }

    return false;
  }
}
