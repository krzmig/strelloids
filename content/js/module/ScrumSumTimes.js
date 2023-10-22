/**
 * Module that will sum times from ModuleScrumTimes and show them for each list.
 * ModuleScrumTimes is required to be enabled.
 * @param {Strelloids} strelloids
 * @constructor
 */
function ModuleScrumSumTimes( strelloids )
{
	const self = this;
	const settingName = 'scrumSumTimes';
	/** @type {boolean} value determine if times should be recalculated, it's for optimization/ */
	this.needUpdate = true;

	function init(  )
	{
		strelloids.modules.events.add( 'onUpdate', update );
		strelloids.modules.events.add( 'onSettingsLoaded', boardSettingsChanged );
		strelloids.modules.events.add( 'onBoardSettingsChange', boardSettingsChanged );
	}

	function update()
	{
		if( !self.isEnabled() || !self.needUpdate )
			return;

		const lists = $$( '#board [data-testid="list"]' );
		let container;

		const showEstimation = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.estimation' );
		const showConsumption = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.consumption' );
		const showTeam1 = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.team1' );
		const showTeam2 = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.team2' );

		for( let i = lists.length - 1; i >= 0; --i )
		{
			container = createContainer( lists[i] );

			if( showEstimation && showTeam1 )
				sumTimes( lists[i], container, 'estimation', 'team1' );
			if( showEstimation && showTeam2 )
				sumTimes( lists[i], container, 'estimation', 'team2' );
			if( showConsumption && showTeam1 )
				sumTimes( lists[i], container, 'consumption', 'team1' );
			if( showConsumption && showTeam2 )
				sumTimes( lists[i], container, 'consumption', 'team2' );
		}
		self.needUpdate = false;
	}

	/**
	 * @return {boolean}
	 */
	this.isEnabled = function()
	{
		return strelloids.modules.scrumTimes.isEnabled() && strelloids.modules.settings.getForCurrentBoard( settingName );
	};

	function boardSettingsChanged( key, new_board_settings, old_board_settings  )
	{
		if( old_board_settings && new_board_settings )
			if( old_board_settings[settingName] === new_board_settings[settingName] && old_board_settings['scrumTimes'] === new_board_settings['scrumTimes'] )
				return;

		if( self.isEnabled() )
			enable();
		else
			disable();
	}

	function enable()
	{
		if( DEBUG )
			$log( 'Strelloids: module ' + settingName + ' enabled' );

		self.needUpdate = true;
	}

	function disable()
	{
		if( DEBUG )
			$log( 'Strelloids: module ' + settingName + ' disabled' );

		$$( '[data-testid="list-header"] .scrum-sum-container' ).forEach(( container ) => {
			container.parentNode.removeChild( container );
		});
	}

	/**
	 * @param {HTMLElement} list
	 * @return {HTMLElement}
	 */
	function createContainer( list )
	{
		let container = list.querySelector( '.scrum-sum-container' );
		if( container )
		{
			while( container.lastChild )
				container.removeChild( container.lastChild );
		}
		else
		{
			container = createNode( 'div', { 'class': 'scrum-sum-container' });
			list.querySelector( '[data-testid="list-header"]' ).lastChild.before( container );
		}
		return container;
	}

	/**
	 * @param {HTMLElement} list
	 * @param {HTMLElement} labels_container
	 * @param {string} mode - estimation or consumption
	 * @param {string} team - team1 or team2
	 */
	function sumTimes( list, labels_container, mode, team )
	{
		let sum = 0;
		const labels = list.querySelectorAll( '.scrum-label.' + mode + '.' + team );
		for( let i = labels.length - 1; i >= 0; --i )
			sum += isNaN( labels[i].innerText ) ? 0 : parseFloat( labels[i].innerText );

		if( sum > 0 )
			labels_container.appendChild(
				createNode(
					'span',
					{ 'class': [ 'scrum-label', mode, team ]},
					( Math.round( sum * 100 ) / 100 ).toString()
				)
			);
	}

	init();
}