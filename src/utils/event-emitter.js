/**
 * Event Emitter Class
 * Custom event handling system for weather radar components
 */
export class EventEmitter {
    constructor() {
        this._events = new Map();
        this._onceEvents = new Map();
    }

    /**
     * Add an event listener
     * @param {string} event Event name
     * @param {Function} callback Callback function
     * @param {Object} options Event options
     */
    on(event, callback, options = {}) {
        if (!this._events.has(event)) {
            this._events.set(event, new Set());
        }
        this._events.get(event).add({ callback, options });
    }

    /**
     * Add a one-time event listener
     * @param {string} event Event name
     * @param {Function} callback Callback function
     * @param {Object} options Event options
     */
    once(event, callback, options = {}) {
        if (!this._onceEvents.has(event)) {
            this._onceEvents.set(event, new Set());
        }
        this._onceEvents.get(event).add({ callback, options });
    }

    /**
     * Remove an event listener
     * @param {string} event Event name
     * @param {Function} callback Callback function
     */
    off(event, callback) {
        const listeners = this._events.get(event);
        if (listeners) {
            for (const listener of listeners) {
                if (listener.callback === callback) {
                    listeners.delete(listener);
                }
            }
        }

        const onceListeners = this._onceEvents.get(event);
        if (onceListeners) {
            for (const listener of onceListeners) {
                if (listener.callback === callback) {
                    onceListeners.delete(listener);
                }
            }
        }
    }

    /**
     * Emit an event
     * @param {string} event Event name
     * @param {*} data Event data
     */
    emit(event, data) {
        // Regular event listeners
        const listeners = this._events.get(event);
        if (listeners) {
            for (const { callback, options } of listeners) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                    if (options.throwError) {
                        throw error;
                    }
                }
            }
        }

        // One-time event listeners
        const onceListeners = this._onceEvents.get(event);
        if (onceListeners) {
            for (const { callback, options } of onceListeners) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in once event listener for ${event}:`, error);
                    if (options.throwError) {
                        throw error;
                    }
                }
            }
            this._onceEvents.delete(event);
        }
    }

    /**
     * Check if an event has listeners
     * @param {string} event Event name
     * @returns {boolean}
     */
    hasListeners(event) {
        return (
            (this._events.has(event) && this._events.get(event).size > 0) ||
            (this._onceEvents.has(event) && this._onceEvents.get(event).size > 0)
        );
    }

    /**
     * Remove all event listeners
     * @param {string} [event] Optional event name to clear specific event
     */
    clearListeners(event) {
        if (event) {
            this._events.delete(event);
            this._onceEvents.delete(event);
        } else {
            this._events.clear();
            this._onceEvents.clear();
        }
    }
}
