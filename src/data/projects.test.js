import projects from './projects';

describe('projects data', () => {
  test('uses unique slugs', () => {
    const slugs = projects.map((project) => project.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test('published projects include an image path', () => {
    const published = projects.filter((project) => project.available);
    published.forEach((project) => {
      expect(typeof project.image).toBe('string');
      expect(project.image.length).toBeGreaterThan(0);
    });
  });
});
