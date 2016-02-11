FlowRouter.route( '/', {
    name: 'main',
    action(){
        //console.log("User", Meteor.user());
        if(Meteor.user()) FlowRouter.go("/home");
        else FlowRouter.go("/about");
    }
});

FlowRouter.route( '/home', {
    name: 'home',
    action(){
        if(Meteor.user()) ReactLayout.render( App, { yield: <Home /> } );
        else FlowRouter.go("/about");
    }
});

FlowRouter.route( '/nfl', {
    name: 'nfl',
    action(){
        if(Meteor.user()){
            ReactLayout.render( App, { yield: <Nfl /> } );
        }
        else FlowRouter.go("/about");
    }
});

FlowRouter.route( '/signup', {
    name: 'signup',
    action(){
        ReactLayout.render( App, { yield: <SignUp /> } );
    }
});

FlowRouter.route( '/loggingin', {
    name: 'loggingin',
    action(){
        ReactLayout.render( App, { yield: <LoggingIn /> } );
    }
});

FlowRouter.route( '/loggingout', {
    name: 'loggingin',
    action(){
        ReactLayout.render( App, { yield: <LoggingOut /> } );
    }
});

FlowRouter.route( '/admin', {
    name: 'admin',
    action(){
        if(Meteor.user() && Meteor.user().isAdmin) ReactLayout.render( App, { yield: <Admin /> } );
        else if(Meteor.user()) ReactLayout.render( App, { yield: <Home /> } );
        else ReactLayout.render( App, { yield: <Home /> } );
    }
});

FlowRouter.route( '/admin/nfl', {
    name: 'adminNfl',
    action(){
        if(Meteor.user() && Meteor.user().isAdmin) ReactLayout.render( App, { yield: <AdminNfl /> } );
        else if(Meteor.user()) ReactLayout.render( App, { yield: <Home /> } );
        else ReactLayout.render( App, { yield: <Home /> } );
    }
});

FlowRouter.route( '/about', {
    name: 'about',
    action(){
        ReactLayout.render( App, { yield: <About /> } );
    }
});

FlowRouter.route( '/howto', {
    name: 'howto',
    action(){
        ReactLayout.render( App, { yield: <HowTo /> } );
    }
});
