if(!Meteor.globals) Meteor.globals = {};

Meteor.globals.dangerGrowl = function(text, opts){
    opts = opts || {};
    opts.type = "danger";
    if(!opts.allow_dismiss) opts.allow_dismiss = true;
    if(!opts.delay) opts.delay = 3000;
    if(!opts.align) opts.align = "center";
    if(!opts.width) opts.width = "auto";
    $.bootstrapGrowl(text, opts);
};

Meteor.globals.successGrowl = function(text, opts){
    opts = opts || {};
    opts.type = "success";
    if(!opts.allow_dismiss) opts.allow_dismiss = true;
    if(!opts.delay) opts.delay = 3000;
    if(!opts.align) opts.align = "center";
    if(!opts.width) opts.width = "auto";
    $.bootstrapGrowl(text, opts);
};

Meteor.globals.positions = [
    {position: "QB", key: "QB"},
    {position: "RB", key: "RB1"},
    {position: "RB", key: "RB2"},
    {position: "WR", key: "WR1"},
    {position: "WR", key: "WR2"},
    {position: "WR", key: "WR3"},
    {position: "TE", key: "TE"},
    {position: "FLEX", key: "FLEX"},
    {position: "D/ST", key: "D/ST"}
];

Meteor.globals.players = [
    {position: "QB", name: "Teddy Bridgewater"},
    {position: "QB", name: "Peyton Manning"},
    {position: "RB", name: "Adrian Peterson"}
];

Meteor.globals.teams = [
    {name: "Minnesota Vikings"},
    {name: "Denver Broncos"}
];

Meteor.globals.exclusions = [];