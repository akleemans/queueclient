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
      // Only return uniques
      return this.getDistinctArray(arr);
    }));
  }

  private getDistinctArray(arr: Run[]) {
    const dups = {};
    return arr.filter((el) => {
      let hash = el.id;
      // @ts-ignore
      let isDup = dups[hash];
      // @ts-ignore
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
