/**
 * Module shows on lists short card ID, which you can normally find inside card, after click Share button.
 * @param {Strelloids} strelloids
 * @constructor
 */
function ModuleShowCardShortId( strelloids )
{
	var self = this;
	var settingName = 'showCardShortId';

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

		var ids = $$('.card-short-id.hide');
		for( var i = ids.length - 1; i >= 0; --i )
			ids[i].classList.remove( 'hide' );
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

		var ids = $$('.card-short-id');
		for( var i = ids.length - 1; i >= 0; --i )
			ids[i].classList.add( 'hide' );
	}

	init();
}
