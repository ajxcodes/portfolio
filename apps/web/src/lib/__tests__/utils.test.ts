import { calculateTenure, calculateTotalExperience } from '../utils';
import { Experience, PreviousExperience } from '../data';

describe('utils library helper functions', () => {
  describe('calculateTenure', () => {
    it('returns null for empty or invalid period structures', () => {
      expect(calculateTenure('')).toBeNull();
      expect(calculateTenure('Jan 2022')).toBeNull(); // Missing separator
      expect(calculateTenure('Jan 2022 - InvalidMonth')).toBeNull(); // Invalid date parse
      expect(calculateTenure('Jan 2022 - Dec 2021')).toBeNull(); // Negative duration
    });

    it('calculates short month differences correctly', () => {
      // Inclusive difference: Jan 2022 - Jan 2022 is 1 month
      expect(calculateTenure('Jan 2022 - Jan 2022')).toBe('1 mo');
      expect(calculateTenure('Jan 2022 - Feb 2022')).toBe('2 mos');
    });

    it('calculates years and remaining months correctly', () => {
      // Jan 2022 - Dec 2022 is 12 months -> 1 yr
      expect(calculateTenure('Jan 2022 - Dec 2022')).toBe('1 yr');
      
      // Jan 2022 - Jan 2023 is 13 months -> 1 yr 1 mo
      expect(calculateTenure('Jan 2022 - Jan 2023')).toBe('1 yr 1 mo');
      
      // Jan 2020 - Dec 2021 is 24 months -> 2 yrs
      expect(calculateTenure('Jan 2020 - Dec 2021')).toBe('2 yrs');
    });

    it('handles Present dynamically as current date', () => {
      const now = new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonthStr = months[now.getMonth()];
      const currentYear = now.getFullYear();

      // Tenure of current month/year to Present should yield 1 mo
      const period = `${currentMonthStr} ${currentYear} - Present`;
      expect(calculateTenure(period)).toBe('1 mo');
    });
  });

  describe('calculateTotalExperience', () => {
    const mockExp: Experience[] = [
      { company: 'Company A', role: 'Dev', period: 'Jan 2020 - Dec 2020', results: [] },
      { company: 'Company B', role: 'Dev 2', period: 'Jan 2021 - Dec 2021', results: [] }
    ];

    const mockPrevExp: PreviousExperience[] = [
      { company: 'Company C', role: 'Junior Dev', location: 'Remote', period: 'Jan 2019 - Dec 2019' }
    ];

    it('returns null when total experience compiles to 0 years or input arrays are empty', () => {
      expect(calculateTotalExperience([], [])).toBeNull();
      // Jan 2020 - Feb 2020 is only 2 months (less than 1 year)
      const shortExp = [{ company: 'A', role: 'Dev', period: 'Jan 2020 - Feb 2020', results: [] }];
      expect(calculateTotalExperience(shortExp, [])).toBeNull();
    });

    it('accumulates total years correctly', () => {
      // 2 years + 1 year = 3 years total
      expect(calculateTotalExperience(mockExp, mockPrevExp)).toBe('3+ years');
    });

    it('handles missing/fallback arrays gracefully', () => {
      // 2 years from mockExp
      expect(calculateTotalExperience(mockExp, null as any)).toBe('2+ years');
    });

    it('handles null arrays and invalid periods in accumulation', () => {
      // both experience and previousExperience are null
      expect(calculateTotalExperience(null as any, null as any)).toBeNull();

      // experience has invalid period, previousExperience is null
      const invalidExp = [{ company: 'A', role: 'Dev', period: 'invalid', results: [] }];
      expect(calculateTotalExperience(invalidExp, null as any)).toBeNull();

      // experience is null, previousExperience has valid period
      expect(calculateTotalExperience(null as any, mockPrevExp)).toBe('1+ years');
    });
  });
});
