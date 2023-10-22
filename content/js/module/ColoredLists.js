/**
 * Module will set list background color depending on their title and containing keywords.
 * @param strelloids
 * @constructor
 */
function ModuleColoredLists( strelloids )
{
	let self = this;
	let settingName = 'coloredLists';
	let schemeSettingName = 'module.coloredLists.scheme';

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

		$$( 'textarea[data-testid="list-name-textarea"]' ).forEach(( node ) => {
			if( node.value !== node.dataset.cacheTitle )
				setListColor(
					node.closest('[data-testid="list"]' ),
					node
				);
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

		$$( '[data-testid="list"]' ).forEach(( node ) => {
			node.style.backgroundColor = '';
		});

		removeCachedTitles();
	}

	/**
	 * @param {HTMLElement} list
	 * @param {HTMLElement} title
	 */
	function setListColor( list, title )
	{
		let scheme = strelloids.modules.settings.getGlobal( schemeSettingName );
		let regex;

		list.style.backgroundColor = '';

		for( let i = 0, l = scheme.length; i < l; ++i )
		{
			regex = new RegExp( scheme[i].pattern, 'i' );
			if( regex.test( title['value'] ))
			{
				if( document.documentElement.dataset.colorMode === 'dark' )
					list.style.backgroundColor = scheme[i].color_dark ?? scheme[i].color;
				else
					list.style.backgroundColor = scheme[i].color;
			}
		}

		title.dataset.cacheTitle = title['value'];
	}

	function listTitleChanged( e )
	{
		setListColor( e.target.closest( '[data-testid="list"]' ), e.target );
	}

	function removeCachedTitles()
	{
		$$( 'textarea[data-testid="list-name-textarea"]' ).forEach(( node ) => {
			node.removeAttribute( 'data-cache-title' );
		});
	}

	init();
}