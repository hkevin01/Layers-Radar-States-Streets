// Vitest setup file
import { vi } from 'vitest';

// Mock OpenLayers for testing
global.ol = {
  Map: vi.fn().mockImplementation(() => ({
    getView: vi.fn().mockReturnValue({
      getCenter: vi.fn().mockReturnValue([0, 0]),
      getZoom: vi.fn().mockReturnValue(4),
      getRotation: vi.fn().mockReturnValue(0),
      getProjection: vi.fn().mockReturnValue({
        getCode: vi.fn().mockReturnValue('EPSG:3857')
      })
    }),
    getLayers: vi.fn().mockReturnValue({
      getArray: vi.fn().mockReturnValue([])
    }),
    getSize: vi.fn().mockReturnValue([800, 600]),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    on: vi.fn(),
    un: vi.fn(),
    events: {},
    target: 'map'
  })),
  layer: {
    Tile: vi.fn().mockImplementation((options) => ({
      get: vi.fn((key) => {
        if (key === 'title') return options?.title || 'Mock Layer';
        if (key === 'tileCounter') return { loading: 0, loaded: 0, errors: 0 };
        return null;
      }),
      set: vi.fn(),
      getVisible: vi.fn().mockReturnValue(true),
      getOpacity: vi.fn().mockReturnValue(1),
      getSource: vi.fn().mockReturnValue({
        on: vi.fn(),
        un: vi.fn(),
        events: {}
      })
    })),
    Vector: vi.fn()
  },
  source: {
    OSM: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      un: vi.fn(),
      events: {}
    })),
    TileWMS: vi.fn(),
    Vector: vi.fn()
  },
  View: vi.fn().mockImplementation(() => ({
    getCenter: vi.fn().mockReturnValue([0, 0]),
    getZoom: vi.fn().mockReturnValue(4),
    getRotation: vi.fn().mockReturnValue(0),
    getProjection: vi.fn().mockReturnValue({
      getCode: vi.fn().mockReturnValue('EPSG:3857')
    })
  })),
  proj: {
    fromLonLat: vi.fn().mockImplementation((coords) => coords),
    toLonLat: vi.fn().mockImplementation((coords) => coords)
  }
};

// Mock DOM methods for testing
Object.defineProperty(global, 'document', {
  value: {
    getElementById: vi.fn().mockReturnValue({
      style: { display: 'none' }
    }),
    createElement: vi.fn().mockReturnValue({
      id: '',
      style: { display: 'none' },
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn().mockReturnValue(false)
      },
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      parentNode: null
    }),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn()
    },
    addEventListener: vi.fn()
  }
});
