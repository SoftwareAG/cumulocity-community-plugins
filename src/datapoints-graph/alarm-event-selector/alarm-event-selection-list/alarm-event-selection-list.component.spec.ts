import { AlarmEventSelectionListComponent } from './alarm-event-selection-list.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  CommonModule,
  FormsModule,
  ListGroupModule,
} from '@c8y/ngx-components';
import { ReactiveFormsModule } from '@angular/forms';
import { BsModalService } from 'ngx-bootstrap/modal';
import { WidgetConfigComponent } from '@c8y/ngx-components/context-dashboard';
import { DragDropModule } from '@angular/cdk/drag-drop';

describe('AlarmEventSelectionListComponent', () => {
  let component: AlarmEventSelectionListComponent;
  let fixture: ComponentFixture<AlarmEventSelectionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule.forRoot(),
        FormsModule,
        ReactiveFormsModule,
        ListGroupModule,
        DragDropModule,
      ],
      declarations: [AlarmEventSelectionListComponent],
      providers: [
        BsModalService,
        {
          provide: WidgetConfigComponent,
          useValue: {
            context: { id: 1, name: 'test device', c8y_IsDevice: true },
          },
        },
      ],
    }).compileComponents();
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(AlarmEventSelectionListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set context asset', () => {
    // when
    fixture.detectChanges();
    // then
    expect(component.config).toEqual({
      contextAsset: {
        id: 1,
        name: 'test device',
        c8y_IsDevice: true,
      },
    });
  });
});
