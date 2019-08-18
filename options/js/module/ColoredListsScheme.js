function ColoredListsScheme()
{
	var settingsName = 'module.coloredLists.scheme';

	function init()
	{
		loadSchemeFromSettings();
	}

	function loadSchemeFromSettings()
	{
		var container = $_('colored-lists-scheme');
		while( container.lastChild )
			container.lastChild.remove();

		var scheme = settings.getGlobal( settingsName );
		for( var i = 0, l = scheme.length; i < l; ++i )
			appendRow( scheme[i] );

		appendRow();
	}

	/**
	 * @param {object} [scheme]
	 */
	function appendRow( scheme )
	{
		var remove_btn = createNode( 'button', { 'class': 'remove ml' }, '\u00D7' );
		remove_btn.addEventListener( 'click', removeRow );

		if( typeof scheme === 'undefined' )
		{
			scheme = { pattern: '', color: '#dfe1e6ff' };
			remove_btn.disabled = true;
		}

		var regex_input = createNode( 'input', { type: 'text', name: 'pattern', value: scheme.pattern, placeholder: 'regex' });
		regex_input.addEventListener( 'input', patternUpdated );
		regex_input.addEventListener( 'change', patternChanged );

		var color_input = createNode( 'input', { type: 'text', name: 'color', 'class': 'color', value: scheme.color, 'data-alpha': 1 });
		color_input.addEventListener( 'change', save );
		new ColorPicker( color_input );

		var transparent = createNode( 'div', { 'class': 'bg-transparent' });
		transparent.appendChild( color_input );

		var group = createNode( 'label', { 'class': 'input-group' } );
		group.appendChild( createNode( 'span', { 'class': 'description' }, '/' ));
		group.appendChild( regex_input );
		group.appendChild( createNode( 'span', { 'class': 'description' }, '/i' ));

		var row = createNode( 'div', { 'class': 'flex scheme-row' });
		row.appendChild( group );
		row.appendChild( createNode( 'span', { style: 'flex-grow: 1' }));
		row.appendChild( transparent );
		row.appendChild( remove_btn );

		$_('colored-lists-scheme').appendChild( row );
	}

	function patternUpdated()
	{
		this.setCustomValidity( '' );
		try {
			new RegExp( this.value );
		} catch( e ) {
			this.setCustomValidity( 'Regex is invalid' );
		}
	}

	function patternChanged()
	{
		var last_row = $_('colored-lists-scheme').lastChild;
		var row = closest( this, '.scheme-row' );
		if( !this.value && last_row !== row )
			row.remove();
		else if( this.value && last_row === row )
		{
			row.querySelector( 'button.remove' ).disabled = false;
			appendRow();
		}

		save();
	}

	function save()
	{
		var data = [];
		/** @var {HTMLInputElement} */
		var pattern_input, color_input;
		var rows = $$( '#colored-lists-scheme .scheme-row' );
		for( var i = 0, l = rows.length; i < l; ++i )
		{
			pattern_input = rows[i].querySelector( 'input[name=pattern]' );
			color_input = rows[i].querySelector( 'input[name=color]' );

			if( !pattern_input || !color_input || !pattern_input.value || !color_input.value )
				continue;

			if( !pattern_input.checkValidity() || !color_input.checkValidity() )
				return;

			data.push({
				pattern: pattern_input.value,
				color: color_input.value
			});
		}

		settings.setGlobal( settingsName, data );
	}

	function removeRow()
	{
		closest( this, '.scheme-row' ).remove();
		save();
	}

	init();
}