Meteor.users.allow({
    update: function(){
        return false;
    },
    remove: function(){
        return false;
    }
});

Teams.allow({
    insert: function(user){
        return Meteor.user().isAdmin;
    } ,
    update: function(user){
        return Meteor.user().isAdmin;
    }
});

Players.allow({
    insert: function(user){
        return Meteor.user().isAdmin;
    } ,
    update: function(user){
        return Meteor.user().isAdmin;
    } ,
    remove: function(user){
        return Meteor.user().isAdmin;
    }
});