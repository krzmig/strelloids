/**
 * Module shows counter of cards below list title.
 * @param {Strelloids} strelloids
 * @constructor
 */
function ModuleShowCardsCounter( strelloids )
{
	var self = this;
	var settingName = 'showCardsCounter';

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

		var counters = $$('.list-header-num-cards.hide');
		for( var i = counters.length - 1; i >= 0; --i )
			counters[i].classList.remove( 'hide' );
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

		var counters = $$('.list-header-num-cards');
		for( var i = counters.length - 1; i >= 0; --i )
			counters[i].classList.add( 'hide' );
	}

	init();
}