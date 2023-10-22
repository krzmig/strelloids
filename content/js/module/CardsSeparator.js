/**
 * Module will change cards, which titles are started by `---` or `===` into styled separator.
 * @param {Strelloids} strelloids
 * @constructor
 */
function ModuleCardsSeparator( strelloids )
{
	let self = this;
	let settingName = 'cardsSeparator';
	let separator_regex = /^[=-]{3,}/;
	let separator_regex_end = /[=-]{3,}$/;

	function init(  )
	{
		strelloids.modules.events.add( 'onUpdate', update );
		strelloids.modules.events.add( 'onSettingsLoaded', boardSettingsChanged );
		strelloids.modules.events.add( 'onBoardSettingsChange', boardSettingsChanged );
	}

	function update()
	{
		if(	!self.isEnabled() )
			return;

		$$('[data-testid="card-name"]').forEach(( card_title ) => {
			let card = card_title.closest( '[data-testid="trello-card"]' );
			if( !card )
				return;
			
			let text_node = findTextNode( card_title );
			if( !text_node )
				return;

			if( !card_title.dataset.originalTitle )
				card_title.dataset.originalTitle = text_node.nodeValue;

			if( !separator_regex.test( text_node.nodeValue ))
				return;

			card.classList.add( 'card-separator' );

			text_node.nodeValue = text_node.nodeValue.replace( separator_regex, '' ).replace( separator_regex_end, '' ).replace( /^\s+/, '' ).replace( /\s+$/, '' );
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

		$$('.card-separator').forEach(( card ) => {
			let card_title = card.querySelector('[data-testid="card-name"]');
			let text_node = findTextNode( card_title );

			card.classList.remove( 'card-separator' );

			if( text_node && card_title.dataset.originalTitle )
				text_node.nodeValue = card_title.dataset.originalTitle;
		});
	}

	init();
}