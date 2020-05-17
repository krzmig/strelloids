/**
 * Module to show estimation and consumption points for cards.
 * Estimation points should be inside round brackets, consumption in square ones.
 * It's possible to use fractions, with dot as separator.
 * Question mark can be used eg. for big tasks which should be split.
 * It's possible to enter times for two teams, to do that values should be separated by `/`.
 * Teams will get different colors for the times.
 * @param {Strelloids} strelloids
 * @constructor
 */
function ModuleScrumTimes( strelloids )
{
	var self = this;
	var settingName = 'scrumTimes';
	var estimation_regex = /\((\?|\d+\.\d+|\d+|)(?:\/(\?|\d+\.\d+|\d+))?\)/i;
	var consumption_regex = /\[(\?|\d+\.\d+|\d+|)(?:\/(\?|\d+\.\d+|\d+))?\]/i;
	var last_cards_amount = 0;

	function init()
	{
		strelloids.modules.events.add( 'onUpdate', update );
		strelloids.modules.events.add( 'onSettingsLoaded', boardSettingsChanged );
		strelloids.modules.events.add( 'onSettingsLoaded', globalSettingsChanged );
		strelloids.modules.events.add( 'onBoardSettingsChange', boardSettingsChanged );
		strelloids.modules.events.add( 'onGlobalSettingsChange', globalSettingsChanged );
		strelloids.modules.events.add( 'onCardEditOpened', cardEditOpened );
	}

	function update()
	{
		if(	!self.isEnabled() )
			return;

		var cards_titles = $$('.list-card-title');

		if( last_cards_amount !== cards_titles.length )
			strelloids.modules.scrumSumTimes.needUpdate = true;

		last_cards_amount = cards_titles.length;
		var text_node = null, container = null;
		var matches, matches2;

		var showEstimation = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.estimation' );
		var showConsumption = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.consumption' );
		var showTeam1 = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.team1' );
		var showTeam2 = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.team2' );

		for( var i = last_cards_amount - 1; i >= 0; --i )
		{
			text_node = findTextNode( cards_titles[i] );
			if( !text_node )
				continue;

			if( !cards_titles[i].getAttribute( 'data-original-title' ))
				cards_titles[i].setAttribute( 'data-original-title', text_node.nodeValue );

			matches = estimation_regex.exec( text_node.nodeValue );
			matches2 = consumption_regex.exec( text_node.nodeValue );
			if( !matches && !matches2 )
				continue;

			container = createContainer( cards_titles[i] );
			strelloids.modules.scrumSumTimes.needUpdate = true;

			if( matches && matches[1] && showEstimation && showTeam1 )
				container.appendChild(
					createNode(
						'span',
						{ 'class': [ 'scrum-label', 'estimation', 'team1' ] },
						matches[1]
					)
				);

			if( matches && matches[2] && showEstimation && showTeam2 )
				container.appendChild(
					createNode(
						'span',
						{ 'class': [ 'scrum-label', 'estimation', 'team2' ] },
						matches[2]
					)
				);

			if( matches2 && matches2[1] && showConsumption && showTeam1 )
				container.appendChild(
					createNode(
						'span',
						{ 'class': [ 'scrum-label', 'consumption', 'team1' ] },
						matches2[1]
					)
				);

			if( matches2 && matches2[2] && showConsumption && showTeam2 )
				container.appendChild(
					createNode(
						'span',
						{ 'class': [ 'scrum-label', 'consumption', 'team2' ] },
						matches2[2]
					)
				);

			text_node.nodeValue = text_node.nodeValue.replace( estimation_regex, '' ).replace( consumption_regex, '' ).replace( /^\s+/, '' ).replace( /\s+$/, '' );
		}
	}

	/**
	 * @return {boolean}
	 */
	this.isEnabled = function()
	{
		return strelloids.modules.settings.getForCurrentBoard( settingName );
	};

	function boardSettingsChanged( key, new_board_settings, old_board_settings )
	{
		if( old_board_settings && new_board_settings )
		{
			if( old_board_settings['scrumTimes.show.estimation'] !== new_board_settings['scrumTimes.show.estimation'] ||
				old_board_settings['scrumTimes.show.consumption'] !== new_board_settings['scrumTimes.show.consumption'] ||
				old_board_settings['scrumTimes.show.team1'] !== new_board_settings['scrumTimes.show.team1'] ||
				old_board_settings['scrumTimes.show.team2'] !== new_board_settings['scrumTimes.show.team2'] )
				disable();

			if( old_board_settings[settingName] === new_board_settings[settingName] )
				return;
		}

		if( self.isEnabled() )
			enable();
		else
			disable();
	}

	function globalSettingsChanged( key )
	{
		var settings = [ 'bgTeam1Estimation', 'fontTeam1Estimation', 'bgTeam1Consumption', 'fontTeam1Consumption',
			'bgTeam2Estimation', 'fontTeam2Estimation', 'bgTeam2Consumption', 'fontTeam2Consumption' ];
		var css = [ 'bg-team1-estimation', 'font-team1-estimation', 'bg-team1-consumption', 'font-team1-consumption',
			'bg-team2-estimation', 'font-team2-estimation', 'bg-team2-consumption', 'font-team2-consumption' ];

		for( var i in settings )
			if( !key || key === 'module.scrumTimes.color.'+settings[i] )
				$b.style.setProperty(
					'--strelloids-scrum-times-'+css[i],
					strelloids.modules.settings.getGlobal( 'module.scrumTimes.color.'+settings[i] )
				);
	}

	function enable()
	{
		if( DEBUG )
			$log( 'Strelloids: module ' + settingName + ' enabled' );
	}

	function disable()
	{
		if( DEBUG )
			$log( 'Strelloids: module ' + settingName + ' disabled' );

		var cards_titles = $$('.list-card-title');
		var text_node = null;

		for( var i = cards_titles.length - 1; i >= 0; --i )
		{
			text_node = findTextNode( cards_titles[i] );
			if( !text_node )
				continue;

			removeOldTags( cards_titles[i] );

			if( cards_titles[i].getAttribute( 'data-original-title' ))
				text_node.nodeValue = cards_titles[i].getAttribute( 'data-original-title' );

		}
	}

	/**
	 * @param {HTMLElement} card_title
	 */
	function removeOldTags( card_title )
	{
		var old_tags = card_title.parentNode.querySelectorAll( '.scrum-label' );
		for( var i = old_tags.length - 1; i >= 0; --i )
			old_tags[i].parentNode.removeChild( old_tags[i] );
	}

	/**
	 * @param {HTMLElement} card_title
	 * @return {HTMLElement}
	 */
	function createContainer( card_title )
	{
		var container = card_title.parentNode.querySelector( '.scrum-points-container' );
		if( container )
		{
			removeOldTags( card_title );
		}
		else
		{
			container = createNode( 'div', { 'class': 'scrum-points-container' });
			card_title.parentNode.appendChild( container );
		}
		return container;
	}

	function cardEditOpened()
	{
		if(	!self.isEnabled() )
			return;

		var showEstimation = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.estimation' );
		var showConsumption = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.consumption' );
		var showTeam1 = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.team1' );
		var showTeam2 = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.team2' );
		var sequence = strelloids.modules.settings.getGlobal( 'module.scrumTimes.storyPointsSequence' );

		var ui_container = $('.card-detail-data');
		var container, i, title;

		if( $( '.scrum-buttons' ) || !ui_container)
			return;

		if( showConsumption && ( showTeam1 || showTeam2 ))
		{
			container = createNode( 'div', { 'class': ['card-detail-item', 'scrum-buttons'] } );
			title = createNode(
				'h3',
				{ 'class': 'card-detail-item-header' },
				' ' + _( 'card_edit_consumption' )
			);
			title.prepend( createNode( 'i', { 'class': 'strelloids-icon-fire' }));
			container.appendChild( title );

			if( showTeam1 )
				appendSequenceButtons( 'team1', 'consumption' );
			container.appendChild( createNode( 'div' ) );

			if( showTeam2 )
				appendSequenceButtons( 'team2', 'consumption' );

			ui_container.prepend( container );
		}
		if( showEstimation && ( showTeam1 || showTeam2 ))
		{
			container = createNode( 'div', { 'class': ['card-detail-item', 'scrum-buttons'] } );
			title = createNode(
				'h3',
				{ 'class': 'card-detail-item-header' },
				' ' + _( 'card_edit_estimation' )
			);
			title.prepend( createNode( 'i', { 'class': 'strelloids-icon-light-bulb' }));
			container.appendChild( title );

			if( showTeam1 )
				appendSequenceButtons( 'team1', 'estimation' );
			container.appendChild( createNode( 'div' ) );

			if( showTeam2 )
				appendSequenceButtons( 'team2', 'estimation' );
			ui_container.prepend( container );
		}

		function appendSequenceButtons( team, mode )
		{
			var btn;
			container.classList.add( 'show-'+team );
			for( i = 0; i < sequence.length; ++i )
			{
				btn = createNode(
					'button',
					{ 'class': ['scrum-button', team, mode], value: sequence[i] },
					sequence[i]
				);
				btn.addEventListener( 'click', buttonClicked );
				container.appendChild( btn );
			}
		}

		function buttonClicked()
		{
			var matches, new_tag = '';
			var team = this.classList.contains( 'team1' ) ? 'team1' : 'team2';
			var mode = this.classList.contains( 'estimation' ) ? 'estimation' : 'consumption';
			var title = $('textarea.mod-card-back-title');

			title.focus();

			matches = title.value.match( mode === 'estimation' ? estimation_regex : consumption_regex );
			new_tag += mode === 'estimation' ? '(' : '[';
			if( !matches )
				matches = [ '', '', '' ];

			new_tag += team === 'team1' ? this.value : matches[1];
			new_tag += team === 'team2' ? '/' + this.value : ( matches[2] ? '/' + matches[2] : '' );
			new_tag += mode === 'estimation' ? ')' : ']';
			if( matches[0] )
				title.value = title.value.replace( matches[0], new_tag );
			else
				title.value += ' ' + new_tag;

			title.blur();
		}
	}

	init();
}