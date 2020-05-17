/**
 * Module that will sum times from ModuleScrumTimes and show them for each list.
 * ModuleScrumTimes is required to be enabled.
 * @param {Strelloids} strelloids
 * @constructor
 */
function ModuleScrumSumTimes( strelloids )
{
	var self = this;
	var settingName = 'scrumSumTimes';
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

		var lists = $$('#board > .js-list');
		var container;

		var showEstimation = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.estimation' );
		var showConsumption = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.consumption' );
		var showTeam1 = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.team1' );
		var showTeam2 = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.team2' );

		for( var i = lists.length - 1; i >= 0; --i )
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

		var containers = $$('.list-header .scrum-sum-container');

		for( var i = containers.length - 1; i >= 0; --i )
			containers[i].parentNode.removeChild( containers[i] );
	}

	/**
	 * @param {HTMLElement} list
	 * @return {HTMLElement}
	 */
	function createContainer( list )
	{
		var container = list.querySelector( '.scrum-sum-container' );
		if( container )
		{
			while( container.lastChild )
				container.removeChild( container.lastChild );
		}
		else
		{
			container = createNode( 'div', { 'class': 'scrum-sum-container' });
			list.querySelector( '.list-header' ).appendChild( container );
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
		var sum = 0;
		var labels = list.querySelectorAll( '.scrum-label.' + mode + '.' + team );
		for( var i = labels.length - 1; i >= 0; --i )
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