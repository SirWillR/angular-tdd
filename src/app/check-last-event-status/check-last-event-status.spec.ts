import { Component, Injectable } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

abstract class LoadLastEventRepositoryService {
  abstract loadLastEvent: (groupId: string) => Observable<void>;
}

@Injectable()
class LoadLastEventRepositoryMockService
  implements LoadLastEventRepositoryService
{
  public groupId?: string;
  public callsCount?: number = 0;

  loadLastEvent(groupId: string): Observable<void> {
    this.groupId = groupId;
    this.callsCount!++;
    return of();
  }
}

@Component({
  selector: 'app-check-last-event-status',
  template: '',
})
class CheckLastEventStatusComponent {
  constructor(
    private loadLastEventRepository: LoadLastEventRepositoryService
  ) {}

  perform(groupId: string): Observable<void> {
    return this.loadLastEventRepository.loadLastEvent(groupId);
  }
}

describe(CheckLastEventStatusComponent.name, () => {
  let fixture: ComponentFixture<CheckLastEventStatusComponent>;
  let sut: CheckLastEventStatusComponent;
  let loadLastEventRepository: LoadLastEventRepositoryMockService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CheckLastEventStatusComponent],
      providers: [
        {
          provide: LoadLastEventRepositoryService,
          useClass: LoadLastEventRepositoryMockService,
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckLastEventStatusComponent);
    sut = fixture.componentInstance;
    loadLastEventRepository = TestBed.inject(LoadLastEventRepositoryService);
  });

  it('should get last event data', () => {
    fixture.detectChanges();
    sut.perform('any_group_id');
    expect(loadLastEventRepository.groupId).toBe('any_group_id');
    expect(loadLastEventRepository.callsCount).toBe(1);
  });
});
