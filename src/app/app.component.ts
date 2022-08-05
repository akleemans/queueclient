import {SelectionModel} from '@angular/cdk/collections';
import {Component, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {ApiService} from './api.service';
import {Run} from './model/run';
import {VideoType} from './model/video-type';

export interface UiRun {
  id: string;
  dup: string;
  category: string;
  user: string;
  time: number;
  submitted: string;
  videoType: string;
  videoLink: string;
  weblink: string;
}

enum LoadingState {
  INITIAL,
  LOADING,
  LOADED_COOLDOWN,
  LOADED_FINISHED
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public loadingStateEnum = LoadingState;
  public loadingState = LoadingState.INITIAL;
  public runColumns = ['select', 'category', 'user', 'time', 'submitted', 'videoType', 'videoLink', 'dup', 'weblink'];
  // @ts-ignore
  public dataSource: MatTableDataSource<UiRun>;
  public selection = new SelectionModel<UiRun>(true, []);

  public showModerationActions = false;
  public message = '';
  public apiKey = '';
  public maxBatchVerify = 50;
  public moderationStatus = '';

  @ViewChild(MatPaginator)
  public paginator: MatPaginator | undefined;

  @ViewChild(MatSort)
  public sort: MatSort | undefined;

  public constructor(
    private readonly apiService: ApiService
  ) {
  }

  public loadRuns() {
    this.loadingState = LoadingState.LOADING;
    this.apiService.getQueue().subscribe(runs => {
      /*
        private getDistinctArray(arr: Run[]) {
    const dups: {[key: string]: boolean} = {};
    return arr.filter((el) => {
      let hash = el.id;
      let isDup: boolean | undefined = dups[hash];
      el.dup = isDup ? 'duplicate' : '';
      dups[hash] = true;
      return !isDup;
    });
  }
       */
      const alreadySeen: {[key: string]: boolean} = {};
      const uiRuns: UiRun[] = runs.map(r => {
        const videoLink = this.getVideoLink(r);
        const dup = alreadySeen[videoLink];
        alreadySeen[videoLink] = true;
        return {
            id: r.id,
            dup: dup ? 'duplicate' : '',
            category: r.category.data.name,
            user: this.getPlayerName(r),
            time: r.times.primary_t,
            submitted: r.submitted,
            videoLink,
            videoType: this.getVideoType(r),
            weblink: r.weblink
          };
        }
      );
      console.log('All runs:', uiRuns);
      this.dataSource = new MatTableDataSource(uiRuns);
      if (this.paginator && this.sort) {
        console.log('Setting paginator & sort!');
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      } else {
        console.log('paginator or source undefined :(');
      }
      this.loadingState = LoadingState.LOADED_COOLDOWN;
      setTimeout(() => this.loadingState = LoadingState.LOADED_FINISHED, 60_000);
    });
  }


  public applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  public getVideoLink(run: Run): string {
    const links = run.videos?.links;
    if (links?.length > 0) {
      return links[0].uri;
    } else if (run.videos.text) {
      return run.videos.text;
    }
    return '?';
  }

  public getPlayerName(run: Run): string {
    const playerData = run.players.data;
    if (playerData.length > 0) {
      return playerData[0].names.international;
    }
    return '?';
  }

  public getVideoType(run: Run): VideoType {
    const t = this.getVideoLink(run).toLowerCase();
    if (t.indexOf('http://') === -1 && t.indexOf('https://') === -1) {
      return VideoType.NO_LINK;
    } else if (t.indexOf('photos.app.goo.gl') !== -1) {
      return VideoType.GOOGLE_PHOTOS;
    } else if (t.indexOf('youtu.be') !== -1 || t.indexOf('youtube.com') !== -1) {
      return VideoType.YOUTUBE;
    } else if (t.indexOf('icloud.com') !== -1) {
      return VideoType.ICLOUD;
    } else if (t.indexOf('tiktok.com') !== -1) {
      return VideoType.TIKTOK;
    } else if (t.indexOf('instagram.com') !== -1) {
      return VideoType.INSTAGRAM;
    } else if (t.indexOf('kwai-video.com') !== -1) {
      return VideoType.KWAI;
    } else if (t.indexOf('samsungcloud.com') !== -1) {
      return VideoType.SAMSUNG_CLOUD;
    }
    return VideoType.OTHER
  }

  public acceptRuns(): void {
    const runs = this.selection.selected;

    if (runs.length > this.maxBatchVerify) {
      alert(`Can only verify ${this.maxBatchVerify} runs at once!`);
      return;
    }

    this.apiService.acceptRuns(runs, this.apiKey)
    .subscribe(result => this.moderationStatus = 'Successfully accepted runs!',
      error => this.moderationStatus = `Error - ${error}`);

    this.selection.clear();
  }

  public rejectRuns(): void {
    const runs = this.selection.selected;

    if (runs.length > this.maxBatchVerify) {
      alert(`Can only verify ${this.maxBatchVerify} runs at once!`);
      return;
    }

    this.moderationStatus = 'Loading...';
    this.apiService.rejectRuns(runs, this.message, this.apiKey)
    .subscribe(result => this.moderationStatus = 'Successfully rejected runs!',
      error => this.moderationStatus = `Error - ${error}`);
    this.selection.clear();
  }

  /** Whether the number of selected elements matches the total number of rows. */
  public isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource._pageData(this.dataSource.filteredData).length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  public toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    const visibleRows = this.dataSource._pageData(this.dataSource.filteredData)
    this.selection.select(...visibleRows);
  }
}
