// This is a "class" to represent the Player object in the game. If you want to render it in the game do so here.
var Classe = require("classe");
var PIXI = require("pixi.js");
var Color = require("color");
var ease = require("core/utils").ease;

var GameObject = require("./gameObject");

//<<-- Creer-Merge: requires -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.
// any additional requires you want can be required here safely between Creer runs
//<<-- /Creer-Merge: requires -->>

/**
 * @typedef {Object} PlayerID - a "shallow" state of a Player, which is just an object with an `id`.
 * @property {string} id - the if of the PlayerState it represents in game.gameObjects
 */

/**
 * @typedef {Object} PlayerState - A state representing a Player
 * @property {string} clientType - What type of client this is, e.g. 'Python', 'JavaScript', or some other language. For potential data mining purposes.
 * @property {string} color - The color (side) of this player. Either 'White' or 'Black', with the 'White' player having the first move.
 * @property {string} gameObjectName - String representing the top level Class that this game object is an instance of. Used for reflection to create new instances on clients, but exposed for convenience should AIs want this data.
 * @property {string} id - A unique id for each instance of a GameObject or a sub class. Used for client and server communication. Should never change value after being set.
 * @property {boolean} inCheck - True if this player is currently in check, and must move out of check, false otherwise.
 * @property {Array.<string>} logs - Any strings logged will be stored here. Intended for debugging.
 * @property {boolean} lost - If the player lost the game or not.
 * @property {boolean} madeMove - If the Player has made their move for the turn. true means they can no longer move a Piece this turn.
 * @property {string} name - The name of the player.
 * @property {PlayerID} opponent - This player's opponent in the game.
 * @property {Array.<PieceID>} pieces - All the unpcaptured chess Pieces owned by this player.
 * @property {number} rankDirection - The direction your Pieces must go along the rank axis until they reach the other side.
 * @property {string} reasonLost - The reason why the player lost the game.
 * @property {string} reasonWon - The reason why the player won the game.
 * @property {number} timeRemaining - The amount of time (in ns) remaining for this AI to send commands.
 * @property {boolean} won - If the player won the game or not.
 */

/**
 * @class
 * @classdesc A player in this game. Every AI controls one player.
 * @extends GameObject
 */
var Player = Classe(GameObject, {
    /**
     * Initializes a Player with basic logic as provided by the Creer code generator. This is a good place to initialize sprites
     *
     * @memberof Player
     * @private
     */
    init: function(initialState, game) {
        GameObject.init.apply(this, arguments);

        //<<-- Creer-Merge: init -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.
        // init logic goes here
        //<<-- /Creer-Merge: init -->>
    },

    /**
     * Static name of the classe.
     *
     * @static
     */
    name: "Player",

    /**
     * The current state of this Player. Undefined when there is no current state.
     *
     * @type {PlayerState|null})}
     */
    current: null,

    /**
     * The next state of this Player. Undefined when there is no next state.
     *
     * @type {PlayerState|null})}
     */
    next: null,

    // The following values should get overridden when delta states are merged, but we set them here as a reference for you to see what variables this class has.

    /**
     * Set this to `true` if this GameObject should be rendered.
     *
     * @static
     */
    //<<-- Creer-Merge: shouldRender -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.
    shouldRender: false,
    //<<-- /Creer-Merge: shouldRender -->>

    /**
     * Called approx 60 times a second to update and render the Player. Leave empty if it should not be rendered
     *
     * @param {Number} dt - a floating point number [0, 1) which represents how far into the next turn that current turn we are rendering is at
     * @param {Object} current - the current (most) game state, will be this.next if this.current is null
     * @param {Object} next - the next (most) game state, will be this.current if this.next is null
     */
    render: function(dt, current, next) {
        GameObject.render.apply(this, arguments);

        //<<-- Creer-Merge: render -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.
        // update and render where the Player is
        //<<-- /Creer-Merge: render -->>
    },

    /**
     * Invoked when the right click menu needs to be shown.
     *
     * @private
     * @returns {Array} array of context menu items, which can be {text, icon, callback} for items, or "---" for a seperator
     */
    _getContextMenu: function() {
        var self = this;
        var menu = [];

        //<<-- Creer-Merge: _getContextMenu -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.
            // add context menu items here
        //<<-- /Creer-Merge: _getContextMenu -->>

        return menu;
    },


    // Joueur functions - functions invoked for human playable client

    // /Joueur functions

    /**
     * Invoked when the state updates.
     *
     * @private
     * @param {Object} current - the current (most) game state, will be this.next if this.current is null
     * @param {Object} next - the next (most) game state, will be this.current if this.next is null
     */
    _stateUpdated: function(current, next) {
        GameObject._stateUpdated.apply(this, arguments);

        //<<-- Creer-Merge: _stateUpdated -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.
        // update the Player is based on its current and next states
        //<<-- /Creer-Merge: _stateUpdated -->>
    },

    //<<-- Creer-Merge: functions -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.
    // any additional functions you want to add to this class can be perserved here
    //<<-- /Creer-Merge: functions -->>

});

module.exports = Player;
