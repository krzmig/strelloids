function switchTab( btn )
{
	$( '.tab-nav button.active' ).classList.remove('active' );
	btn.classList.add( 'active' );

	$( '.tab-content.active' ).classList.remove( 'active' );
	$( btn.getAttribute( 'data-target' )).classList.add( 'active' );
}

function loadOptionsToUI()
{
	var inputs = $$( '[data-toggle=set]' );
	for( var i = inputs.length - 1; i >= 0; --i )
		inputs[i].value = settings.getGlobal( inputs[i].getAttribute( 'data-target' ));

	inputs = $$( '[data-toggle=toggle]' );
	for( i = inputs.length - 1; i >= 0; --i )
		inputs[i].checked = settings.getGlobal( inputs[i].getAttribute( 'data-target' ));

	new ScrumStorySequence();
}

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
		var sequence = settings.getGlobal( settingsName );
		for( var i = 0; i < sequence.length; ++i )
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
		var inputs = $$('#scrum-sequence-buttons input');
		for( var i = 0; i < inputs.length; ++i )
			inputs[i].remove();

		settings.resetGlobal( settingsName );
		loadSequenceFromSettings();
	}

	init();
}

// tab switcher
$b.addEventListener(
	'click',
	function( e )
	{
		if( e.target.getAttribute( 'data-toggle' ) === 'tab' )
			switchTab( e.target );
		else if( e.target.getAttribute( 'data-toggle' ) === 'reset' )
		{
			settings.resetGlobal( e.target.getAttribute( 'data-target' ) );
			loadOptionsToUI();
		}
	}
);

$b.addEventListener(
	'change',
	function( e )
	{
		if( e.target.getAttribute( 'data-toggle' ) === 'set' )
			settings.setGlobal( e.target.getAttribute( 'data-target' ), e.target.value );
		else if( e.target.getAttribute( 'data-toggle' ) === 'toggle' )
			settings.setGlobal( e.target.getAttribute( 'data-target' ), e.target.checked );
	}
);

var settings = new Settings( loadOptionsToUI );