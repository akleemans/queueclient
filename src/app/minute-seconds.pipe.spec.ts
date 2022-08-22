import {MinuteSecondsPipe} from './minute-seconds.pipe';

describe('MinuteSecondsPipe', () => {
  it('should convert seconds', () => {
    const pipe = new MinuteSecondsPipe();
    expect(pipe.transform(76.123)).toEqual('1:16.123');
  });

  it('should pad zeroes', () => {
    const pipe = new MinuteSecondsPipe();
    expect(pipe.transform(0.0)).toEqual('0:00.000');
  });
});
