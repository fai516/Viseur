// Settings for Viseur

var SettingsManager = require("./settingsManager");

// hackish, but no idea where-else to put this
var onResolutionChanged = function(input) {
    SettingsManager.on("viseur.resolution-type.changed", function(newValue) {
        input.field.$element.toggleClass("collapsed", newValue !== "Manual");
    });

    input.field.$element.addClass("collapsed");
};

module.exports = [
    {
        id: "info-pane-side",
        label: "Docked Side",
        hint: "Which side this info pane will be snapped to",
        input: "DropDown",
        options: [
            { text:"\u25B2 Top", value: "top" },
            { text: "\u25B6 Right", value: "right" },
            { text: "\u25BC Bottom", value: "bottom" },
            { text: "\u25C0 Left", value: "left" }
        ],
        default: "right",
    },
    {
        id: "playback-speed",
        label: "Playback Speed",
        hint: "The time (in ms)  for each animation to be played. Smaller numbers mean faster playback.",
        input: "Number",
        min: 50,
        max: 999999,
        default: 1000,
    },
    {
        id: "resolution-type",
        label: "Resolution",
        hint: "'Auto' will resize to the current window's resolution.\n'Manual' can be used to set to a lower resolution for slower computers.",
        input: "DropDown",
        options: [ "Auto", "Manual" ],
        default: "Auto",
    },
    {
        id: "resolution-width",
        label: "Width",
        input: "Number",
        min: 300,
        default: 800,
        max: screen.width,
        onInputCreated: onResolutionChanged,
    },
    {
        id: "resolution-height",
        label: "Height",
        input: "Number",
        min: 300,
        default: 400,
        max: screen.height,
        onInputCreated: onResolutionChanged,
    },
    {
        id: "anti-aliasing",
        label: "Anti-Aliasing",
        hint: "Only works in Google Chrome",
        input: "CheckBox",
        default: true,
    },
];
