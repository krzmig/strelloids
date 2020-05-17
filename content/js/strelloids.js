'use strict';

var DEBUG = false;

/**
 * Main plugin class.
 * @constructor
 */
function Strelloids()
{
	var self = this;
	var runTimeout = null;
	var delayTimeout = null;
	self.modules = {};

	function init()
	{
		if( DEBUG )
			$log( 'Strelloids: initialized' );

		self.modules.events = new ModuleEvents( self );
		self.modules.settings = new ModuleSettings( self );

		// lists
		self.modules.toggleLists = new ModuleToggleLists( self );
		self.modules.showCardsCounter = new ModuleShowCardsCounter( self );
		self.modules.displayMode = new ModuleDisplayMode( self );
		// cards
		self.modules.showCardShortId = new ModuleShowCardShortId( self );
		self.modules.customTags = new ModuleCustomTags( self );
		self.modules.cardsSeparator = new ModuleCardsSeparator( self );
		self.modules.cardsPrioritization = new ModuleCardsPrioritization( self );
		// scrum
		self.modules.coloredLists = new ModuleColoredLists( self );
		self.modules.scrumTimes = new ModuleScrumTimes( self );
		self.modules.scrumSumTimes = new ModuleScrumSumTimes( self );
		// card editing
		self.modules.tabKeyInTextarea = new ModuleTabKeyInTextarea( self );
		// other
		self.modules.boardScroll = new ModuleBoardScroll( self );
		self.modules.markdowChecklist = new ModuleMarkdownChecklist( self );
		self.modules.markdowTable = new ModuleMarkdownTable( self );

		self.modules.events.add( 'onSettingsLoaded', self.run );
	}

	this.run = function()
	{
		clearTimeout( delayTimeout );
		clearTimeout( runTimeout );
		delayTimeout = setTimeout( doLoop, 100 );
		runTimeout = setTimeout(
			self.run,
			Math.max( 300, parseFloat( self.modules.settings.getGlobal( 'global.loopInterval' ) ) * 1000 )
		);
	};

	function doLoop()
	{
		if( DEBUG )
			var t0 = performance.now();

		self.modules.events.trigger( 'onUpdate' );

		if( DEBUG )
			$dbg( "Strelloids: loop took " + (performance.now() - t0) + " milliseconds." )
	}

	init();
}


if( !window.strelloidsInited )
	new Strelloids();

window.strelloidsInited = true;