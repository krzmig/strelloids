function ScrumStorySequence()
{
	const settingsName = 'module.scrumTimes.storyPointsSequence';

	function init(  )
	{
		loadSequenceFromSettings();
		$_('resetScrumSequence').addEventListener( 'click', reset );
	}

	function loadSequenceFromSettings(  )
	{
		$$( '#scrum-sequence-buttons input' ).forEach(( input ) => {
			input.remove();
		});

		const sequence = settings.getGlobal( settingsName );
		for( let i = 0; i < sequence.length; ++i )
		{
			if( isNaN( sequence[i] ))
				continue;

			appendInput( sequence[i] );
		}
		appendInput( '' );
	}

	function appendInput( value )
	{
		const input = createNode(
			'input',
			{ value: value, type: 'number', min: 0, step: 0.1 }
		);
		input.addEventListener( 'change', inputChanged );
		input.addEventListener( 'input', inputUpdated );
		$_('scrum-sequence-buttons').appendChild( input );
	}

	function inputUpdated(  )
	{
		if( this.value && $_('scrum-sequence-buttons').lastChild === this )
			appendInput( '' );
	}

	function inputChanged(  )
	{
		if( !this.value && $_('scrum-sequence-buttons').lastChild !== this )
			this.remove();

		save();

	}

	function save()
	{
		const sequence = [];
		$$('#scrum-sequence-buttons input').forEach(( input ) => {
			if( input.value )
				sequence.push( input.value );
		});
		sequence.push( '?' );
		settings.setGlobal( settingsName, sequence );
	}

	function reset(  )
	{
		settings.resetGlobal( settingsName );
		loadSequenceFromSettings();
	}

	init();
}