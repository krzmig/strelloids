/**
 * Module display colored border of cards, based on keywords in card title like: !1 !2 !3 !4 or !5, where !1 is the
 * highest.
 * @param {Strelloids} strelloids
 * @constructor
 */
function ModuleCardsPrioritization( strelloids )
{
	let self = this;
	let settingName = 'cardsPrioritization';
	let tag_regex = /(^|\s)!([1-5])($|\s)/i;

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

		$$('[data-testid="trello-card"] [data-testid="card-name"]').forEach(( card_title ) => {
			let text_node = findTextNode( card_title );

			if( !text_node )
				return;

			if( !card_title.dataset.originalTitle )
				card_title.dataset.originalTitle = text_node.nodeValue;

			let matches;
			if(( matches = tag_regex.exec( text_node.nodeValue )) === null )
				return;

			setPriority( card_title.closest( '[data-testid="trello-card"]' ), parseInt( matches[2] ));

			text_node.nodeValue = text_node.nodeValue.replace( tag_regex, ' ' ).replace( /^\s+/, '' ).replace( /\s+$/, '' );
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

		$$('.priority-set[data-testid="trello-card"]').forEach(( card ) => {
			let card_title = card.querySelector( '[data-testid="card-name"]' );
			let text_node = findTextNode( card_title );

			if( !text_node )
				return;

			clearPriority( card );

			if( card_title.dataset.originalTitle )
				text_node.nodeValue = card_title.dataset.originalTitle;
		});
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
		let card = card_title.closest( '[data-testid="trello-card"]' );
		if( card )
		{
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
	}

	function cardEditOpened()
	{
		if(	!self.isEnabled() )
			return;

		let ui_container = $('.card-detail-data');

		if( !$_( 'cards-prioritization-select' ) && ui_container)
		{
			let select = createNode( 'select', { id: 'cards-prioritization-select' } );
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
			let container = createNode( 'div', { 'class': 'card-detail-item' } );
			container.appendChild( createNode( 'h3', { 'class': 'card-detail-item-header' }, _('card_edit_priority') ));
			container.appendChild( select );
			ui_container.prepend( container );
		}
		updatePriorityUI();
	}

	function priorityChangedFromUI()
	{
		let title = $('.mod-card-back-title');
		title.focus();
		if( this.value )
		{
			let matches = title.value.match( tag_regex );
			if( matches )
				title.value = title.value.replace( matches[0], matches[1]+'!' + this.value + matches[3] );
			else
				title.value += ' ' + '!' + this.value;
		}
		else
		{
			let url_matches = window.location.toString().match( /(\/c\/[^\/]+\/)/ );
			if( url_matches )
			{
				let card_in_list = $( '[data-testid="card-name"][href*="' + url_matches[1] + '"]' );
				if( card_in_list )
					clearPriority( card_in_list );
			}
			title.value = title.value.replace( tag_regex, ' ' );
		}
		title.blur();
	}

	function updatePriorityUI()
	{
		let title = $('.mod-card-back-title');
		if( !title )
			return;

		let matches = tag_regex.exec( title.value );
		if( matches === null )
			$_('cards-prioritization-select').value = '';
		else
			$_('cards-prioritization-select').value = matches[2];
	}

	init();
}