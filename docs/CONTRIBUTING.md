# Contributing Guidelines

## Table of Contents

- [Welcome Contributors](#welcome-contributors)
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Community Guidelines](#community-guidelines)

---

## Welcome Contributors

Thank you for your interest in contributing to the Layers Radar States Streets project! We welcome contributions from developers of all skill levels. Whether you're fixing bugs, adding features, improving documentation, or helping with testing, your contributions make this project better for everyone.

### How You Can Contribute

- **🐛 Bug Reports**: Help us identify and fix issues
- **✨ Feature Requests**: Suggest new functionality
- **🔧 Code Contributions**: Fix bugs or implement features
- **📚 Documentation**: Improve guides, API docs, and examples
- **🧪 Testing**: Write tests or test new features
- **🌐 Accessibility**: Improve accessibility features
- **🎨 Design**: Enhance UI/UX and visual design
- **🔍 Code Review**: Review pull requests from other contributors

---

## Code of Conduct

### Our Pledge

We are committed to making participation in this project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Standards

#### Positive Behavior
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

#### Unacceptable Behavior
- The use of sexualized language or imagery and unwelcome sexual attention or advances
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

### Enforcement

Project maintainers are responsible for clarifying standards and are expected to take appropriate and fair corrective action in response to any instances of unacceptable behavior.

Report violations to [project maintainers](mailto:conduct@weather-radar.dev).

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 16+** and **npm 8+** installed
- **Git** for version control
- A **modern browser** for testing (Chrome 90+, Firefox 88+, Safari 14+)
- Basic knowledge of **JavaScript ES6+**, **HTML5**, and **CSS3**
- Familiarity with **OpenLayers** (helpful but not required)

### First Time Setup

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR-USERNAME/Layers-Radar-States-Streets.git
   cd Layers-Radar-States-Streets
   ```

2. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/hkevin01/Layers-Radar-States-Streets.git
   git remote -v
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Verify Setup**
   ```bash
   npm start
   # Open http://localhost:8080 to verify everything works
   ```

5. **Run Tests**
   ```bash
   npm test
   # Ensure all tests pass before making changes
   ```

### Development Environment

#### Recommended Tools

- **VS Code** with these extensions:
  - ESLint
  - Prettier
  - GitLens
  - Live Server
  - Thunder Client (for API testing)

#### Project Structure Understanding

```
src/
├── components/          # Modular UI components
│   ├── map-component.js # Core map functionality
│   ├── ui-controls.js   # Desktop UI controls
│   ├── mobile-touch-controls.js # Mobile interface
│   ├── pwa-helper.js    # PWA functionality
│   ├── data-visualization.js # Data visualization
│   ├── accessibility-helper.js # Accessibility features
│   └── performance-optimizer.js # Performance optimization
├── config/             # Configuration files
├── layers/             # Map layer definitions
├── utils/              # Utility functions
└── main.js             # Application entry point
```

---

## Development Workflow

### Branching Strategy

#### Branch Types
- **`main`** - Stable release branch
- **`feature/feature-name`** - New feature development
- **`bugfix/issue-number`** - Bug fixes
- **`hotfix/critical-fix`** - Critical production fixes
- **`docs/documentation-update`** - Documentation changes

#### Workflow Steps

1. **Sync with Upstream**
   ```bash
   git checkout main
   git pull upstream main
   git push origin main
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/weather-alerts
   # or
   git checkout -b bugfix/layer-visibility-issue
   ```

3. **Make Changes**
   ```bash
   # Edit files, make commits
   git add .
   git commit -m "feat: add weather alert notifications"
   ```

4. **Keep Branch Updated**
   ```bash
   # Periodically sync with main
   git checkout main
   git pull upstream main
   git checkout feature/weather-alerts
   git rebase main
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/weather-alerts
   # Create pull request on GitHub
   ```

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

#### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools

#### Examples
```bash
# Good commit messages
git commit -m "feat(ui): add dark mode toggle"
git commit -m "fix(map): resolve layer visibility issue #123"
git commit -m "docs: update API documentation for data visualization"
git commit -m "perf(rendering): optimize tile loading performance"

# Less ideal commit messages (avoid these)
git commit -m "updated files"
git commit -m "fixed bug"
git commit -m "changes"
```

---

## Coding Standards

### JavaScript Style Guide

#### ES6+ Features
```javascript
// Use const/let instead of var
const API_URL = 'https://api.weather.gov';
let currentLayer = null;

// Use arrow functions for callbacks
layers.map(layer => layer.name);

// Use template literals
const message = `Loading layer: ${layerName}`;

// Use destructuring
const { lat, lon } = coordinates;

// Use async/await
async function loadData() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to load data:', error);
  }
}
```

#### Code Organization
```javascript
// File structure within components
class ComponentName {
  constructor(dependencies) {
    // Initialize properties
    this.map = dependencies.map;
    this.container = dependencies.container;
    
    // Bind methods
    this.handleClick = this.handleClick.bind(this);
    
    // Initialize component
    this.initialize();
  }
  
