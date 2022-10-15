import { Component, Injectable } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import MockDate from 'mockdate';
import { map, Observable, of } from 'rxjs';

abstract class LoadLastEventRepositoryService {
  abstract loadLastEvent: (
    groupId: string
  ) => Observable<{ endDate: Date } | undefined>;
}

@Injectable()
class LoadLastEventRepositorySpyService
  implements LoadLastEventRepositoryService
{
  public groupId?: string;
  public callsCount?: number = 0;
  public output?: { endDate: Date };

  loadLastEvent(groupId: string): Observable<{ endDate: Date } | undefined> {
    this.groupId = groupId;
    this.callsCount!++;
    return of(this.output);
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

  perform(groupId: string): Observable<string> {
    return this.loadLastEventRepository
      .loadLastEvent(groupId)
      .pipe(map(status => (status === undefined ? 'done' : 'active')));
  }
}

describe(CheckLastEventStatusComponent.name, () => {
  let fixture: ComponentFixture<CheckLastEventStatusComponent>;
  let sut: CheckLastEventStatusComponent;
  let loadLastEventRepository: LoadLastEventRepositorySpyService;

  beforeAll(() => {
    MockDate.set(new Date());
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CheckLastEventStatusComponent],
      providers: [
        {
          provide: LoadLastEventRepositoryService,
          useClass: LoadLastEventRepositorySpyService,
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

  it('should return satus done whe group has no event', done => {
    fixture.detectChanges();
    loadLastEventRepository.output = undefined;
    sut.perform('any_group_id').subscribe(status => {
      expect(status).toBe('done');
      done();
    });
  });

  it('should return satus active when now is before event and time', done => {
    fixture.detectChanges();
    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime() + 1),
    };
    sut.perform('any_group_id').subscribe(status => {
      expect(status).toBe('active');
      done();
    });
  });

  afterAll(() => {
    MockDate.reset();
  });
});
