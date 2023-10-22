/**
 * Module will replace tags inside cards titles with colored labels.
 * Tags must be inside square brackets and must contain at least one letter, space, underscore or dash.
 * Tags colors is depends on content inside brackets, and not case.
 * @param {Strelloids} strelloids
 * @constructor
 */
function ModuleCustomTags( strelloids )
{
	let self = this;
	let settingName = 'customTags';
	let tag_regex = /\[([^\]]*[a-z_ -][^\]]*)]/ig;

	function init()
	{
		strelloids.modules.events.add( 'onUpdate', update );
		strelloids.modules.events.add( 'onSettingsLoaded', boardSettingsChanged );
		strelloids.modules.events.add( 'onBoardSettingsChange', boardSettingsChanged );
		strelloids.modules.events.add( 'onCardEditOpened', UI.init );
		strelloids.modules.events.add( 'onCardTitleChanged', UI.cardTitleChanged );
	}

	function update()
	{
		if(	!self.isEnabled() )
			return;

		let text_node = null;

		$$('[data-testid="card-name"]').forEach(( card_title ) => {
			text_node = findTextNode( card_title );

			if( !text_node )
				return;

			if( !card_title.dataset.originalTitle )
				card_title.dataset.originalTitle = text_node.nodeValue;

			if( !tag_regex.test( text_node.nodeValue ))
				return;

			removeOldTags( card_title );
			appendNewTags( card_title, text_node );

			text_node.nodeValue = text_node.nodeValue.replace( tag_regex, '' ).replace( /^\s+/, '' ).replace( /\s+$/, '' );
		})
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

		$$('[data-testid="card-name"]').forEach(( card_title ) => {
			let text_node = findTextNode( card_title );

			if( !text_node )
				return;

			removeOldTags( card_title );

			if( card_title.dataset.originalTitle )
				text_node.nodeValue = card_title.dataset.originalTitle;
		});
	}

	/**
	 * @param {HTMLElement} element
	 */
	function removeOldTags( element )
	{
		element.querySelectorAll( '.card-tag' ).forEach(( node ) => {
			node.remove();
		});
	}

	/**
	 * @param {HTMLElement} card_title
	 * @param {HTMLElement} title
	 */
	function appendNewTags( card_title, title )
	{
		tag_regex.lastIndex = 0;

		let matches;
		while(( matches = tag_regex.exec( title.nodeValue ) ) !== null )
		{
			let tag = createNode(
				'span',
				{ class: [ 'card-tag' ] },
				matches[1]
			);
			tag.style.backgroundColor = determinateTagColor( matches[1] );
			card_title.insertBefore( tag, title );
		}
	}

	/**
	 * @param {string} tag
	 * @return {string}
	 */
	function determinateTagColor( tag )
	{
		let chars = tag.split('').map( function( a ){ return a.charCodeAt( 0 ) });
		let i, h;
		
		for( i = 0, h = 0x1e7244ca; i < tag.length; i++)
			h = Math.imul( h ^ tag.charCodeAt(i), 1852095058 );
		h = (( h ^ h >>> 16 ) >>> 0 ) % 360;

		let s = 0;
		for( i = chars.length - 1; i >= 0; i = i - 2 )
			s += chars[i]* i;
		s = h % 20;

		let l = 0;
		for( i = chars.length - 2; i >= 0; i = i - 2 )
			l += chars[i] * i;
		l = h % 30;
		
		if( document.documentElement.dataset.colorMode === 'dark' )
			return 'hsl(' + h + ',' + ( 35 + s ) + '%,' + ( 10 + l ) + '%)';
		else
			return 'hsl(' + h + ',' + ( 65 + s ) + '%,' + ( 55 + l ) + '%)';
	}

	let UI = {
		init: function()
		{
			if(	!self.isEnabled() )
				return;

			let ui_container = $('.card-detail-data');
			if( $( '.custom-tags-ui' ) || !ui_container)
				return;

			let title = $('textarea.mod-card-back-title');
			let container = createNode( 'div', { 'class': ['card-detail-item', 'custom-tags-ui'] } );
			container.appendChild(createNode(
				'h3',
				{ 'class': 'card-detail-item-header' },
				' ' + _( 'card_edit_customTags' )
			));
			let add_btn = createNode( 'a', { 'class': [ 'card-detail-item-add-button', 'dark-hover' ] });
			add_btn.appendChild( createNode( 'span', { 'class': [ 'icon-sm', 'icon-add' ]}));
			add_btn.addEventListener( 'click', UI.appendNewInput );
			container.appendChild( add_btn );
			UI.appendInputs( container, title.value );
			ui_container.prepend( container );
		},
		/**
		 * @param {HTMLElement} container
		 * @param {string} title
		 */
		appendInputs: function( container, title )
		{
			tag_regex.lastIndex = 0;

			let matches;
			while(( matches = tag_regex.exec( title ) ) !== null )
				UI.appendInput( container, matches[1] );
		},

		appendInput: function( container, content )
		{
			let tag = createNode(
				'input',
				{ name: 'custom-tag-input', 'data-value': content, value: content }
			);
			tag.style.backgroundColor = determinateTagColor( content );
			tag.style.width = ( 0.6 * content.length ) + 'em';
			tag.addEventListener( 'input', UI.inputUpdated, true );
			tag.addEventListener( 'change', UI.inputChanged, true );
			tag.addEventListener( 'blur', UI.inputBlur, true );
			container.insertBefore( tag, container.lastChild );
			return tag;
		},

		appendNewInput: function()
		{
			let tag = UI.appendInput( $('.custom-tags-ui'), '' );
			setTimeout( function(){ tag.focus() }, 100 );
		},

		inputUpdated: function()
		{
			this.style.width = ( 0.6 * this.value.length ) + 'em';
			this.style.backgroundColor = determinateTagColor( this.value );
		},

		inputChanged: function()
		{
			let title = $('textarea.mod-card-back-title');
			let old_tag = this.getAttribute( 'data-value' );
			title.focus();
			if( old_tag )
				title.value = title.value.replace(
					'[' + old_tag + ']',
					this.value ? '[' + this.value + ']' : ''
				);
			else if( this.value )
				title.value = '[' + this.value + ']' + title.value;

			this.setAttribute( 'data-value', this.value );

			title.blur();
		},

		inputBlur: function(  )
		{
			if( !this.value )
				this.remove();
		},

		cardTitleChanged: function( e )
		{
			let container = $('.custom-tags-ui');
			for( let i = container.children.length - 1; i >= 0; --i )
				if( container.children[i].tagName === 'INPUT' )
					container.children[i].remove();

			UI.appendInputs( container, e.target.value );
		}
	};

	init();
}