import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EnvService {
  private static restUrl: string = '';

  public static initialize(): void {
    const dev = EnvService.isDevelopment();
    console.log('Running in development mode:', dev);
    this.restUrl = 'https://www.speedrun.com/api/v1';
    if (dev) {
      this.restUrl = location.origin + '/api/v1';
    }
  }

  public static getRestUrl(): string {
    return this.restUrl;
  }

  private static isDevelopment = (): boolean => location.host.includes('localhost');
}

EnvService.initialize();
