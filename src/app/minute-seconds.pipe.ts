import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'minuteSeconds'
})
export class MinuteSecondsPipe implements PipeTransform {
  public transform(value: number): string {
    const minutes: number = Math.floor(value / 60);
    const seconds: number = Math.floor(value - minutes * 60);
    const ms: number = Math.round((value - minutes * 60 - seconds) * 1000);
    return minutes.toString() + ':' + seconds.toString().padStart(2, '0') + '.' +
      ms.toString().padStart(3, '0');
  }
}
