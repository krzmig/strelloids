/**
 * Module will set list background color depending on their title and containing keywords.
 * @param strelloids
 * @constructor
 */
function ModuleColoredLists( strelloids )
{
	var self = this;
	var settingName = 'coloredLists';
	var schemeSettingName = 'module.coloredLists.scheme';

	function init()
	{
		strelloids.modules.events.add( 'onUpdate', update );
		strelloids.modules.events.add( 'onSettingsLoaded', boardSettingsChanged );
		strelloids.modules.events.add( 'onBoardSettingsChange', boardSettingsChanged );
		strelloids.modules.events.add( 'onListTitleChanged', listTitleChanged );
		strelloids.modules.events.add( 'onGlobalSettingsChange', globalSettingsChange );
	}

	function update()
	{
		if( !self.isEnabled() )
			return;

		var lists_titles = $$( 'textarea.list-header-name' );
		for( var i = lists_titles.length - 1; i >= 0; --i )
			if( lists_titles[i].value !== lists_titles[i].getAttribute( 'data-cache-title' ))
				setListColor(
					closest( lists_titles[i], '.list' ),
					lists_titles[i]
				);
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

	function globalSettingsChange( key )
	{
		if( key === schemeSettingName )
		{
			removeCachedTitles();
			update();
		}
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

		var lists = $$( '.list' );
		for( var i = lists.length - 1; i >= 0; --i )
			lists[i].style.backgroundColor = '';

		removeCachedTitles();
	}

	/**
	 * @param {HTMLElement} list
	 * @param {HTMLElement} title
	 */
	function setListColor( list, title )
	{
		var scheme = strelloids.modules.settings.getGlobal( schemeSettingName );
		var regex;

		list.style.backgroundColor = '';

		for( var i = 0, l = scheme.length; i < l; ++i )
		{
			regex = new RegExp( scheme[i].pattern, 'i' );
			if( regex.test( title.value ))
				list.style.backgroundColor = scheme[i].color;
		}

		title.setAttribute( 'data-cache-title', title.value );
	}

	function listTitleChanged( e )
	{
		var list = closest( e.target, '.list' );
		setListColor( list, e.target );
	}

	function removeCachedTitles()
	{
		var lists_titles = $$( 'textarea.list-header-name' );
		for( var i = lists_titles.length - 1; i >= 0; --i )
			lists_titles[i].removeAttribute( 'data-cache-title' );
	}

	init();
}