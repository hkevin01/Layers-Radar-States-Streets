/**
 * Legacy Test suite for map functionality (OpenLayers v2-based)
 * Quarantined from main unit test run.
 */

import { MapComponent } from '../../src/components/map-component.js';

describe('MapComponent (legacy)', () => {
  let mapComponent;

  beforeEach(() => {
    const container = document.createElement('div');
    container.id = 'test-map';
    document.body.appendChild(container);

    mapComponent = new MapComponent('test-map');
  });

  afterEach(() => {
    const container = document.getElementById('test-map');
    if (container) {
      document.body.removeChild(container);
    }
  });

  it('should create a map component instance', () => {
    expect(mapComponent).toBeDefined();
    expect(mapComponent.containerId).toBe('test-map');
  });
});
