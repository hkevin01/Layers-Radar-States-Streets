import { describe, it, expect, beforeEach } from 'vitest';

describe('OpenLayers Weather Radar Core', () => {
  let mapContainer;

  beforeEach(() => {
    // Create a map container
    mapContainer = document.createElement('div');
    mapContainer.id = 'test-map';
    document.body.appendChild(mapContainer);
  });

  afterEach(() => {
    if (mapContainer) {
      document.body.removeChild(mapContainer);
    }
  });

  describe('basic functionality', () => {
    it('should have access to mocked OpenLayers', () => {
      expect(global.ol).toBeDefined();
      expect(global.ol.Map).toBeDefined();
      expect(global.ol.layer).toBeDefined();
      expect(global.ol.source).toBeDefined();
    });

    it('should create DOM elements', () => {
      const element = document.createElement('div');
      expect(element).toBeDefined();
      expect(element.style).toBeDefined();
    });

    it('should mock map creation', () => {
      const map = new ol.Map();
      expect(map).toBeDefined();
      expect(map.getView).toBeDefined();
      expect(map.getLayers).toBeDefined();
    });
  });
});
