import { parsePeriod, formatPeriod, calculateDuration } from '../resumePeriodUtils';

describe('resumePeriodUtils', () => {
  describe('parsePeriod', () => {
    it('returns empty result for empty inputs', () => {
      expect(parsePeriod('')).toEqual({
        startMonth: '',
        startYear: '',
        isCurrent: false,
        endMonth: '',
        endYear: ''
      });
    });

    it('parses simple year period', () => {
      expect(parsePeriod('2018 - 2020')).toEqual({
        startMonth: '',
        startYear: '2018',
        isCurrent: false,
        endMonth: '',
        endYear: '2020'
      });
    });

    it('parses full month/year range', () => {
      expect(parsePeriod('January 2018 - December 2020')).toEqual({
        startMonth: 'Jan',
        startYear: '2018',
        isCurrent: false,
        endMonth: 'Dec',
        endYear: '2020'
      });
    });

    it('parses present/current ranges', () => {
      expect(parsePeriod('Feb 2018 - Present')).toEqual({
        startMonth: 'Feb',
        startYear: '2018',
        isCurrent: true,
        endMonth: '',
        endYear: ''
      });

      expect(parsePeriod('Feb 2018 - Current')).toEqual({
        startMonth: 'Feb',
        startYear: '2018',
        isCurrent: true,
        endMonth: '',
        endYear: ''
      });
    });

    it('handles single token boundaries', () => {
      expect(parsePeriod('2018')).toEqual({
        startMonth: '',
        startYear: '2018',
        isCurrent: true,
        endMonth: '',
        endYear: ''
      });

      expect(parsePeriod('Jan')).toEqual({
        startMonth: 'Jan',
        startYear: '',
        isCurrent: true,
        endMonth: '',
        endYear: ''
      });
    });

    it('handles single end tokens', () => {
      expect(parsePeriod('2018 - 2020')).toEqual({
        startMonth: '',
        startYear: '2018',
        isCurrent: false,
        endMonth: '',
        endYear: '2020'
      });

      expect(parsePeriod('2018 - Jan')).toEqual({
        startMonth: '',
        startYear: '2018',
        isCurrent: false,
        endMonth: 'Jan',
        endYear: ''
      });
    });

    it('normalizes shorthand or invalid months', () => {
      // Normal shorthand
      expect(parsePeriod('Jan 2018 - Feb 2020')).toEqual({
        startMonth: 'Jan',
        startYear: '2018',
        isCurrent: false,
        endMonth: 'Feb',
        endYear: '2020'
      });

      // Invalid month returns the value itself
      expect(parsePeriod('XYZ 2018 - ABC 2020')).toEqual({
        startMonth: 'XYZ',
        startYear: '2018',
        isCurrent: false,
        endMonth: 'ABC',
        endYear: '2020'
      });
    });
  });

  describe('formatPeriod', () => {
    it('formats normal ranges correctly', () => {
      expect(formatPeriod('Jan', '2018', false, 'Dec', '2020')).toBe('Jan 2018 - Dec 2020');
    });

    it('formats present/current ranges correctly', () => {
      expect(formatPeriod('Jan', '2018', true, '', '')).toBe('Jan 2018 - Present');
    });
  });

  describe('calculateDuration', () => {
    it('returns empty string if no start year', () => {
      expect(calculateDuration('Jan', '', false, 'Dec', '2020')).toBe('');
    });

    it('returns empty string if no end year and not current', () => {
      expect(calculateDuration('Jan', '2018', false, 'Dec', '')).toBe('');
    });

    it('calculates duration correctly for months and years', () => {
      expect(calculateDuration('Jan', '2018', false, 'Dec', '2019')).toBe('2 yrs');
      expect(calculateDuration('Jan', '2018', false, 'Jan', '2018')).toBe('1 mo');
      expect(calculateDuration('Jan', '2018', false, 'Feb', '2018')).toBe('2 mos');
      expect(calculateDuration('Jan', '2018', false, 'Feb', '2019')).toBe('1 yr 2 mos');
    });

    it('handles current dates', () => {
      const now = new Date();
      const currentYearStr = String(now.getFullYear());
      expect(calculateDuration('Jan', currentYearStr, true, '', '')).toContain('mo');
    });

    it('returns empty string for negative durations', () => {
      expect(calculateDuration('Dec', '2020', false, 'Jan', '2018')).toBe('');
    });

    it('handles durations of less than one month', () => {
      // February to January of same year yields 0 months
      expect(calculateDuration('Feb', '2020', false, 'Jan', '2020')).toBe('< 1 mo');
    });
  });
});
