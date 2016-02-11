HowTo = React.createClass({
    render() {
        return (
            <div className="text-center">
                <h4 className="form-label">
                    The goal of this application is to help you find your most optimal fantasy lineup without having to do any data crunching.
                </h4>
                <h4 className="form-label">
                    Click "Optimize" to find the optimal lineup for the current week
                </h4>
                <h4 className="form-label">
                    If you see a player that you are skeptical about or do not want to pick, click the "Exclude" button and we will find someone to take their place
                </h4>
                <h4 className="form-label">
                    Likewise, if there is a player you want to be included, select them from the dropdown menu and click the "Lock" button
                </h4>
                <h4 className="form-label">
                    Your budget is shown in the upper left hand corner and you are not allowed to exceed your current budget when selecting players
                </h4>
                <h4 className="form-label">
                    If you want to select a player to lock but you will go over budget, click the "Clear" button next to any player to free up some budget room
                </h4>
                <h4 className="form-label">
                    Play around until you find a lineup(s) that you like!
                </h4>
                <h4 className="form-label">
                    If you are successful/unsuccessful email us at admin@fantasyoptimize.com. Send us your lineup and we can adjust our algorithm accordingly
                </h4>
                <h4 className="form-label">
                    By giving us input on what works/didnt work it will help us to re-define our valuing of players
                </h4>
                <h4 className="form-label">
                    If you have further questions feel free to email us, Enjoy!
                </h4>
            </div>
        )
    }
});