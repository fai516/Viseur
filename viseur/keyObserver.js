var Classe = require("classe");
var Observable = require("core/observable");
var keycodes = require("core/keycodes");

/**
 * @class KeyObserver - An Observer that listens for keyboard presses
 */
var KeyObserver = Classe(Observable, {
    init: function() {
        Observable.init.call(this);

        var self = this;
        document.addEventListener("keydown", function(e) {
            self._emitKey(e, "down");
        });

        document.addEventListener("keyup", function(e) {
            self._emitKey(e, "up");
        });
    },

    /**
     * Invoked when a key event happens, can be 'up' or 'down'
     *
     * @private
     */
    _emitKey: function(e, press) {
        this._emit("{}.{}".format(keycodes[e.keyCode] || String.fromCharCode(e.keyCode), press));
    },
});

module.exports = new KeyObserver();
