/**
 * Module will change cards, which titles are started by `---` or `===` into styled separator.
 * @param {Strelloids} strelloids
 * @constructor
 */
function ModuleCardsSeparator( strelloids )
{
	var self = this;
	var settingName = 'cardsSeparator';
	var separator_regex = /^[=-]{3,}/;
	var separator_regex_end = /[=-]{3,}$/;

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

		var cards_titles = $$('.list-card-title');
		var text_node = null;

		for( var i = cards_titles.length - 1; i >= 0; --i )
		{
			text_node = findTextNode( cards_titles[i] );

			if( !text_node )
				continue;

			if( !cards_titles[i].getAttribute( 'data-original-title' ))
				cards_titles[i].setAttribute( 'data-original-title', text_node.nodeValue );

			if( !separator_regex.test( text_node.nodeValue ))
				continue;

			var card = closest( cards_titles[i], '.list-card' );
			card.classList.add( 'card-separator' );

			text_node.nodeValue = text_node.nodeValue.replace( separator_regex, '' ).replace( separator_regex_end, '' ).replace( /^\s+/, '' ).replace( /\s+$/, '' );
		}
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

		var cards = $$('.card-separator');
		var text_node = null;

		for( var i = cards.length - 1; i >= 0; --i )
		{
			var card_title = cards[i].querySelector('.list-card-title');
			text_node = findTextNode( card_title );

			cards[i].classList.remove( 'card-separator' );

			if( text_node && card_title.getAttribute( 'data-original-title' ))
				text_node.nodeValue = card_title.getAttribute( 'data-original-title' );
		}
	}

	init();
}