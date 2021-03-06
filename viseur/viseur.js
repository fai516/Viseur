var $ = require("jquery");
var queryString = require("query-string");
var utils = require("core/utils");
var Classe = require("classe");
var Observable = require("core/observable");
var Parser = require("./parser");
var Renderer = require("./renderer/");
var TimeManager = require("./timeManager");
var SettingsManager = require("./settingsManager");
var Joueur = require("./joueur");

var Viseur = Classe(Observable, {
    /**
     * A hackish way of initializing itself after being required, as being a singleton others requiring it would cause cyclical rferences otherwise
     */
    start: function() {
        var GUI = require("./gui");

        this.timeManager = new TimeManager();

        this.gui = new GUI({
            $parent: $("#main"),
        });

        var self = this;

        this.timeManager.on("new-index", function(index) {
            self._updateCurrentStateAsync(index);
        });

        this.renderer = new Renderer({
            $parent: this.gui.$rendererWrapper,
        });

        this.gui.on("resized", function(width, height, rendererHeight) {
            self.renderer.resize(width, rendererHeight);
        });
        this.gui.resize();

        this.renderer.on("rendering", function() {
            if(self.game) {
                var c = self.timeManager.getCurrentTime();
                self._emit("time-updated", c.index, c.dt);
                self.game.render(c.index, c.dt);
            }
        });

        this._parseURL();
    },

    _games: require("games/"),

    /**
     * parses URL parameters and does whatever they do, ingores unknown url parms.
     *
     * @private
     */
    _parseURL: function() {
        var self = this;
        this.urlParms = queryString.parse(location.search);

        // set Settings via url parms if they are valid
        for(var key in this.urlParms) {
            if(SettingsManager.has(key)) {
                SettingsManager.set(key, null, utils.unstringify(this.urlParms[key]));
            }
        }

        // check if the gamelog url is remote
        var logUrl = this.urlParms.log || this.urlParms.logUrl || this.urlParms.logURL;
        if(logUrl) {
            this.loadRemoteGamelog(logUrl);
        }
        else if(this.urlParms.arena) { // then we are in arena mode
            $.ajax({
                dataType: "text",
                url: this.urlParms.arena,
                crossDomain: true,
                success: function(gamelogURL) {
                    self.gui.goFullscreen();
                    self.loadRemoteGamelog(gamelogURL);
                },
                error: function() {
                    self.gui.modalError("Error loading gamelog url from arena.");
                },
            });

            // when we finish playback (the timer reaches its end), wait 3 seconds, then reload the window (which will grab a new gamelog and do all this again)
            this.timeManager.on("ended", function() {
                setTimeout(function() {
                    location.reload();
                }, 3000);
            });
        }
    },

    /**
     * Does an ajax call to load a remote gamelog at some url
     *
     * @param {string} url - a url that will respond with the gamelog to load
     */
    loadRemoteGamelog: function(url) {
        var self = this;
        this.gui.modalMessage("Loading remote gamelog");
        this._emit("gamelog-is-remote", url);

        $.ajax({
            dataType: "text",
            url: url,
            success: function(data) {
                self.gui.modalMessage("Initializing Visualizer.");
                self.parseGamelog(data);
            },
            error: function() {
                self.gui.modalError("Error loading remote gamelog.");
            },
        });
    },

    /**
     * Parses a json string to a gamelog
     *
     * @param {string} str - json formatted string
     * @returns {[type]} [description]
     */
    parseGamelog: function(str) {
        this._unparsedGamelog = str;
        var parsed;

        try {
            parsed = JSON.parse(str);
        }
        catch(err) {
            return self.gui.modalError("Error parsing gamelog");
        }

        this.gamelogLoaded(parsed);
    },

    /**
     * Called once a gamelog is loaded
     *
     * @param {Object} the deserialized JSON object that is the FULL gamelog
     */
    gamelogLoaded: function(gamelog) {
        this._rawGamelog = gamelog;
        this._parser = new Parser(gamelog.constants);

        if(!gamelog.streaming) {
            this._emit("gamelog-loaded", gamelog);
        }
        // else we didn't "load" the gamelog, it's streaming to us

        // we keep the current and next state here, fully merged with all game information.
        this._mergedDelta = {
            index: -1,
            currentState: null,
            nextState: this._parser.mergeDelta({}, gamelog.deltas[0].game),
        };

        if(!this._joueur && gamelog.deltas.length > 0) {
            this._initGame(gamelog.gameName);
        }
    },

    /**
     * Initializes the Game object for the specified gameName. The class created will be the one in /games/{gameName}/game.js
     *
     * @param {string} gameName - name of the game to initialize. Must be a valid game name, or throwns an error
     * @param {string} [playerID] - id of the player if this game has a human player
     */
    _initGame: function(gameName, playerID) {
        var gameNamespace = this._games[gameName];

        if(!gameNamespace) {
            throw new Error("Cannot load data for game '{}'.".format(gameName));
        }

        if(this.game) {
            throw new Error("Viseur game already initialized");
        }

        if(!this._joueur) {
            this._updateCurrentState(0); // create the initial states
            this.timeManager.setTime(0, 0);
        }

        this.game = new gameNamespace.Game(this._rawGamelog, playerID);

        var textures = {};

        for(var key in this.game.namespace.textures) {
            if(this.game.namespace.textures.hasOwnProperty(key)) {
                textures[key] = "games/" + this.game.namespace.dir + "/textures/" + this.game.namespace.textures[key];
            }
        }
        var self = this;
        this.renderer.loadTextures(textures, function() {
            self._loadedTextures = true;
            self._checkIfReady();
        });
    },

    /**
     * Invokes _updateCurrentState asyncronously if it may take a long time, so the gui can update
     *
     * @param {number} index - the new states index, must be between [0, deltas.length]
     */
    _updateCurrentStateAsync: function(index) {
        var long = Math.abs(index - this._mergedDelta.index) > 25; // the loading time may be long

        var self = this;
        if(long) {
            this.gui.modalMessage("Loading game state...", function() {
                self._updateCurrentState(index);
                self.gui.hideModal();
            });
        }
        else { // just do it syncronously
            this._updateCurrentState(index);
        }
    },

    /**
     * Brings the current state & next state to the one at the specificed index. If the current and passed in indexes are far apart this operation can take a decent chunk of time...
     *
     * @param {number} index - the new states index, must be between [0, deltas.length]
     */
    _updateCurrentState: function(index) {
        if(index < 0) {
            this._currentState = {
                game: this._mergedDelta.currentState,
                nextGame: this._mergedDelta.nextState,
            };

            return;
        }

        var d = this._mergedDelta;
        var deltas = this._rawGamelog.deltas;
        var indexChanged = (index !== d.index);

        d.currentState = d.currentState || {};

        // if increasing index...
        while(index > d.index) {
            d.index++;

            if(deltas[d.index] && !deltas[d.index].reversed) {
                deltas[d.index].reversed = this._parser.createReverseDelta(d.currentState, deltas[d.index].game);
            }

            if(d.nextState && deltas[d.index] && deltas[d.index + 1] && !deltas[d.index + 1].reversed) {
                deltas[d.index + 1].reversed = this._parser.createReverseDelta(d.nextState, deltas[d.index + 1].game);
            }

            if(deltas[d.index]) {
                d.currentState = this._parser.mergeDelta(d.currentState, deltas[d.index].game);
            }

            if(d.nextState && deltas[d.index + 1]) { // if there is a next state (not at the end)
                // wouldn't this skip two states? shouldnt it be null at the end?
                d.nextState = this._parser.mergeDelta(d.nextState, deltas[d.index + 1].game);
            }
        }

        // if decreasing index...
        while(index < d.index) {
            var r = deltas[d.index] && deltas[d.index].reversed;
            var r2 = d.nextState && deltas[d.index + 1] && deltas[d.index + 1].reversed;

            if(r) {
                d.currentState = this._parser.mergeDelta(d.currentState, r);
            }

            if(r2) {
                if(deltas[d.index + 1]) { // if there is a next state (not at the end)
                    d.nextState = this._parser.mergeDelta(d.nextState, r2);
                }
            }

            d.index--;
        }

        if(indexChanged) {
            this._currentState = $.extend({}, deltas[d.index], {
                game: d.currentState,
                nextGame: d.nextState,
            });

            this._emit("state-changed", this._currentState);
        }
    },

    /**
     * Returns the current state of the game
     *
     * @returns {Object} the current state, which is a custom object containing the current `game` state and the `nextGame` state.
     */
    getCurrentState: function() {
        return this._currentState;
    },

    /**
     * Called when Viseur thinks it is ready, meaning the renderer has downloaded all assets, the gamelog is loaded, and the game class as been initalized.
     *
     * @private
     */
    _checkIfReady: function() {
        if(this._loadedTextures && (!this._joueur || this._joueur.hasStarted())) { // then we are ready to start
            this.gui.hideModal();
            this._emit("ready", this.game, this._rawGamelog, this._unparsedGamelog);
        }
    },

    /**
     * Call when you want to connect to a remote gamelog source, e.g. spectator mode, arena mode, etc
     *
     * @param {Object} data - connection data, must include 'type', 'server', and 'port'.
     * @throws {Error} If data.type is not a valid connection type
     */
    connect: function(data) {
        var callback;

        switch(data.type.toLowerCase()) {
            case "arena":
                callback = this._startArena;
                break;
            case "spectate":
                callback = this._spectate;
                break;
            case "human":
                callback = this._playAsHuman;
                break;
            case "tournament":
                callback = this._connectToTournament; // TODO: Do
                break;
        }

        if(callback) {
            callback.call(this, data.server, data.port, data.gameName, data);
            return;
        }

        throw new Error("No type of connection '{}'.".format(data.type));
    },

    /**
     * Connects to a Cerveau game server to spectate some game
     *
     * @param {string} server - the server Cerveau is running on (without port)
     * @param {number} port - the port the server is running on
     * @param {string} gameName - name of the game to spectate
     */
    _spectate: function(server, port, gameName) {
        this.gui.modalMessage("Spectating game...");

        this._initJoueur(server, port, gameName, {
            spectating: true,
        });
    },

    /**
     * Starts up "arena" mode, which grabs gamelogs from a url, then plays, it, then repeats
     *
     * @param {String} url - url to start grabbing arena gamelog urls from
     */
    _startArena: function(url) {
        if(utils.validateURL(url)) {
            this.urlParms.arena = url;
            location.search = queryString.stringify(this.urlParms);
        }
        else {
            this.gui.modalError("Invalid url for arena mode");
        }
    },

    /**
     * Connects to a game server to play a game for the human controlling this Viseur
     *
     * @param {string} server - the server Cerveau is running on (without port)
     * @param {number} port - the port the server is running on
     * @param {string} gameName - name of the game to spectate
     * @param {Object} data - additional data to send to the game server, such as playerName
     */
    _playAsHuman: function(server, port, gameName, data) {
        this.gui.modalMessage("Connecting to game server...");

        this._initJoueur(server, port, gameName, data);
    },

    /**
     * Checks if there is currenly a human playing
     *
     * @returns {Boolean} true if there is a human player, false otherwise (including spectator mode)
     */
    hasHumanPlaying: function() {
        return (this._joueur.getPlayerID() !== undefined);
    },

    /**
     * Initializes the Joueur (game client)
     *
     * @param {String} server - game server address
     * @param {Number} port - port for server
     * @param {String} gameName - name of the game to connect to (id)
     * @param {Object} optionalArgs - any optional args for the game session
     */
    _initJoueur: function(server, port, gameName, optionalArgs) {
        var self = this;
        this._joueur = new Joueur(server, port, gameName, optionalArgs);
        this._rawGamelog = self._joueur.getGamelog();

        this._joueur.on("connected", function() {
            self.gui.modalMessage("Awaiting game to start...");

            self._emit("connection-connected");
        });

        this._joueur.on("event-lobbied", function(data) {
            gameName = data.gameName;

            self.gui.modalMessage("In lobby '{gameSession}' for '{gameName}'. Waiting for game to start.".format(data));
        });

        this._joueur.on("event-start", function() {
            self._initGame(gameName, self._joueur.getPlayerID());
            self._checkIfReady();
        });

        this._joueur.on("errored", function() {
            self.gui.modalError("Connection errored");
            self._emit("connection-errored");
        });

        this._joueur.on("closed", function() {
            self._emit("connection-closed");
        });

        this._joueur.on("event-delta", function() {
            if(self._rawGamelog.deltas.length === 1) {
                self.gamelogLoaded(self._rawGamelog);
            }

            self._emit("gamelog-updated", self._rawGamelog);
        });

        this._joueur.on("event-over", function(data) {
            self._emit("gamelog-finalized", self._rawGamelog, data.gamelogURL);
        });

        this._joueur.on("fatal", function(data) {
            self.gui.modalError("Fatal game server event: " + data.message);
        });
    },

    /**
     * Runs some function the server for a game object
     *
     * @param {string} callerID - the id of the caller
     * @param {string} run - the function to run
     * @param {Object} args - key value pairs for the function to run
     * @param {Function} callback - callback to invoke once run, is passed the return value
     */
    runOnServer: function(callerID, functionName, args, callback) {
        if(!this._joueur) {
            throw new Error("No game client to run game logic for.");
        }

        this._joueur.run(callerID, functionName, args);

        if(callback) {
            this._joueur.once("event-ran", callback);
        }
    },

    /**
     * Handle an uncaught error, if this gets hit something BAD happened
     *
     * @param {Error} error - the uncaught error
     */
    handleError: function(error) {
        if(this.gui) {
            this.gui.modalError("Uncaught Error: {} - {}".format(error));
        }
    }
});

module.exports = new Viseur(); // singleton