  // Public methods first
  async initialize() {
    // Setup code
  }
  
  // Private methods last (prefixed with _)
  _setupEventListeners() {
    // Event listener setup
  }
  
  // Cleanup method
  destroy() {
    // Cleanup code
  }
}
```

#### Documentation Requirements
```javascript
/**
 * Adds a new layer to the map with specified configuration
 * @param {Object} layerConfig - Layer configuration object
 * @param {string} layerConfig.type - Type of layer (radar, states, streets)
 * @param {string} layerConfig.url - URL template for layer tiles
 * @param {number} [layerConfig.opacity=1] - Layer opacity (0-1)
 * @param {boolean} [layerConfig.visible=true] - Initial visibility
 * @returns {Promise<Layer>} Promise resolving to the created layer
 * @throws {ValidationError} When layer configuration is invalid
 * @example
 * const layer = await mapComponent.addLayer({
 *   type: 'radar',
 *   url: 'https://api.weather.gov/radar/{z}/{x}/{y}.png',
 *   opacity: 0.7
 * });
 */
async addLayer(layerConfig) {
  // Implementation
}
```

### CSS/SCSS Guidelines

#### Structure and Naming
```css
/* Use BEM methodology for class names */
.weather-map {
  /* Block styles */
}

.weather-map__controls {
  /* Element styles */
}

.weather-map__controls--collapsed {
  /* Modifier styles */
}

/* Use CSS custom properties for theming */
:root {
  --primary-color: #2563eb;
  --secondary-color: #64748b;
  --border-radius: 0.5rem;
  --spacing-unit: 1rem;
}

/* Mobile-first responsive design */
.controls-panel {
  /* Mobile styles first */
  padding: calc(var(--spacing-unit) * 0.5);
}

@media (min-width: 768px) {
  .controls-panel {
    /* Tablet and desktop styles */
    padding: var(--spacing-unit);
  }
}
```

#### Accessibility Requirements
```css
/* Ensure sufficient color contrast */
.button {
  background-color: #2563eb;
  color: #ffffff; /* Contrast ratio 4.5:1 minimum */
}

/* Provide focus indicators */
.button:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Support high contrast mode */
@media (prefers-contrast: high) {
  .button {
    border: 2px solid currentColor;
  }
}
```

### HTML Best Practices

#### Semantic Structure
```html
<!-- Use semantic HTML elements -->
<main role="main" id="map-container">
  <header class="app-header">
    <h1>Weather Radar Visualization</h1>
  </header>
  
  <nav class="layer-controls" aria-label="Map layer controls">
    <button type="button" aria-pressed="true">
      Radar Layer
    </button>
  </nav>
  
  <section class="map-display" aria-label="Interactive weather map">
    <div id="map" role="application" aria-label="Weather radar map">
      <!-- Map content -->
    </div>
  </section>
</main>
```

#### Accessibility Attributes
```html
<!-- Proper ARIA labels and roles -->
<button 
  type="button"
  aria-label="Toggle radar layer visibility"
  aria-pressed="true"
  aria-describedby="radar-layer-description"
>
  Radar Layer
</button>

<div id="radar-layer-description" class="sr-only">
  Shows real-time weather radar data with precipitation intensity
</div>

<!-- Form accessibility -->
<label for="opacity-slider">Layer Opacity</label>
<input 
  type="range" 
  id="opacity-slider"
  min="0" 
  max="100" 
  value="70"
  aria-valuetext="70 percent opacity"
>
```

---

## Testing Requirements

### Test Types

#### Unit Tests
```javascript
// Component unit test example
import { UIControls } from '../src/components/ui-controls.js';

describe('UIControls', () => {
  let uiControls;
  let mockMap;
  let container;
  
  beforeEach(() => {
    // Setup test environment
    container = document.createElement('div');
    mockMap = {
      on: jest.fn(),
      setLayerVisibility: jest.fn(),
      getZoom: jest.fn(() => 8)
    };
    
    uiControls = new UIControls(mockMap, container);
  });
  
  afterEach(() => {
    // Cleanup
    uiControls.destroy();
  });
  
  test('should initialize with correct default state', () => {
    expect(container.querySelector('.ui-controls')).toBeTruthy();
    expect(mockMap.on).toHaveBeenCalled();
  });
  
  test('should update zoom display when zoom changes', () => {
    uiControls.updateZoomLevel(10);
    const zoomDisplay = container.querySelector('.zoom-level');
    expect(zoomDisplay.textContent).toBe('10');
  });
});
```

#### Integration Tests
```javascript
// Integration test example
import { initializeApp } from '../src/main.js';

