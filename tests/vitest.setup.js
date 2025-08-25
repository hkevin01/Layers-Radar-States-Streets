import { vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:8082',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;

// Mock OpenLayers
global.ol = {
  Map: vi.fn(() => ({
    getView: vi.fn(() => ({
      getZoom: vi.fn(() => 10),
      getCenter: vi.fn(() => [0, 0]),
      calculateExtent: vi.fn(() => [-180, -90, 180, 90]),
      setZoom: vi.fn(),
      setCenter: vi.fn(),
      animate: vi.fn()
    })),
    getLayers: vi.fn(() => ({
      getArray: vi.fn(() => [])
    })),
    getSize: vi.fn(() => [800, 600]),
    on: vi.fn(),
    un: vi.fn(),
    render: vi.fn(),
    updateSize: vi.fn()
  })),
  View: vi.fn(() => ({
    getZoom: vi.fn(() => 10),
    getCenter: vi.fn(() => [0, 0]),
    calculateExtent: vi.fn(() => [-180, -90, 180, 90]),
    setZoom: vi.fn(),
    setCenter: vi.fn(),
    animate: vi.fn()
  })),
  layer: {
    Tile: vi.fn(() => ({
      getSource: vi.fn(),
      setSource: vi.fn(),
      on: vi.fn(),
      un: vi.fn()
    })),
    Vector: vi.fn(() => ({
      getSource: vi.fn(),
      setSource: vi.fn(),
      on: vi.fn(),
      un: vi.fn()
    }))
  },
  source: {
    OSM: vi.fn(() => ({
      on: vi.fn(),
      un: vi.fn(),
      getState: vi.fn(() => 'ready')
    })),
    XYZ: vi.fn(() => ({
      on: vi.fn(),
      un: vi.fn(),
      getState: vi.fn(() => 'ready')
    }))
  },
  proj: {
    fromLonLat: vi.fn((coord) => coord),
    toLonLat: vi.fn((coord) => coord),
    transformExtent: vi.fn((extent) => extent),
    get: vi.fn(() => ({
      getCode: vi.fn(() => 'EPSG:3857'),
      getExtent: vi.fn(() => [-20037508.34, -20037508.34, 20037508.34, 20037508.34])
    }))
  },
  extent: {
    getCenter: vi.fn((extent) => [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2]),
    buffer: vi.fn((extent) => extent),
    intersects: vi.fn(() => true)
  }
};

// Mock fetch for API calls
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('')
  })
);

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: console.error // Keep errors visible
};

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn()
};

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Setup test environment helpers
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
  
  // Reset DOM
  document.body.innerHTML = '';
  
  // Create a test container
  const testContainer = document.createElement('div');
  testContainer.id = 'test-container';
  document.body.appendChild(testContainer);
});

afterEach(() => {
  // Cleanup after each test
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});
