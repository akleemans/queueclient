import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {forkJoin, map, Observable} from 'rxjs';
import {UiRun} from './app.component';
import {EnvService} from './env.service';
import {Run, RunResponse} from './model/run';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private gameId = 'y65797de';
  private baseUrl = EnvService.getRestUrl();
  private maxPaginationOffset = 10000;

  public constructor(
    private readonly httpClient: HttpClient
  ) {
  }

  public getQueue(): Observable<Run[]> {
    const urls: Observable<Run[]>[] = [];
    for (let i = 0; i < this.maxPaginationOffset; i += 200) {
      for (let direction of ['asc', 'desc']) {
        const ascUrl = `${this.baseUrl}/runs?game=${this.gameId}&status=new&embed=category,level,players&orderby=submitted&direction=${direction}&max=200&offset=${i}`
        urls.push(this.httpClient.get<RunResponse>(ascUrl).pipe(map(r => r.data)))
      }
    }
    return forkJoin(urls).pipe(map(result => {
      const arr: Run[] = [];
      result.forEach(r => arr.push(...r))
      // Only return unique runs, sort them by date ascending
      return this.getDistinctArray(arr)
      .sort((a, b) => a.submitted < b.submitted ? -1 : 1);
    }));
  }

  public rejectRuns(runs: UiRun[], message: string, apiKey: string): Observable<string> {
    const requests: Observable<string>[] = [];

    const rejectionStatus = {status: {status: 'rejected', reason: message}};
    const headers = new HttpHeaders().set('X-API-Key', apiKey);
    for (let run of runs) {
      const url = `${this.baseUrl}/runs/${run.id}/status`;
      requests.push(this.httpClient.put<any>(url, rejectionStatus, {headers: headers}));
    }

    return forkJoin(requests).pipe(map(result => {
      return result.join(', ');
    }));
  }

  public acceptRuns(runs: UiRun[], apiKey: string): Observable<string> {
    const requests: Observable<string>[] = [];

    const acceptStatus = {status: {status: 'verified'}};
    const headers = new HttpHeaders().set('X-API-Key', apiKey).set('Content-Type', 'text/plain');
    for (let run of runs) {
      const url = `${this.baseUrl}/runs/${run.id}/status`
      requests.push(this.httpClient.put<any>(url, acceptStatus, {headers: headers}));
    }

    return forkJoin(requests).pipe(map(result => {
      return result.join(', ');
    }));
  }

  private getDistinctArray(arr: Run[]) {
    const dups: { [key: string]: boolean } = {};
    return arr.filter((el) => {
      let hash = el.id;
      let isDup: boolean | undefined = dups[hash];
      dups[hash] = true;
      return !isDup;
    });
  }

  /*
  public getVariables(): Observable<Category[]> {
    // https://www.speedrun.com/api/v1/games/y65797de/variables
    return this.httpClient.get<VariableResonse>(`${this.baseUrl}/games/${this.gameId}/variables`).pipe(map(v => v.data));
  }*/
}
