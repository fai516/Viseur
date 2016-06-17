var store = require("store");
var Classe = require("classe");
var Observable = require("core/observable");

/**
 * @class SettingManager - a singleton that manages settings. Get/set and storing in local storage.
 */
var SettingsManager = Classe(Observable, {
    /**
     * Get the setting at namepsace.key, both are basically the id so that multiple games (namespaces) can have the same settings key.
     *
     * @param {string} namespace - the namespace of the key
     * @param {string} key - the key in the namespace
     * @param {*} [def] - the default value, if there is not setting for namespace.key then it is set to def, and returned
     * @returns {*} whatever was stored at namespace.key
     */
    get: function(namespace, key, def) {
        var id = this._getID(namespace, key);

        if(!store.has(id)) {
            this.set(namespace, key, def);
            return def;
        }

        return store.get(id);
    },

    /**
     * Set the setting at namepsace.key, both are basically the id so that multiple games (namespaces) can have the same settings key.
     *
     * @param {string} namespace - the namespace of the key
     * @param {string} key - the key in the namespace
     * @param {*} value - the new value to store for namespace.key
     */
    set: function(namespace, key, value) {
        var id = this._getID(namespace, key);

        store.set(id, value);

        this._emit(id + ".changed".format(namespace, key), value);
    },

    /**
     * Creates a unqiue id for the namespace and key, basically joins them "namepsace.key"
     *
     * @private
     * @returns {string} a unique id as a combination of all passed in args
     */
    _getID: function(/* ... */) {
        return Array.prototype.join.call(arguments, ".");
    }
});

module.exports = new SettingsManager(); // singleton
