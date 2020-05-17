/**
 * Module display colored border of cards, based on keywords in card title like: !1 !2 !3 !4 or !5, where !1 is the
 * highest.
 * @param {Strelloids} strelloids
 * @constructor
 */
function ModuleCardsPrioritization( strelloids )
{
	var self = this;
	var settingName = 'cardsPrioritization';
	var tag_regex = /(^|\s)!([1-5])($|\s)/i;

	function init(  )
	{
		strelloids.modules.events.add( 'onUpdate', update );
		strelloids.modules.events.add( 'onSettingsLoaded', globalSettingsChanged );
		strelloids.modules.events.add( 'onSettingsLoaded', boardSettingsChanged );
		strelloids.modules.events.add( 'onGlobalSettingsChange', globalSettingsChanged );
		strelloids.modules.events.add( 'onBoardSettingsChange', boardSettingsChanged );
		strelloids.modules.events.add( 'onCardEditOpened', cardEditOpened );
		strelloids.modules.events.add( 'onCardTitleChanged', updatePriorityUI );
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

			var matches;
			if(( matches = tag_regex.exec( text_node.nodeValue )) === null )
				continue;

			setPriority( cards_titles[i], parseInt( matches[2] ));

			text_node.nodeValue = text_node.nodeValue.replace( tag_regex, ' ' ).replace( /^\s+/, '' ).replace( /\s+$/, '' );
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

		var cards = $$('.list-card.priority-set');
		var text_node = null;

		for( var i = cards.length - 1; i >= 0; --i )
		{
			var card_title = cards[i].querySelector( '.list-card-title' );
			text_node = findTextNode( card_title );

			if( !text_node )
				continue;

			clearPriority( cards[i] );

			if( card_title.getAttribute( 'data-original-title' ))
				text_node.nodeValue = card_title.getAttribute( 'data-original-title' );

		}
	}

	function globalSettingsChanged( key )
	{
		if( !key || key === 'module.cardsPrioritization.color.critical' )
			$b.style.setProperty(
				'--strelloids-card-priority-critical',
				strelloids.modules.settings.getGlobal( 'module.cardsPrioritization.color.critical' )
			);
		if( !key || key === 'module.cardsPrioritization.color.high' )
			$b.style.setProperty(
				'--strelloids-card-priority-high',
				strelloids.modules.settings.getGlobal( 'module.cardsPrioritization.color.high' )
			);
		if( !key || key === 'module.cardsPrioritization.color.medium' )
			$b.style.setProperty(
				'--strelloids-card-priority-medium',
				strelloids.modules.settings.getGlobal( 'module.cardsPrioritization.color.medium' )
			);
		if( !key || key === 'module.cardsPrioritization.color.low' )
			$b.style.setProperty(
				'--strelloids-card-priority-low',
				strelloids.modules.settings.getGlobal( 'module.cardsPrioritization.color.low' )
			);
		if( !key || key === 'module.cardsPrioritization.color.lowest' )
			$b.style.setProperty(
				'--strelloids-card-priority-lowest',
				strelloids.modules.settings.getGlobal( 'module.cardsPrioritization.color.lowest' )
			);
	}

	/**
	 * @param {HTMLElement} card
	 */
	function clearPriority( card )
	{
		card.classList.remove( 'priority-set', 'priority-critical', 'priority-high', 'priority-medium', 'priority-low', 'priority-lowest' );
	}

	/**
	 * @param {HTMLElement} card_title
	 * @param {int} priority
	 */
	function setPriority( card_title, priority )
	{
		var card = closest( card_title, '.list-card' );
		clearPriority( card );
		card.classList.add( 'priority-set' );

		if( priority === 1 )
			card.classList.add( 'priority-critical' );
		else if( priority === 2 )
			card.classList.add( 'priority-high' );
		else if( priority === 3 )
			card.classList.add( 'priority-medium' );
		else if( priority === 4 )
			card.classList.add( 'priority-low' );
		else if( priority === 5 )
			card.classList.add( 'priority-lowest' );
	}

	function cardEditOpened()
	{
		if(	!self.isEnabled() )
			return;

		var ui_container = $('.card-detail-data');

		if( !$_( 'cards-prioritization-select' ) && ui_container)
		{
			var select = createNode( 'select', { id: 'cards-prioritization-select' } );
			select.appendChild(
				createNode(
					'option',
					{ value: '' },
					'---'
				)
			);
			select.appendChild(
				createNode(
					'option',
					{ value: '1' },
					_( 'Critical', 'module|CardsPrioritization', 'options' )
				)
			);
			select.appendChild(
				createNode(
					'option',
					{ value: '2' },
					_( 'High', 'module|CardsPrioritization', 'options' )
				)
			);
			select.appendChild(
				createNode(
					'option',
					{ value: '3' },
					_( 'Medium', 'module|CardsPrioritization', 'options' )
				)
			);
			select.appendChild(
				createNode(
					'option',
					{ value: '4' },
					_( 'Low', 'module|CardsPrioritization', 'options' )
				)
			);
			select.appendChild(
				createNode(
					'option',
					{ value: '5' },
					_( 'Lowest', 'module|CardsPrioritization', 'options' )
				)
			);
			select.addEventListener( 'change', priorityChangedFromUI );
			var container = createNode( 'div', { 'class': 'card-detail-item' } );
			container.appendChild( createNode( 'h3', { 'class': 'card-detail-item-header' }, _('card_edit_priority') ));
			container.appendChild( select );
			ui_container.prepend( container );
		}
		updatePriorityUI();
	}

	function priorityChangedFromUI()
	{
		var title = $('.mod-card-back-title');
		title.focus();
		if( this.value )
		{
			var matches = title.value.match( tag_regex );
			if( matches )
				title.value = title.value.replace( matches[0], matches[1]+'!' + this.value + matches[3] );
			else
				title.value += ' ' + '!' + this.value;
		}
		else
		{
			var url_matches = window.location.toString().match( /(\/c\/[^\/]+\/)/ );
			if( url_matches )
			{
				var card_in_list = $( '.list-card[href*="' + url_matches[1] + '"]' );
				if( card_in_list )
					clearPriority( card_in_list );
			}
			title.value = title.value.replace( tag_regex, ' ' );
		}
		title.blur();
	}

	function updatePriorityUI()
	{
		var title = $('.mod-card-back-title');
		var matches = tag_regex.exec( title.value );
		if( matches === null )
			$_('cards-prioritization-select').value = '';
		else
			$_('cards-prioritization-select').value = matches[2];
	}

	init();
}