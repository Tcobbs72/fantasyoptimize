Meteor.publish("users", function(){
    return Meteor.users.find();
});

Meteor.publish("players", function(){
    return Players.find({}, {sort: {name: 1}});
});

Meteor.publish("teams", function(){
    return Teams.find({}, {sort: {name: 1}});
});

Meteor.publish("positions", function(){
    return Positions.find();
});