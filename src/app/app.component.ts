import {SelectionModel} from '@angular/cdk/collections';
import {Component, OnInit, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {ActivatedRoute} from '@angular/router';
import * as FileSaver from 'file-saver';
import {switchMap} from 'rxjs';
import * as XLSX from 'xlsx';
import {ApiService} from './api.service';
import {EnvService} from './env.service';
import {MinuteSecondsPipe} from './minute-seconds.pipe';
import {Run} from './model/run';
import {VariableMap} from './model/variable';
import {VideoType} from './model/video-type';
import {HttpClient} from "@angular/common/http";

export interface UiRun {
  id: string;
  dup: string;
  category: string;
  subcategory: string;
  user: string;
  time: number;
  submitted: string;
  videoType: VideoType;
  videoLink: string;
  weblink: string;
}

interface ColorData {
  style: string;
  colorFrom: string;
  colorTo: string;
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
export class AppComponent implements OnInit {
  public loadingStateEnum = LoadingState;
  public loadingState = LoadingState.INITIAL;
  public runColumns = ['select', 'category', 'subcategory', 'user', 'time', 'submitted', 'videoType', 'videoLink', 'dup', 'weblink'];
  // @ts-ignore
  public dataSource: MatTableDataSource<UiRun>;
  public selection = new SelectionModel<UiRun>(true, []);

  public showModerationActions = false;
  public message = '';
  public apiKey = '';
  public maxBatchVerify = 50;
  public moderationStatus = '';
  public cooldownMs = 15_000;

  public maxPaginationOffset = 400;
  public isLocal = false;
  public gameDisplayId = '';
  public gameId = '';
  private variableMap: VariableMap = {};

  public filterValue = '';
  public categories: string[] = []
  public categoryFilter: string[] = [];
  public videoTypes: string[] = [
    VideoType.YOUTUBE, VideoType.GOOGLE_PHOTOS, VideoType.GOOGLE_DRIVE, VideoType.TIKTOK,
    VideoType.INSTAGRAM, VideoType.KWAI, VideoType.FACEBOOK, VideoType.TWITCH, VideoType.NO_LINK,
    VideoType.INVALID_LINK, VideoType.TEMPORARY_LINK, VideoType.OTHER,
  ];
  public videoTypeFilter: VideoType[] = [];

  @ViewChild(MatPaginator)
  public paginator: MatPaginator | undefined;

  @ViewChild(MatSort)
  public sort: MatSort | undefined;

  public constructor(
    private readonly apiService: ApiService,
    private readonly route: ActivatedRoute,
    private readonly minuteSecondsPipe: MinuteSecondsPipe,
    private readonly http: HttpClient,
  ) {
  }

  public ngOnInit(): void {
    this.isLocal = EnvService.isDevelopment();
    this.route.queryParams.subscribe(params => {
      this.gameDisplayId = params['gameId'];
      console.log('GameId from params:', this.gameDisplayId);
    });
    this.fetchVisitorCount();
  }

  private getVariables(values: { [key: string]: string }) {
    let text = '';
    for (let value in values) {
      if (text !== '') {
        text += ', ';
      }
      text += this.variableMap[values[value]] || '';
    }
    return text;
  }

  public loadRuns(): void {
    this.loadingState = LoadingState.LOADING;

    // Fetch game variables
    this.apiService.getVariables(this.gameDisplayId).subscribe(categories => {
      categories.forEach(category => {
        // Reading category values
        for (let value in category.values.values) {
          this.variableMap[value] = category.values.values[value].label;
        }
      });
      console.log('Saved variables:', this.variableMap);
    });

    // Fetch runs
    this.apiService.getGameId(this.gameDisplayId).pipe(
      switchMap(gameId => {
        this.gameId = gameId;
        console.log('Resolved', this.gameDisplayId, 'to', this.gameId);
        return this.apiService.getQueue(this.gameId, this.maxPaginationOffset);
      })
    ).subscribe(runs => {
      const alreadySeen: { [key: string]: boolean } = {};
      let uiRuns: UiRun[] = runs.map(r => {
          const videoLink = this.getVideoLink(r);
          const user = this.getPlayerName(r);
          const nameColor = this.getNameColor(r);

          // Check both user and video for duplicate detection
          const key = user + videoLink;
          const dup = alreadySeen[key];
          alreadySeen[key] = true;
          return {
            id: r.id,
            dup: dup ? 'duplicate' : '',
            game: r.game,
            category: r.category.data.name,
            subcategory: this.getVariables(r.values),
            user,
            nameColor,
            time: r.times.primary_t,
            submitted: r.submitted,
            videoLink,
            videoType: this.getVideoType(r),
            weblink: r.weblink
          };
        }
      );

      // Sort by submitted, but show runs of a user first
      const earliestUserSubmit: { [key: string]: string } = {};
      this.categories = [];
      uiRuns.forEach((run) => {
        // Collect categories
        if (this.categories.indexOf(run.category) === -1) {
          this.categories.push(run.category);
        }

        // Collect earliest user submit dates
        if (!earliestUserSubmit[run.user]) {
          earliestUserSubmit[run.user] = run.submitted;
        }
      });

      uiRuns = uiRuns.sort((a, b) =>
        earliestUserSubmit[a.user] + a.submitted < earliestUserSubmit[b.user] + b.submitted ? -1 : 1)

      console.log('Showing', uiRuns.length, 'runs:', uiRuns);

      this.dataSource = new MatTableDataSource(uiRuns);
      this.dataSource.filterPredicate = (run: UiRun, filter: string): boolean => this.filterPredicate(run, filter);

      // Adapted from https://github.com/angular/components/blob/main/src/material/table/table-data-source.ts
      this.dataSource._filterData = (data: UiRun[]) => {
        this.dataSource.filteredData = data.filter(obj => this.dataSource.filterPredicate(obj, this.dataSource.filter));
        if (this.dataSource.paginator) {
          this.dataSource._updatePaginator(this.dataSource.filteredData.length);
        }
        return this.dataSource.filteredData;
      };

      if (this.paginator && this.sort) {
        console.log('Setting paginator & sort!');
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      } else {
        console.log('paginator or source undefined :(');
      }
      this.loadingState = LoadingState.LOADED_COOLDOWN;
      setTimeout(() => this.loadingState = LoadingState.LOADED_FINISHED, this.cooldownMs);
    });
  }

  public getProgress(): number {
    return this.apiService.getProgress();
  }

  public applyFilter(): void {
    this.dataSource.filter = this.filterValue;
    // this.dataSource._updateChangeSubscription();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  public getVideoLink(run: Run): string {
    const links = run.videos?.links;
    if (links?.length > 0) {
      return links[0].uri;
    } else if (run.videos?.text) {
      return run.videos.text;
    } else {
      return '?';
    }
    return '?';
  }

  public getPlayerName(run: Run): string {
    const playerData = run.players.data;
    if (playerData.length > 0) {
      if (playerData[0].names) {
        return playerData[0].names.international;
      }
      // If runner is a guest without account, return name
      return playerData[0].name || '';
    }
    return '?';
  }

  public getNameColor(run: Run): ColorData {
    const colorData = {
      country: '',
      style: 'linear',
      colorFrom: '#000000',
      colorTo: '#000000'
    };
    const playerData = run.players.data;
    if (playerData.length > 0 && playerData[0]['name-style']) {
      const nameStyle = playerData[0]['name-style'];
      if (nameStyle.style === 'gradient') {
        colorData.colorFrom = nameStyle['color-from'].light;
        colorData.colorTo = nameStyle['color-to'].light;
      } else {
        colorData.colorFrom = nameStyle.color.light;
        colorData.colorTo = nameStyle.color.light;
      }
      colorData.country = playerData[0].location?.country?.code ?? '';
    }
    return colorData;
  }

  public getVideoType(run: Run): VideoType {
    const t = this.getVideoLink(run).toLowerCase();
    if (t.indexOf('http://') === -1 && t.indexOf('https://') === -1) {
      return VideoType.NO_LINK;
    } else if (t.indexOf('recorder.page.link') !== -1 || t.indexOf('speedrun.com') !== -1) {
      return VideoType.INVALID_LINK;
    } else if (t.indexOf('photos.app.goo.gl') !== -1) {
      return VideoType.GOOGLE_PHOTOS;
    } else if (t.indexOf('drive.google.com') !== -1) {
      return VideoType.GOOGLE_DRIVE;
    } else if (t.indexOf('youtu.be') !== -1 || t.indexOf('youtube.com') !== -1) {
      return VideoType.YOUTUBE;
    } else if (t.indexOf('icloud.com/') !== -1 || t.indexOf('samsungcloud.com/') !== -1 ||
      t.indexOf('s.amsu.ng/') !== -1) {
      return VideoType.TEMPORARY_LINK;
    } else if (t.indexOf('tiktok.com') !== -1) {
      return VideoType.TIKTOK;
    } else if (t.indexOf('instagram.com') !== -1) {
      return VideoType.INSTAGRAM;
    } else if (t.indexOf('facebook.com/') !== -1) {
      return VideoType.FACEBOOK;
    } else if (t.indexOf('twitch.tv/') !== -1) {
      return VideoType.TWITCH;
    } else if (t.indexOf('kwai-video.com') !== -1) {
      return VideoType.KWAI;
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
        error => this.moderationStatus = `Error - ${JSON.stringify(error)}`);
    this.selection.clear();
  }

  public getSortedFilteredRunsCurrentPage(): UiRun[] {
    const filteredData = this.dataSource.filteredData;
    const orderedData = this.dataSource._orderData(filteredData);
    const pageData = this.dataSource._pageData(orderedData);
    return pageData;
  }

  /** Whether the number of selected elements matches the total number of rows. */
  public isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.getSortedFilteredRunsCurrentPage().length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  public toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    const visibleRows = this.getSortedFilteredRunsCurrentPage();
    this.selection.select(...visibleRows);
  }

  private filterPredicate(run: UiRun, filter: string): boolean {
    if (this.categoryFilter.length > 0 && this.categoryFilter.indexOf(run.category) === -1 ||
      this.videoTypeFilter.length > 0 && this.videoTypeFilter.indexOf(run.videoType) === -1) {
      return false;
    }
    // Copied from original implementation
    const dataStr = Object.keys(run).reduce((currentTerm: string, key: string) => {
      return currentTerm + (run as { [key: string]: any })[key] + '◬';
    }, '').toLowerCase();
    // Transform the filter by converting it to lowercase and removing whitespace
    const transformedFilter = filter.trim().toLowerCase();
    return dataStr.indexOf(transformedFilter) !== -1;
  };

  /* -------- EXPORT --------- */

  private readonly CSV_DELIMITER = ';'
  private readonly EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';

  public runColWidths = [
    {wch: 10}, {wch: 15}, {wch: 20}, {wch: 10}, {wch: 20}, {wch: 10}, {wch: 60}, {wch: 10}, {wch: 60}
  ];

  public prepareRunsData(): string[][] {
    const attributes: string[] = [...this.runColumns].splice(1);
    const data: string[][] = [];
    data.push(attributes)
    for (let run of this.dataSource.data ?? []) {
      const values = attributes.map(attribute => {
        if (attribute === 'dup') {
          return run.dup === 'duplicate' ? 'D' : '';
        } else if (attribute === 'time') {
          return this.minuteSecondsPipe.transform(run.time);
        }
        const value = this.resolve(run, attribute);
        return value !== undefined ? value.toString() : '';
      }).map(v => this.replaceSpecialChars(v));
      data.push(values);
    }
    return data;
  }

  private replaceSpecialChars(value: string): string {
    value = (value == null ? '' : value.toString());
    return value.split(this.CSV_DELIMITER).join(',').split('\n').join(' | ');
  }

  public downloadRunsCSV(): void {
    const data = this.prepareRunsData();
    this.downloadCSV(data.map(row => row.join(this.CSV_DELIMITER) + '\n'))
  }

  public downloadRunsXSLX(): void {
    const data = this.prepareRunsData();
    this.downloadXLSX(data, this.runColWidths);
  }

  public downloadCSV(data: string[]): void {
    const blob = new Blob(data, {type: 'text/csv'});
    const fileName = this.gameDisplayId + '-runs.csv';
    FileSaver.saveAs(blob, fileName);
  }

  public downloadXLSX(json: string[][], colWidths: any[]): void {
    const fileName = this.gameDisplayId + '-runs.xlsx';

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json, {skipHeader: true});
    const workbook: XLSX.WorkBook = {Sheets: {'data': worksheet}, SheetNames: ['data']};

    // Set column width
    worksheet["!cols"] = colWidths;
    // Set autofilter
    worksheet['!autofilter'] = {ref: "A1:H1"};

    const excelBuffer: any = XLSX.write(workbook, {bookType: 'xlsx', type: 'array'});
    const data: Blob = new Blob([excelBuffer], {type: this.EXCEL_TYPE});
    FileSaver.saveAs(data, fileName);
  }

  private resolve(obj: any, ns: string): any {
    let undef;
    let nsa = ns.split('.');
    while (obj && nsa[0]) {
      obj = obj[nsa.shift()!] || undef;
    }
    return obj;
  }

  private fetchVisitorCount(): void {
    this.http.get('https://akleemans.pythonanywhere.com/api/visitors')
      .subscribe((visitorResponse) => console.log('Visitor count:', visitorResponse));
  }
}
