function ScrumStorySequence()
{
	var settingsName = 'module.scrumTimes.storyPointsSequence';

	function init(  )
	{
		loadSequenceFromSettings();
		$_('resetScrumSequence').addEventListener( 'click', reset );
	}

	function loadSequenceFromSettings(  )
	{
		var inputs = $$('#scrum-sequence-buttons input');
		for( var i = 0; i < inputs.length; ++i )
			inputs[i].remove();

		var sequence = settings.getGlobal( settingsName );
		for( i = 0; i < sequence.length; ++i )
		{
			if( isNaN( sequence[i] ))
				continue;

			appendInput( sequence[i] );
		}
		appendInput( '' );
	}

	function appendInput( value )
	{
		var input = createNode(
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
		var sequence = [];
		var inputs = $$('#scrum-sequence-buttons input');
		for( var i = 0; i < inputs.length; ++i )
			if( inputs[i].value )
				sequence.push( inputs[i].value );
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