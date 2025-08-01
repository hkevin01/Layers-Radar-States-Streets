// Jest setup file
import { jest } from '@jest/globals';

// Mock OpenLayers for testing
global.OpenLayers = {
  Map: jest.fn().mockImplementation(() => ({
    getProjection: jest.fn(),
    addLayer: jest.fn(),
    addControl: jest.fn(),
    setCenter: jest.fn(),
    getZoom: jest.fn().mockReturnValue(4),
    zoomTo: jest.fn(),
    events: {
      register: jest.fn()
    },
    layers: []
  })),
  Layer: {
    TMS: jest.fn(),
    OSM: jest.fn(),
    Markers: jest.fn()
  },
  Projection: jest.fn(),
  LonLat: jest.fn().mockImplementation(() => ({
    transform: jest.fn().mockReturnThis()
  })),
  Control: {
    LayerSwitcher: jest.fn()
  }
};

// Mock jQuery
global.$ = {
  ajax: jest.fn()
};

// Mock DOM elements
Object.defineProperty(window, 'document', {
  value: {
    getElementById: jest.fn().mockReturnValue({
      style: { display: 'none' }
    }),
    createElement: jest.fn().mockReturnValue({
      id: '',
      style: { display: 'none' }
    }),
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn()
    },
    addEventListener: jest.fn()
  }
});
