import caseStudies from './index';

describe('case study registry', () => {
  test('keys match study slugs', () => {
    Object.entries(caseStudies).forEach(([key, study]) => {
      expect(study.slug).toBe(key);
    });
  });

  test('each case study has at least one transformation block', () => {
    Object.values(caseStudies).forEach((study) => {
      expect(Array.isArray(study.transformations)).toBe(true);
      expect(study.transformations.length).toBeGreaterThan(0);
    });
  });
});
