/**
 * Quick Browser Console Test
 * Run this in the browser console to identify issues
 */

(async function weatherRadarQuickTest() {
    console.log('🌦️ Starting Weather Radar Quick Test...');
    
    // Test 1: Check if OpenLayers is loaded
    console.log('📍 Test 1: OpenLayers availability');
    if (typeof ol !== 'undefined') {
        console.log('✅ OpenLayers is loaded');
        console.log('   Version info:', ol.VERSION || 'Unknown');
    } else {
        console.error('❌ OpenLayers is not loaded');
        return;
    }
    
    // Test 2: Test basic module import
    console.log('📦 Test 2: Module import test');
    try {
        const module = await import('./js/weather-radar-app.js');
        console.log('✅ Main module imported');
        console.log('   Exports:', Object.keys(module));
        
        if (module.WeatherRadarApp) {
            console.log('✅ WeatherRadarApp class found');
        } else if (module.default) {
            console.log('✅ Default export found');
        } else {
            console.error('❌ No WeatherRadarApp class or default export');
        }
    } catch (error) {
        console.error('❌ Module import failed:', error.message);
        console.error('   Stack:', error.stack);
        return;
    }
    
    // Test 3: Test individual modules
    console.log('🔧 Test 3: Individual module tests');
    const modules = [
        'layer-manager',
        'radar-controller',
        'weather-alerts',
        'timeline-controller',
        'ui-controller',
        'geolocation-service', 
        'settings-manager'
    ];
    
    for (const moduleName of modules) {
        try {
            const module = await import(`./js/modules/${moduleName}.js`);
            console.log(`✅ ${moduleName}: OK`);
        } catch (error) {
            console.error(`❌ ${moduleName}: ${error.message}`);
        }
    }
    
    // Test 4: Try basic app initialization
    console.log('🚀 Test 4: Basic app initialization');
    try {
        const { WeatherRadarApp } = await import('./js/weather-radar-app.js');
        const app = new WeatherRadarApp();
        console.log('✅ App instance created');
        
        // Try to initialize (this might fail, but we'll see where)
        console.log('🔄 Attempting initialization...');
        await app.init();
        console.log('✅ App initialized successfully!');
        
    } catch (error) {
        console.error('❌ App initialization failed:', error.message);
        console.error('   Full error:', error);
    }
    
    console.log('🏁 Quick test completed');
})();

// Also provide a simpler test function
window.testWeatherRadar = async function() {
    try {
        console.log('🔄 Testing weather radar...');
        const { WeatherRadarApp } = await import('./js/weather-radar-app.js');
        const app = new WeatherRadarApp();
        await app.init();
        console.log('✅ Success!');
        return app;
    } catch (error) {
        console.error('❌ Failed:', error);
        throw error;
    }
};

console.log('💡 Quick test loaded. You can also run: testWeatherRadar()');
