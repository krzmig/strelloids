/**
 * Module shows counter of cards below list title.
 * @param {Strelloids} strelloids
 * @constructor
 */
function ModuleShowCardsCounter( strelloids )
{
	let self = this;
	let settingName = 'showCardsCounter';

	function init()
	{
		strelloids.modules.events.add( 'onUpdate', update );
		strelloids.modules.events.add( 'onSettingsLoaded', boardSettingsChanged );
		strelloids.modules.events.add( 'onBoardSettingsChange', boardSettingsChanged );
	}

	function update()
	{
		if(	!self.isEnabled() )
			return;

		$$( '[data-testid="list"]' ).forEach(( list ) => {
			let counter = list.querySelector( '.list-header-num-cards' );
			if( !counter )
			{
				counter = createNode( 'div', { class: 'list-header-num-cards' });
				let scrum = list.querySelector( '.scrum-sum-container' );
				if( scrum )
				{
					scrum.before( counter )
				}
				else
				{
					let header = list.querySelector( '[data-testid="list-header"]' );
					header.lastChild.before( counter );
				}
			}
			counter.innerText = _( 'cards_counter' ).replace( '%i', list.querySelectorAll( '[data-testid="trello-card"]' ).length );
		});
	}

	/**
	 * @returns {boolean}
	 */
	this.isEnabled = function()
	{
		return strelloids.modules.settings.getForCurrentBoard( settingName );
	};

	function boardSettingsChanged( key, new_board_settings, old_board_settings )
	{
		if( old_board_settings && new_board_settings )
			if( old_board_settings[settingName] === new_board_settings[settingName] )
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
	}

	function disable()
	{
		if( DEBUG )
			$log( 'Strelloids: module ' + settingName + ' disabled' );

		$$('.list-header-num-cards').forEach(( counter ) => {
			counter.remove();
		});
	}

	init();
}