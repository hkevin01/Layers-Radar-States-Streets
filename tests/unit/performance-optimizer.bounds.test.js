import { describe, expect, it } from 'vitest';
import { getVisibleBounds4326 } from '../../src/components/performance-optimizer.js';

function makeMap({ size = [1024, 768], extent = [-1, -1, 1, 1] } = {}) {
  return {
    getView: () => ({
      calculateExtent: () => extent,
      getZoom: () => 5,
    }),
    getSize: () => size,
  };
}

describe('getVisibleBounds4326', () => {
  it('returns transformed extent when ol.proj is available', () => {
    globalThis.ol = {
      proj: {
        transformExtent: (e, a, b) => [e[0] * 10, e[1] * 10, e[2] * 10, e[3] * 10],
      },
    };
    const map = makeMap({ extent: [-100, -50, 100, 50] });
    const b = getVisibleBounds4326(map);
    expect(b).toEqual([-1000, -500, 1000, 500]);
  });

  it('falls back to default when view/size missing', () => {
    const b1 = getVisibleBounds4326(null);
    expect(b1).toEqual([-180, -85, 180, 85]);
    const b2 = getVisibleBounds4326({ getView: () => null, getSize: () => [0, 0] });
    expect(b2).toEqual([-180, -85, 180, 85]);
  });

  it('falls back to default when transform throws', () => {
    globalThis.ol = { proj: { transformExtent: () => { throw new Error('boom'); } } };
    const map = makeMap();
    const b = getVisibleBounds4326(map);
    expect(b).toEqual([-180, -85, 180, 85]);
  });
});
