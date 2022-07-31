import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {forkJoin, map, Observable} from 'rxjs';
import {Run, RunResponse} from './model/run';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private gameId = 'y65797de';
  private baseUrl = `https://www.speedrun.com/api/v1`;
  private maxRuns = 5000;

  public constructor(
    private readonly httpClient: HttpClient
  ) {
  }

  public getQueue(): Observable<Run[]> {
    const urls: Observable<Run[]>[] = [];
    for (let i = 0; i < this.maxRuns; i += 200) {
      const url = `${this.baseUrl}/runs?game=${this.gameId}&status=new&embed=category,level,players&orderby=submitted&direction=desc&max=200&offset=${i}`
      urls.push(this.httpClient.get<RunResponse>(url).pipe(map(r => r.data)))
    }
    return forkJoin(urls).pipe(map(result => {
      const arr: Run[] = [];
      result.forEach(r => arr.push(...r))
      return arr;
    }));
  }

  /*
  public getVariables(): Observable<Category[]> {
    // https://www.speedrun.com/api/v1/games/y65797de/variables
    return this.httpClient.get<VariableResonse>(`${this.baseUrl}/games/${this.gameId}/variables`).pipe(map(v => v.data));
  }*/
}
