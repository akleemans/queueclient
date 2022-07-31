import {Component, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {ApiService} from './api.service';
import {Run} from './model/run';
import {VideoType} from './model/video-type';

interface UiRun {
  category: string;
  user: string;
  time: number;
  submitted: string;
  videoType: string;
  videoLink: string;
  weblink: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public runsLoading = false;
  public runsLoaded = false;
  public runColumns = ['category', 'user', 'time', 'submitted', 'videoType', 'videoLink', 'weblink'];
  // @ts-ignore
  public dataSource: MatTableDataSource<UiRun>;

  @ViewChild(MatPaginator)
  public paginator: MatPaginator | undefined;

  @ViewChild(MatSort)
  public sort: MatSort | undefined;

  public constructor(
    private readonly apiService: ApiService
  ) {

  }

  public loadRuns() {
    this.runsLoading = true;
    this.apiService.getQueue().subscribe(runs => {
      const uiRuns: UiRun[] = runs.map(r => ({
          category: r.category.data.name,
          user: this.getPlayerName(r),
          time: r.times.primary_t,
          submitted: r.submitted,
          videoLink: this.getVideoLink(r),
          videoType: this.getVideoType(r),
          weblink: r.weblink
        })
      )
      this.dataSource = new MatTableDataSource(uiRuns);
      if (this.paginator && this.sort) {
        console.log('Setting paginator & sort!');
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      } else {
        console.log('paginator or source undefined :(');
      }
      this.runsLoading = false;
      this.runsLoaded = true
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
    }
    return VideoType.OTHER
  }
}
