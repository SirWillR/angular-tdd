import { Component, Injectable } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { first, Observable, of } from 'rxjs';

abstract class LoadLastEventRepositoryService {
  abstract loadLastEvent: (groupId: string) => Observable<string>;
}

@Injectable()
class LoadLastEventRepositorySpyService
  implements LoadLastEventRepositoryService
{
  public groupId?: string;
  public callsCount?: number = 0;
  public output?: string;

  loadLastEvent(groupId: string): Observable<string> {
    this.groupId = groupId;
    this.callsCount!++;
    return of('done').pipe(first());
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
    return this.loadLastEventRepository.loadLastEvent(groupId);
  }
}

describe(CheckLastEventStatusComponent.name, () => {
  let fixture: ComponentFixture<CheckLastEventStatusComponent>;
  let sut: CheckLastEventStatusComponent;
  let loadLastEventRepository: LoadLastEventRepositorySpyService;

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

  it('should return satus done whe group has no event', (done) => {
    fixture.detectChanges();
    loadLastEventRepository.output = undefined;
    sut.perform('any_group_id').subscribe((status) => {
      expect(status).toBe('done');
      done();
    });
  });
});