describe('Application Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="map"></div>';
  });
  
  test('should initialize all components successfully', async () => {
    const app = await initializeApp('map');
    
    expect(window.mapComponent).toBeDefined();
    expect(window.uiControls).toBeDefined();
    expect(window.accessibilityHelper).toBeDefined();
  });
  
  test('should handle layer toggle interactions', async () => {
    const app = await initializeApp('map');
    
    const toggleButton = document.querySelector('[data-layer="radar"]');
    toggleButton.click();
    
    // Verify layer visibility changed
    expect(app.getLayer('radar').getVisible()).toBe(false);
  });
});
```

#### Accessibility Tests
```javascript
// Accessibility test example
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  test('should have no accessibility violations', async () => {
    document.body.innerHTML = `
      <div id="map">
        <!-- App content -->
      </div>
    `;
    
    await initializeApp('map');
    
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
  
  test('should support keyboard navigation', () => {
    // Test keyboard interactions
    const button = document.querySelector('.layer-toggle');
    
    // Test Enter key
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    button.dispatchEvent(enterEvent);
    
    // Test Space key
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
    button.dispatchEvent(spaceEvent);
    
    // Verify interactions work
  });
});
```

### Test Coverage Requirements

- **Minimum Coverage**: 80% for all new code
- **Critical Paths**: 95% coverage for core functionality
- **Accessibility**: All interactive elements must have accessibility tests
- **Cross-browser**: Tests must pass in all supported browsers

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- ui-controls.test.js

# Run accessibility tests
npm run test:a11y
```

---

## Pull Request Process

### Before Submitting

#### Checklist
- [ ] Code follows the style guidelines
- [ ] Self-review of the code completed
- [ ] Comments added for hard-to-understand areas
- [ ] Tests written for new functionality
- [ ] All tests pass locally
- [ ] Documentation updated if needed
- [ ] Accessibility considerations addressed
- [ ] Performance impact assessed

#### Testing Your Changes
```bash
# Run full test suite
npm test

# Check code quality
npm run lint
npm run format

# Test in multiple browsers
# Test with screen reader (recommended: NVDA, JAWS, or VoiceOver)
# Test keyboard navigation
# Test mobile devices
```

### PR Template

When creating a pull request, use this template:

```markdown
## Description
Brief description of changes and why they were made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests that you ran to verify your changes.

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and quality checks
2. **Code Review**: At least one maintainer reviews the code
3. **Testing**: Reviewer tests the changes locally
4. **Accessibility Review**: Accessibility impact assessed
5. **Approval**: Changes approved and merged

#### Review Criteria

Reviewers will evaluate:
- **Code Quality**: Readability, maintainability, performance
- **Functionality**: Does it work as intended?
- **Testing**: Are tests comprehensive and passing?
- **Documentation**: Is documentation updated and clear?
- **Accessibility**: Are accessibility standards maintained?
- **Security**: Are there any security implications?

---

## Issue Reporting

### Bug Reports

#### Before Reporting
1. Search existing issues to avoid duplicates
2. Test with the latest version
3. Try to reproduce in multiple browsers
4. Check if it's a configuration issue

#### Bug Report Template
```markdown
**Bug Description**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
- OS: [e.g. Windows 10, macOS 11.6, Ubuntu 20.04]
- Browser: [e.g. Chrome 96, Firefox 94, Safari 15]
- Version: [e.g. 2.0.0]
- Device: [e.g. Desktop, Mobile, Tablet]

**Additional Context**
Add any other context about the problem here.
```

### Feature Requests

#### Feature Request Template
```markdown
**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.

**Implementation Considerations**
- Accessibility impact
- Performance considerations
- Browser compatibility
- Mobile responsiveness
```

---

## Community Guidelines

### Communication

#### Be Respectful
- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the community

#### Be Helpful
- Answer questions when you can
- Share knowledge and resources
- Help new contributors get started
- Provide constructive feedback

### Recognition

We recognize contributors in several ways:
- **Contributors.md**: All contributors listed
- **Release Notes**: Major contributions highlighted
- **Special Recognition**: Outstanding contributions featured
- **Maintainer Invitation**: Active contributors may be invited to join the maintainer team

### Getting Help

If you need help or have questions:

1. **Documentation**: Check the docs/ directory first
2. **Discussions**: Use GitHub Discussions for questions
3. **Issues**: Create an issue for bugs or feature requests
4. **Discord**: Join our Discord server for real-time chat
5. **Email**: Contact maintainers at contributors@weather-radar.dev

---

## Resources

### Learning Resources

- **JavaScript**: [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- **OpenLayers**: [OpenLayers Tutorials](https://openlayers.org/en/latest/doc/tutorials/)
- **Accessibility**: [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- **PWA**: [Progressive Web Apps Guide](https://web.dev/progressive-web-apps/)
- **Testing**: [Jest Documentation](https://jestjs.io/docs/getting-started)

### Tools

- **Git**: [Git Documentation](https://git-scm.com/doc)
- **VS Code**: [VS Code Documentation](https://code.visualstudio.com/docs)
- **Node.js**: [Node.js Documentation](https://nodejs.org/en/docs/)
- **npm**: [npm Documentation](https://docs.npmjs.com/)

---

Thank you for contributing to the Layers Radar States Streets project! Your contributions help make weather visualization more accessible and useful for everyone. 🌦️

*For questions about contributing, please reach out through our [GitHub Discussions](https://github.com/hkevin01/Layers-Radar-States-Streets/discussions) or create an issue.*
