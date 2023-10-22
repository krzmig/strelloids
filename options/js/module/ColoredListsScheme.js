function ColoredListsScheme()
{
	let settingsName = 'module.coloredLists.scheme';

	function init()
	{
		loadSchemeFromSettings();
	}

	function loadSchemeFromSettings()
	{
		let container = $_('colored-lists-scheme');
		while( container.lastChild )
			container.lastChild.remove();

		let scheme = settings.getGlobal( settingsName );
		for( let i = 0, l = scheme.length; i < l; ++i )
			appendRow( scheme[i] );

		appendRow();
	}

	/**
	 * @param {object} [scheme]
	 */
	function appendRow( scheme )
	{
		let remove_btn = createNode( 'button', { class: 'remove error ml' }, '\u00D7' );
		remove_btn.addEventListener( 'click', removeRow );

		if( typeof scheme === 'undefined' )
		{
			scheme = { pattern: '', color: '#dfe1e6ff', color_dark: '#191b1fff' };
			remove_btn.disabled = true;
		}

		let regex_input = createNode( 'input', { type: 'text', name: 'pattern', value: scheme.pattern, placeholder: 'regex' });
		regex_input.addEventListener( 'input', patternUpdated );
		regex_input.addEventListener( 'change', patternChanged );

		let color_input = createNode( 
			'input',
			{ type: 'text', name: 'color', class: 'color', value: scheme.color },
			null, 
			{ alpha: 1 }
		);
		color_input.addEventListener( 'change', save );
		new ColorPicker( color_input );

		let color_dark_input = createNode(
			'input',
			{ type: 'text', name: 'color_dark', class: 'color', value: scheme.color_dark ?? scheme.color },
			null,
			{ alpha: 1 }
		);
		color_dark_input.addEventListener( 'change', save );
		new ColorPicker( color_dark_input );
		
		$_('colored-lists-scheme').appendChild(
			createNode(
				'div',
				{ class: 'flex scheme-row' },
				[
					createNode(
						'label',
						{ class: 'input-group' },
						[
							createNode( 'span', { class: 'description' }, '/' ),
							regex_input,
							createNode( 'span', { class: 'description' }, '/i' )
						]
					),
					createNode( 'span', { style: 'flex-grow: 1' }),
					createNode(
						'label',
						{ class: 'input-group', title: 'module|ColoredLists|ColorLightMode' },
						[
							createNode( 'span', { class: 'description', style: 'color: var(--main-font);' }, '&#127751;' ),
							color_input
						]
					),
					createNode(
						'label',
						{ class: 'input-group', title: 'module|ColoredLists|ColorDarkMode' },
						[
							createNode( 'span', { class: 'description', style: 'color: var(--main-font);' }, '&#127747;' ),
							color_dark_input
						]
					),
					remove_btn
				]
			)
		);
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
		let last_row = $_('colored-lists-scheme').lastChild;
		let row = this.closest( '.scheme-row' );
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
		let data = [];
		/** @var {HTMLInputElement} */
		let pattern_input, color_input, color_dark_input;
		let rows = $$( '#colored-lists-scheme .scheme-row' );
		for( let i = 0, l = rows.length; i < l; ++i )
		{
			pattern_input = rows[i].querySelector( 'input[name="pattern"]' );
			color_input = rows[i].querySelector( 'input[name="color"]' );
			color_dark_input = rows[i].querySelector( 'input[name="color_dark"]' );

			if( !pattern_input || !color_input || !color_dark_input || !pattern_input.value || !color_input.value || !color_dark_input.value )
				continue;

			if( !pattern_input.checkValidity() || !color_input.checkValidity() || !color_dark_input.checkValidity() )
				return;

			data.push({
				pattern: pattern_input.value,
				color: color_input.value,
				color_dark: color_dark_input.value
			});
		}

		settings.setGlobal( settingsName, data );
	}

	function removeRow()
	{
		this.closest( '.scheme-row' ).remove();
		save();
	}

	init();
}