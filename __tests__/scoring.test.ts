import { calculateTotalScore, isValidSliderValue, isValidSelfService, getSelfServiceLabel } from '../src/logic/scoring';
import { Rating } from '../src/types';

describe('Scoring Logic', () => {
  describe('calculateTotalScore', () => {
    test('minimum score: only self-service -20', () => {
      const rating: Partial<Rating> = { self_service: -20 };
      expect(calculateTotalScore(rating)).toBe(-20);
    });

    test('maximum score: all maxed + eggnog', () => {
      const rating: Partial<Rating> = {
        self_service: 0,
        service: 5,
        ski_haserl: 5,
        food: 5,
        sun_terrace: 5,
        interior: 5,
        apres_ski: 5,
        eggnog: true,
      };
      expect(calculateTotalScore(rating)).toBe(35);
    });

    test('partial rating with eggnog', () => {
      const rating: Partial<Rating> = {
        self_service: -10,
        service: 4.5,
        food: 5,
        apres_ski: 3,
        eggnog: true,
      };
      // -10 + 4.5 + 5 + 3 + 5 = 7.5
      expect(calculateTotalScore(rating)).toBe(7.5);
    });

    test('eggnog adds exactly 5 points', () => {
      const base: Partial<Rating> = {
        self_service: 0,
        service: 3,
        eggnog: false,
      };
      const withEggnog: Partial<Rating> = { ...base, eggnog: true };

      const scoreDifference = calculateTotalScore(withEggnog) - calculateTotalScore(base);
      expect(scoreDifference).toBe(5);
    });

    test('zero score: self-service 0, no other ratings', () => {
      const rating: Partial<Rating> = {
        self_service: 0,
      };
      expect(calculateTotalScore(rating)).toBe(0);
    });

    test('handles undefined/null values as 0', () => {
      const rating: Partial<Rating> = {
        self_service: -10,
        service: undefined,
        ski_haserl: 0,
        food: 3,
      };
      // -10 + 0 + 0 + 3 = -7
      expect(calculateTotalScore(rating)).toBe(-7);
    });

    test('complex scenario with mixed values', () => {
      const rating: Partial<Rating> = {
        self_service: -20,
        service: 4.5,
        ski_haserl: 3,
        food: 5,
        sun_terrace: 2.5,
        interior: 4,
        apres_ski: 5,
        eggnog: false,
      };
      // -20 + 4.5 + 3 + 5 + 2.5 + 4 + 5 + 0 = 4
      expect(calculateTotalScore(rating)).toBe(4);
    });
  });

  describe('isValidSliderValue', () => {
    test('valid values: 0, 0.5, 1, ..., 5', () => {
      expect(isValidSliderValue(0)).toBe(true);
      expect(isValidSliderValue(0.5)).toBe(true);
      expect(isValidSliderValue(1)).toBe(true);
      expect(isValidSliderValue(1.5)).toBe(true);
      expect(isValidSliderValue(2)).toBe(true);
      expect(isValidSliderValue(2.5)).toBe(true);
      expect(isValidSliderValue(3)).toBe(true);
      expect(isValidSliderValue(3.5)).toBe(true);
      expect(isValidSliderValue(4)).toBe(true);
      expect(isValidSliderValue(4.5)).toBe(true);
      expect(isValidSliderValue(5)).toBe(true);
    });

    test('invalid values: out of range', () => {
      expect(isValidSliderValue(-1)).toBe(false);
      expect(isValidSliderValue(-0.5)).toBe(false);
      expect(isValidSliderValue(5.5)).toBe(false);
      expect(isValidSliderValue(6)).toBe(false);
      expect(isValidSliderValue(10)).toBe(false);
    });

    test('invalid values: wrong steps', () => {
      expect(isValidSliderValue(0.1)).toBe(false);
      expect(isValidSliderValue(0.3)).toBe(false);
      expect(isValidSliderValue(0.7)).toBe(false);
      expect(isValidSliderValue(1.2)).toBe(false);
      expect(isValidSliderValue(2.3)).toBe(false);
      expect(isValidSliderValue(3.7)).toBe(false);
      expect(isValidSliderValue(4.9)).toBe(false);
    });
  });

  describe('isValidSelfService', () => {
    test('valid self-service values', () => {
      expect(isValidSelfService(-20)).toBe(true);
      expect(isValidSelfService(-10)).toBe(true);
      expect(isValidSelfService(0)).toBe(true);
    });

    test('invalid self-service values', () => {
      expect(isValidSelfService(-30)).toBe(false);
      expect(isValidSelfService(-15)).toBe(false);
      expect(isValidSelfService(-5)).toBe(false);
      expect(isValidSelfService(5)).toBe(false);
      expect(isValidSelfService(10)).toBe(false);
    });
  });

  describe('getSelfServiceLabel', () => {
    test('returns correct German labels', () => {
      expect(getSelfServiceLabel(-20)).toBe('Nur Selbstbedienung');
      expect(getSelfServiceLabel(-10)).toBe('Teilweise Selbstbedienung');
      expect(getSelfServiceLabel(0)).toBe('Bedienung vorhanden');
    });
  });
});
