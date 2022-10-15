import { Component, Injectable } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import MockDate from 'mockdate';
import { map, Observable, of } from 'rxjs';

abstract class LoadLastEventRepositoryService {
  abstract loadLastEventById: (
    groupId: string
  ) => Observable<{ endDate: Date; reviewDurationInHours: number } | undefined>;
}

@Injectable()
class LoadLastEventRepositorySpyService implements LoadLastEventRepositoryService {
  public groupId?: string;
  public callsCount?: number = 0;
  public output?: { endDate: Date; reviewDurationInHours: number };

  public loadLastEventById(groupId: string): Observable<{ endDate: Date; reviewDurationInHours: number } | undefined> {
    this.groupId = groupId;
    this.callsCount!++;
    return of(this.output);
  }
}

type EventStatus = { status: string };

@Component({
  selector: 'app-check-last-event-status',
  template: ''
})
class CheckLastEventStatusComponent {
  constructor(private loadLastEventRepository: LoadLastEventRepositoryService) {}

  perform(groupId: string): Observable<EventStatus> {
    return this.loadLastEventRepository.loadLastEventById(groupId).pipe(
      map(event => {
        if (!event) return { status: 'done' };
        const now = new Date();
        return event.endDate >= now ? { status: 'active' } : { status: 'inReview' };
      })
    );
  }
}

describe(CheckLastEventStatusComponent.name, () => {
  let fixture: ComponentFixture<CheckLastEventStatusComponent>;
  let sut: CheckLastEventStatusComponent;
  let loadLastEventRepository: LoadLastEventRepositorySpyService;

  const groupId = 'any_group_id';

  beforeAll(() => {
    MockDate.set(new Date());
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CheckLastEventStatusComponent],
      providers: [
        {
          provide: LoadLastEventRepositoryService,
          useClass: LoadLastEventRepositorySpyService
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckLastEventStatusComponent);
    sut = fixture.componentInstance;
    loadLastEventRepository = TestBed.inject(LoadLastEventRepositoryService);
  });

  it('should get last event data', () => {
    fixture.detectChanges();
    sut.perform(groupId);

    expect(loadLastEventRepository.groupId).toBe(groupId);
    expect(loadLastEventRepository.callsCount).toBe(1);
  });

  it('should return satus done whe group has no event', done => {
    fixture.detectChanges();
    loadLastEventRepository.output = undefined;

    sut.perform(groupId).subscribe(eventStatus => {
      expect(eventStatus.status).toBe('done');
      done();
    });
  });

  it('should return satus active when now is before event and time', done => {
    fixture.detectChanges();
    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime() + 1),
      reviewDurationInHours: 1
    };

    sut.perform(groupId).subscribe(eventStatus => {
      expect(eventStatus.status).toBe('active');
      done();
    });
  });

  it('should return satus active when now is equal to event and time', done => {
    fixture.detectChanges();
    loadLastEventRepository.output = {
      endDate: new Date(),
      reviewDurationInHours: 1
    };

    sut.perform(groupId).subscribe(eventStatus => {
      expect(eventStatus.status).toBe('active');
      done();
    });
  });

  it('should return satus inReview when now is after event and time', done => {
    fixture.detectChanges();
    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime() - 1),
      reviewDurationInHours: 1
    };

    sut.perform(groupId).subscribe(eventStatus => {
      expect(eventStatus.status).toBe('inReview');
      done();
    });
  });

  it('should return satus inReview when now equal to review time', done => {
    fixture.detectChanges();
    const reviewDurationInHours = 1;
    const reviewDurationInMs = reviewDurationInHours * 60 * 60 * 1000;
    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime() - reviewDurationInMs),
      reviewDurationInHours
    };

    sut.perform(groupId).subscribe(eventStatus => {
      expect(eventStatus.status).toBe('inReview');
      done();
    });
  });

  afterAll(() => {
    MockDate.reset();
  });
});
