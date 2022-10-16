import { Component, Injectable } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { createSpyFromClass, Spy } from 'jest-auto-spies';
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

class EventStatus {
  status: 'active' | 'inReview' | 'done';

  constructor(event?: { endDate: Date; reviewDurationInHours: number }) {
    if (!event) {
      this.status = 'done';
      return;
    }

    const now = new Date();
    if (event.endDate >= now) {
      this.status = 'active';
      return;
    }

    const reviewDurationInMs = event.reviewDurationInHours * 60 * 60 * 1000;
    const reviewDate = new Date(event.endDate.getTime() + reviewDurationInMs);
    this.status = reviewDate >= now ? 'inReview' : 'done';
  }
}

@Component({
  selector: 'app-check-last-event-status',
  template: ''
})
class CheckLastEventStatusComponent {
  constructor(private loadLastEventRepositorySpy: LoadLastEventRepositoryService) {}

  perform(groupId: string): Observable<EventStatus> {
    return this.loadLastEventRepositorySpy.loadLastEventById(groupId).pipe(map(event => new EventStatus(event)));
  }
}

describe(CheckLastEventStatusComponent.name, () => {
  let fixture: ComponentFixture<CheckLastEventStatusComponent>;
  let sut: CheckLastEventStatusComponent;
  let loadLastEventRepositorySpy: Spy<LoadLastEventRepositorySpyService>;

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
          useClass: createSpyFromClass(LoadLastEventRepositorySpyService)
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckLastEventStatusComponent);
    sut = fixture.componentInstance;
    loadLastEventRepositorySpy = TestBed.inject<any>(LoadLastEventRepositoryService);
  });

  it('should get last event data', () => {
    fixture.detectChanges();
    sut.perform(groupId);

    expect(loadLastEventRepositorySpy.groupId).toBe(groupId);
    expect(loadLastEventRepositorySpy.callsCount).toBe(1);
  });

  it('should return satus done whe group has no event', done => {
    fixture.detectChanges();
    loadLastEventRepositorySpy.output = undefined;

    sut.perform(groupId).subscribe(eventStatus => {
      try {
        expect(eventStatus.status).toBe('done');
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('should return satus active when now is before event and time', done => {
    fixture.detectChanges();
    loadLastEventRepositorySpy.output = {
      endDate: new Date(new Date().getTime() + 1),
      reviewDurationInHours: 1
    };

    sut.perform(groupId).subscribe(eventStatus => {
      try {
        expect(eventStatus.status).toBe('active');
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('should return satus active when now is equal to event and time', done => {
    fixture.detectChanges();
    loadLastEventRepositorySpy.output = {
      endDate: new Date(),
      reviewDurationInHours: 1
    };

    sut.perform(groupId).subscribe(eventStatus => {
      try {
        expect(eventStatus.status).toBe('active');
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('should return satus inReview when now is after event and time', done => {
    fixture.detectChanges();
    loadLastEventRepositorySpy.output = {
      endDate: new Date(new Date().getTime() - 1),
      reviewDurationInHours: 1
    };

    sut.perform(groupId).subscribe(eventStatus => {
      try {
        expect(eventStatus.status).toBe('inReview');
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('should return satus inReview when now equal to review time', done => {
    fixture.detectChanges();
    const reviewDurationInHours = 1;
    const reviewDurationInMs = reviewDurationInHours * 60 * 60 * 1000;
    loadLastEventRepositorySpy.output = {
      endDate: new Date(new Date().getTime() - reviewDurationInMs),
      reviewDurationInHours
    };

    sut.perform(groupId).subscribe(eventStatus => {
      try {
        expect(eventStatus.status).toBe('inReview');
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('should return satus done when now is after review time', done => {
    fixture.detectChanges();
    const reviewDurationInHours = 1;
    const reviewDurationInMs = reviewDurationInHours * 60 * 60 * 1000;
    loadLastEventRepositorySpy.output = {
      endDate: new Date(new Date().getTime() - reviewDurationInMs - 1),
      reviewDurationInHours
    };

    sut.perform(groupId).subscribe(eventStatus => {
      try {
        expect(eventStatus.status).toBe('done');
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  afterAll(() => {
    MockDate.reset();
  });
});
