lang.setDomain( 'options' );
lang.htmlTranslation();

function switchTab( btn )
{
	$( '.tab-nav button.active' ).classList.remove('active' );
	btn.classList.add( 'active' );

	$( '.tab-content.active' ).classList.remove( 'active' );
	$( btn.getAttribute( 'data-target' )).classList.add( 'active' );
}

function loadOptionsToUI()
{
	$$( '[data-toggle=set]' ).forEach(( input ) => {
		input.value = settings.getGlobal( input.dataset.target );
		if( input.classList.contains( 'color' ))
			input.dispatchEvent( new CustomEvent( 'reset' ));
	});

	$$( '[data-toggle=toggle]' ).forEach(( input ) => {
		input.checked = settings.getGlobal( input.dataset.target );
	});

	new ScrumStorySequence();
	new ColoredListsScheme();

	$$( 'input.color' ).forEach(( input ) => {
		new ColorPicker( input );
		
	});
}

// tab switcher
$b.addEventListener(
	'click',
	function( e )
	{
		if( e.target.dataset.toggle === 'tab' )
			switchTab( e.target );
		else if( e.target.dataset.toggle === 'reset' )
		{
			settings.resetGlobal( e.target.dataset.target );
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