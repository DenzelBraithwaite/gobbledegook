<script>
    // Hooks
    import { onMount } from 'svelte';

    // Custom components
    import Button from './Button.svelte';
    import GGCard from '../lib/Card.svelte';

    // Decks that are used during the game
    const humanDeck = [
        'emperor',
        'commander',
        'commander',
        'assassin',
        'assassin',
        'assassin',
        'knight',
        'knight',
        'knight',
        'knight',
        'soldier',
        'soldier',
        'soldier',
        'soldier',
        'scout',
        'scout',
        'scout',
        'scout',
        'scout',
        'villager',
        'villager',
        'villager',
        'villager',
        'villager',
        'villager'
    ];

    const goblinDeck = [
        'goblinLord',
        'giant',
        'giant',
        'troll',
        'troll',
        'troll',
        'shaman',
        'shaman',
        'shaman',
        'shaman',
        'thief',
        'thief',
        'thief',
        'thief',
        'hobgoblin',
        'hobgoblin',
        'hobgoblin',
        'hobgoblin',
        'bokoblin',
        'bokoblin',
        'bokoblin',
        'bokoblin',
        'bokoblin',
        'bokoblin'
    ];

    const elfDeck = [
        'elfKing',
        'elfChampion',
        'elfChampion',
        'darkElf',
        'darkElf',
        'darkElf',
        'forestDweller',
        'forestDweller',
        'forestDweller',
        'nadallen',
        'nadallen',
        'nelladan',
        'nelladan',
        'nelladan',
        'nelladan',
        'woodElf',
        'woodElf',
        'woodElf',
        'woodElf',
        'wildElf',
        'wildElf',
        'wildElf',
        'wildElf',
        'bard',
        'bard',
        'bard',
        'bard'
    ];

    const dwarfDeck = [
        'longbeardLeader',
        'dwarfCommander',
        'dwarfCommander',
        'alchemist',
        'alchemist',
        'dwarfWarrior',
        'dwarfWarrior',
        'hunter',
        'hunter',
        'hunter',
        'miner',
        'miner',
        'miner',
        'blacksmith',
        'blacksmith',
        'traveller',
        'traveller',
        'bartender',
        'bartender',
        'hobbit',
        'hobbit'
    ];
    
    const botDeck = [
        'crusher541A57',
        'ai',
        'ai',
        'faeBot',
        'faeBot',
        'faeBot',
        'sawBot3000',
        'sawBot3000',
        'sawBot3000',
        'sawBot3000',
        'infernoBot',
        'infernoBot',
        'infernoBot',
        'infernoBot',
        'incubator',
        'incubator',
        'incubator',
        'incubator',
        'incubator',
        'virus',
        'virus',
        'virus',
        'virus',
        'virus',
        'virus',
        'virus'
    ]; 
    
    const beastDeck = [
        'dreamDestroyer',
        'rhino',
        'rhino',
        'rhino',
        'bear',
        'bear',
        'bear',
        'lion',
        'lion',
        'lion',
        'lion',
        'panther',
        'panther',
        'panther',
        'panther',
        'wolf',
        'wolf',
        'wolf',
        'wolf',
        'fox',
        'fox',
        'fox',
        'fox',
        'dog',
        'dog',
        'dog',
        'dog'
    ];

    // Stores all info about every card
    const cardDetails = {
        // Humans
        emperor: {
            title: 'emperor',
            displayTitle: 'Emperor',
            points: 10,
            amount: 1,
            rank: 'legendary',
            trait: 'No discrimination, your hand will mix with all races.',
            description: '',
            race: 'human',
            image: '/public/humans/emperor.gif'
        },
        commander: {
            title: 'commander',
            displayTitle: 'Commander',
            points: 8,
            amount: 2,
            rank: 'epic',
            trait: '',
            description: '',
            race: 'human',
            image: 'public/humans/commander.png'
        },
        assassin: {
            title: 'assassin',
            displayTitle: 'Assassin',
            points: 5,
            amount: 3,
            rank: 'amazing',
            trait: '',
            description: '',
            race: 'human',
            image: 'public/humans/assassin.png'
        },
        knight: {
            title: 'knight',
            displayTitle: 'Knight',
            points: 3,
            amount: 4,
            rank: 'good',
            trait: '',
            description: '',
            race: 'human',
            image: 'public/humans/knight.png'
        },
        soldier: {
            title: 'soldier',
            displayTitle: 'Soldier',
            points: 2,
            amount: 4,
            rank: 'good',
            trait: '',
            description: '',
            race: 'human',
            image: 'public/humans/soldier.png'
        },
        scout: {
            title: 'scout',
            displayTitle: 'Scout',
            points: 1,
            amount: 5,
            rank: 'basic',
            trait: '',
            description: '',
            race: 'human',
            image: 'public/humans/scout.png'
        },
        villager: {
            title: 'villager',
            displayTitle: 'Villager',
            points: 1,
            amount: 6,
            rank: 'basic',
            trait: '',
            description: '',
            race: 'human',
            image: 'public/humans/villager.png'
        },

        // Goblins
        goblinLord: {
            title: 'goblinLord',
            displayTitle: 'Goblin Lord',
            points: 10,
            amount: 1,
            rank: 'legendary',
            trait: 'Instant win with full goblin hand + goblin lord. Exception: enemy has Elf hand with Elf king, then draw.',
            description: '',
            race: 'goblin',
            image: '/public/goblins/goblin-lord.gif'
        },
        giant: {
            title: 'giant',
            displayTitle: 'Giant',
            points: 8,
            amount: 2,
            rank: 'epic',
            trait: '',
            description: '',
            race: 'goblin',
            image: '/public/goblins/giant.png'
        },
        troll: {
            title: 'troll',
            displayTitle: 'Troll',
            points: 5,
            amount: 3,
            rank: 'amazing',
            trait: '',
            description: '',
            race: 'goblin',
            image: '/public/goblins/troll.png'
        },
        shaman: {
            title: 'shaman',
            displayTitle: 'Shaman',
            points: 3,
            amount: 4,
            rank: 'great',
            trait: '',
            description: '',
            race: 'goblin',
            image: '/public/goblins/shaman.png'
        },
        thief: {
            title: 'thief',
            displayTitle: 'Thief',
            points: 2,
            amount: 4,
            rank: 'good',
            trait: '',
            description: '',
            race: 'goblin',
            image: '/public/goblins/thief.png'
        },
        hobgoblin: {
            title: 'hobgoblin',
            displayTitle: 'Hobgoblin',
            points: 1,
            amount: 4,
            rank: 'good',
            trait: '',
            description: '',
            race: 'goblin',
            image: '/public/goblins/hobgoblin.png'
        },
        bokoblin: {
            title: 'bokoblin',
            displayTitle: 'Bokoblin',
            points: 1,
            amount: 6,
            rank: 'basic',
            trait: '',
            description: '',
            race: 'goblin',
            image: '/public/goblins/bokoblin.png'
        },

        // Elves
        elfKing: {
            title: 'elfKing',
            displayTitle: 'Elf King',
            points: 10,
            amount: 1,
            rank: 'legendary',
            trait: '',
            description: '',
            race: 'elf',
            image: '/public/elves/elf-king.gif'
        },
        elfChampion: {
            title: 'elfChampion',
            displayTitle: 'Elf Champion',
            points: 8,
            amount: 2,
            rank: 'epic',
            trait: '',
            description: '',
            race: 'elf',
            image: '/public/elves/champion.png'
        },
        darkElf: {
            title: 'darkElf',
            displayTitle: 'Dark Elf',
            points: 5,
            amount: 3,
            rank: 'amazing',
            trait: '',
            description: '',
            race: 'elf',
            image: '/public/elves/dark-elf.png'
        },
        forestDweller: {
            title: 'forestDweller',
            displayTitle: 'Forest Dweller',
            points: 5,
            amount: 3,
            rank: 'amazing',
            trait: '',
            description: '',
            race: 'elf',
            image: '/public/elves/forest-dweller.png'
        },
        nadallen: {
            title: 'nadallen',
            displayTitle: 'Nadallen',
            points: 3,
            amount: 2,
            rank: 'great',
            trait: '',
            description: '',
            race: 'elf',
            image: '/public/elves/nadallen.png'
        },
        nelladan: {
            title: 'nelladan',
            displayTitle: 'Nelladan',
            points: 2,
            amount: 4,
            rank: 'good',
            trait: '',
            description: '',
            race: 'elf',
            image: '/public/elves/nelladan.png'
        },
        woodElf: {
            title: 'woodElf',
            displayTitle: 'Wood Elf',
            points: 2,
            amount: 4,
            rank: 'good',
            trait: '',
            description: '',
            race: 'elf',
            image: '/public/elves/wood-elf.png'
        },
        wildElf: {
            title: 'wildElf',
            displayTitle: 'Wild Elf',
            points: 2,
            amount: 4,
            rank: 'good',
            trait: '',
            description: '',
            race: 'elf',
            image: '/public/elves/wild-elf.png'
        },
        bard: {
            title: 'bard',
            displayTitle: 'Bard',
            points: 1,
            amount: 4,
            rank: 'basic',
            trait: '',
            description: '',
            race: 'elf',
            image: '/public/elves/bard.png'
        },

        // Dwarves
        longbeardLeader: {
            title: 'longbeardLeader',
            displayTitle: 'Longbeard Leader',
            points: 10,
            amount: 1,
            rank: 'legendary',
            trait: '',
            description: '',
            race: 'dwarf',
            image: '/public/dwarves/longbeard-leader.gif'
        },
        dwarfCommander:  {
            title: 'dwarfCommander',
            displayTitle: 'Dwarf Commander',
            points: 8,
            amount: 2,
            rank: 'epic',
            trait: '',
            description: '',
            race: 'dwarf',
            image: '/public/dwarves/dwarf-commander.png'
        },
        alchemist: {
            title: 'alchemist',
            displayTitle: 'Alchemist',
            points: 5,
            amount: 2,
            rank: 'amazing',
            trait: '',
            description: '',
            race: 'dwarf',
            image: '/public/dwarves/alchemist.png'
        },
        dwarfWarrior: {
            title: 'dwarfWarrior',
            displayTitle: 'Dwarf Warrior',
            points: 5,
            amount: 3,
            rank: 'amazing',
            trait: '',
            description: '',
            race: 'dwarf',
            image: '/public/dwarves/warrior.png'
        },
        hunter: {
            title: 'hunter',
            displayTitle: 'Hunter',
            points: 3,
            amount: 3,
            rank: 'great',
            trait: '',
            description: '',
            race: 'dwarf',
            image: '/public/dwarves/hunter.png'
        },
        miner: {
            title: 'miner',
            displayTitle: 'Miner',
            points: 2,
            amount: 3,
            rank: 'good',
            trait: '',
            description: '',
            race: 'dwarf',
            image: '/public/dwarves/miner.png'
        },
        blacksmith: {
            title: 'blacksmith',
            displayTitle: 'Blacksmith',
            points: 2,
            amount: 3,
            rank: 'good',
            trait: '',
            description: '',
            race: 'dwarf',
            image: '/public/dwarves/blacksmith.png'
        },
        traveller: {
            title: 'traveller',
            displayTitle: 'Traveller',
            points: 2,
            amount: 4,
            rank: 'good',
            trait: '',
            description: '',
            race: 'dwarf',
            image: '/public/dwarves/traveller.png'
        },
        bartender: {
            title: 'bartender',
            displayTitle: 'Bartender',
            points: 1,
            amount: 4,
            rank: 'basic',
            trait: '',
            description: '',
            race: 'dwarf',
            image: '/public/dwarves/bartender.png'
        },
        hobbit: {
            title: 'hobbit',
            displayTitle: 'Hobbit',
            points: 1,
            amount: 4,
            rank: 'basic',
            trait: '',
            description: '',
            race: 'dwarf',
            image: '/public/dwarves/hobbit.png'
        },

        // Bots
        crusher541A57: {
            title: 'crusher541A57',
            displayTitle: 'Crusher 541-A-57',
            points: 10,
            amount: 1,
            rank: 'legendary',
            trait: '',
            description: '',
            race: 'bot',
            image: '/public/bots/crusher-5A1A-57.gif'
        },
        ai: {
            title: 'ai',
            displayTitle: 'A.I.',
            points: 8,
            amount: 2,
            rank: 'epic',
            trait: '',
            description: '',
            race: 'bot',
            image: '/public/bots/ai.png'
        },
        faeBot: {
            title: 'faeBot',
            displayTitle: 'Fae Bot',
            points: 5,
            amount: 3,
            rank: 'amazing',
            trait: '',
            description: '',
            race: 'bot',
            image: '/public/bots/fae-bot.png'
        },
        sawBot3000: {
            title: 'sawBot3000',
            displayTitle: 'Sawbot-3000',
            points: 3,
            amount: 4,
            rank: 'great',
            trait: '',
            description: '',
            race: 'bot',
            image: '/public/bots/saw-bot-3000.png'
        },
        infernoBot: {
            title: 'infernoBot',
            displayTitle: 'Inferno Bot',
            points: 3,
            amount: 4,
            rank: 'great',
            trait: '',
            description: '',
            race: 'bot',
            image: '/public/bots/inferno-bot.png'
        },
        incubator: {
            title: 'incubator',
            displayTitle: 'Incubator',
            points: 2,
            amount: 5,
            rank: 'good',
            trait: '',
            description: '',
            race: 'bot',
            image: '/public/bots/incubator.png'
        },
        virus: {
            title: 'virus',
            displayTitle: 'Virus',
            points: 1,
            amount: 7,
            rank: 'basic',
            trait: '',
            description: '',
            race: 'bot',
            image: '/public/bots/virus.png'
        },

        // Beasts
        dreamDestroyer: { 
            title: 'dreamDestroyer',
            displayTitle: 'Dream Destroyer',
            points: 10,
            amount: 1,
            rank: 'legendary',
            trait: '',
            description: '',
            race: 'beast',
            image: '/public/beasts/dream-destroyer.gif'
        },
        rhino: {
            title: 'rhino',
            displayTitle: 'Rhinestone',
            points: 5,
            amount: 3,
            rank: 'amazing',
            trait: '',
            description: '',
            race: 'beast',
            image: '/public/beasts/rhino.png'
        },
        bear: {
            title: 'bear',
            displayTitle: 'Theodore Thunderpaws',
            points: 5,
            amount: 3,
            rank: 'amazing',
            trait: '',
            description: '',
            race: 'beast',
            image: '/public/beasts/bear.png'
        },
        lion: {
            title: 'lion',
            displayTitle: 'Savannah Goldenmane',
            points: 3,
            amount: 4,
            rank: 'great',
            trait: '',
            description: '',
            race: 'beast',
            image: '/public/beasts/lion.png'
        },
        panther: {
            title: 'panther',
            displayTitle: 'Panthera Nocturna',
            points: 3,
            amount: 4,
            rank: 'great',
            trait: '',
            description: '',
            race: 'beast',
            image: '/public/beasts/panther.png'
        },
        wolf: {
            title: 'wolf',
            displayTitle: 'Alpha Wolfbane',
            points: 3,
            amount: 4,
            rank: 'great',
            trait: '',
            description: '',
            race: 'beast',
            image: '/public/beasts/wolf.png'
        },
        fox: {
            title: 'fox',
            displayTitle: 'Finn Foxglove',
            points: 2,
            amount: 4,
            rank: 'good',
            trait: '',
            description: '',
            race: 'beast',
            image: '/public/beasts/fox.png'
        },
        dog: {
            title: 'dog',
            displayTitle: 'Pawl Barkington',
            points: 2,
            amount: 4,
            rank: 'good',
            trait: '',
            description: '',
            race: 'beast',
            image: '/public/beasts/dog.png'
        }
    };
    
    // Game logic

    // test without labeleled statement
    $: player1 = {
        title: 'Player 1',
        points: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        turn: false,
        hand: []
    };
    $: player2 = {
        title: 'Player 2',
        points: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        turn: false,
        hand: []
    };
    let gobbledegookDeclared = false;
    let gobbledegookDisabled = false;
    let startBtnDisabled = false;
    let gameOver = true;
    let winMessage = '';
    


    // Deck players draw from, includes all race decks
    const fullDeck = {
    // humans: [...humanDeck],
    goblins: [...goblinDeck],
    elves: [...elfDeck],
    // dwarves: [...dwarfDeck],
    // bots: [...botDeck],
    // beasts: [...beastDeck],
    };

    // array for each deck, humans, goblins, elves and dwarves
    const deckTypes = Object.keys(fullDeck);

    // Ensures player 1 isn't always first to start
    function decideFirstPlayer() {
        const num = Math.ceil(Math.random() * 2);
        if (num === 1) {
            player1.turn = true
            player2.turn = false;
        } else {
            player1.turn = false
            player2.turn = true;
        }
    }

    // Controller logic for game
    function showDeck(allDecks = false) {
        const humanCardsLeft = fullDeck['humans'].length || 0;
        const goblinCardsLeft = fullDeck['goblins'].length || 0;
        const elfCardsLeft = fullDeck['elves'].length || 0;
        const dwarfCardsLeft = fullDeck['dwarves'].length || 0;
        const botCardsLeft = fullDeck['bots'].length || 0;
        const beastCardsLeft = fullDeck['beasts'].length || 0;
        if (allDecks) {
            console.log(`Cards remaining per deck:\n
            Humans: ${humanCardsLeft}\n
            Goblins: ${goblinCardsLeft}\n
            Elves: ${elfCardsLeft}\n
            Dwarves: ${dwarfCardsLeft}\n)
            Bots: ${botCardsLeft}\n)
            Beasts: ${beastCardsLeft}\n`);
        } else {
            const cardsLeft = humanCardsLeft + goblinCardsLeft + elfCardsLeft + dwarfCardsLeft + botCardsLeft + beastCardsLeft;
            console.log(`Cards remaining in deck: ${cardsLeft}`);
        }
    }

    // Changes active player turn
    function changeTurns() {
        player1.turn = !player1.turn;
        player2.turn = !player2.turn;
    }

    // Deals 5 cards to each player at the start of the round
    function dealCards(playerHand) {
        // Clear players hands before drawing cards, keeps reference to array without reassigning.
        playerHand.length = 0;

        for(let counter = 1; counter <= 5; counter++) {
            // Grab random deck 
            let randomNum = Math.floor(Math.random() * deckTypes.length);
            let currentDeck = deckTypes[randomNum];

            // Grab random card from that deck
            randomNum = Math.floor(Math.random() * fullDeck[currentDeck].length);
            const cardDrawn = fullDeck[currentDeck][randomNum];

            const removedCardIndex = fullDeck[currentDeck].indexOf(cardDrawn);
            fullDeck[currentDeck].splice(removedCardIndex, 1);

            // Add to player's hand
            playerHand.push(cardDrawn);
        }
        // Need to reassign for svelte to be reactive
        if (playerHand === player1.hand) {
            player1.hand = [...playerHand];
        } else {
            player2.hand = [...playerHand];
        }
    }

    // Draws and removes 1 random card from the deck
    function drawCard(playerHand) {
        if (gameOver) return;

        // Player can't declare gobbledegook if they drew that turn
        gobbledegookDisabled = true;

        if (playerHand.length > 5) return;
        // Grab random deck 
        let randomNum = Math.floor(Math.random() * deckTypes.length);
        let currentDeck = deckTypes[randomNum];

        // When the last card is drawn, currentDeck becomes undefined. This will catch that
        if (deckTypes.length === 0 && currentDeck === undefined) {
            console.log("No more cards!");
            endGame();
            return;
        };

        // When a smaller race deck runs out, it will be removed here.
        if (fullDeck[currentDeck].length <= 1) {
            // Remove deck from main deck
            const index = deckTypes.indexOf(currentDeck);
            deckTypes.splice(index, 1);
        }

        // Grab random card from that deck
        randomNum = Math.floor(Math.random() * fullDeck[currentDeck].length);
        const cardDrawn = fullDeck[currentDeck][randomNum];

        // const removedCard = fullDeck[currentDeck].find(card => card === cardDrawn);
        const removedCardIndex = fullDeck[currentDeck].indexOf(cardDrawn);
        fullDeck[currentDeck].splice(removedCardIndex, 1);

        // Add to player's hand
        playerHand.push(cardDrawn);

        // Need to reassign for svelte to be reactive
        if (playerHand === player1.hand) {
            player1.hand = [...playerHand];
        } else {
            player2.hand = [...playerHand];
        }
    }

    // Removes card from hand if player hand has over 6 cards
    function discard(card) {
        if (player1.turn) {
            const index = player1.hand.indexOf(card);
            player1.hand.splice(index, 1)
            player1.hand = [...player1.hand];
        } else {
            const index = player2.hand.indexOf(card);
            player2.hand.splice(index, 1)
            player2.hand = [...player2.hand];
        }
        if (gobbledegookDeclared) {
            endGame();
        } else {
            changeTurns();
            gobbledegookDisabled = false;
        }
    };
    
    // Handles player click on card
    function selectCard(event, playerHand) {
        // Gather info about the card, what card was just clicked? Title is most important
        let title = event.detail.title;

        if (playerHand.length > 5) {
            discard(title);
        }
    }

    // Ends current round
    function endGame() {
        player1.turn = true;
        player2.turn = true;
        gameOver = true;
        startBtnDisabled = false;
        gobbledegookDisabled = true;
        console.log('Gobbledegook, Gobbledegook!!! The game is now over, time to tally the points!');
        player1.points = calculateTotalPoints(player1, player2);
        player2.points = calculateTotalPoints(player2, player1);
        determineWinner();
        showDeck();
        showDeck(true);
    }
    
    // Initiaties a new round
    function startGame() {
        player1.points = 0;
        player2.points = 0;
        gameOver = false;
        startBtnDisabled = true;
        gobbledegookDeclared = false;
        gobbledegookDisabled = false;
        winMessage = '';
        fullDeck['humans'] = [...humanDeck];
        fullDeck['goblins'] = [...goblinDeck];
        fullDeck['elves'] = [...elfDeck];
        fullDeck['dwarves'] = [...dwarfDeck];
        fullDeck['bots'] = [...botDeck];
        fullDeck['beasts'] = [...beastDeck];
        dealCards(player1.hand);
        dealCards(player2.hand);
    }

    // End the game
    function gobbledegook() {
        if (gameOver) return;

        if (gobbledegookDeclared) {
            endGame();
        } else {
            console.log('Gobbledegook declared!!');
            changeTurns();
            gobbledegookDeclared = true;
        }
    }

    // Display game results
    function determineWinner() {
        if(player1.points > player2.points) {
            winMessage = `Player 1 is the winner with ${player1.points} points! Player 2 loses with ${player2.points} points...`;
            console.log(`Player 1 is the winner with ${player1.points} points!!!🎉🙌🎆🥂, player 2 loses with ${player2.points} points...`);
        } else if(player2.points > player1.points) {
            winMessage = `Player 2 is the winner with ${player2.points} points!!!🎊🥳🍾, player 1 loses with ${player1.points} points...`;
            console.log(`Player 2 is the winner with ${player2.points} points!!!🎊🥳🍾, player 1 loses with ${player1.points} points...`);
        } else if (player1.points === 500_000 && player2.points === 500_000) {
            winMessage = `It seems neither the goblins nor the elves want to go to war with each other while their leaders are on the field... it's a draw🥷🏽!`;
            console.log(`It seems neither the goblins nor the elves want to go to war with each other while their leaders are on the field... it's a draw🥷🏽!`);

        } else {
            winMessage = `It's a.... draw ? Player 1 had ${player1.points} points and player 2 had ${player2.points} points.😢💔`;
            console.log(`It's a.... draw ? Player 1 had ${player1.points} points and player 2 had ${player2.points} points.😢💔`);
        }
    }

    // Calculates card points by race, doesn't include special traits
    function calculateBasePoints(playerHand) {
        let highestPoints = 0;
        const allPoints = {
            humanPoints: 0,
            goblinPoints: 0,
            elfPoints: 0,
            dwarfPoints: 0,
            botPoints: 0,
            beastPoints: 0
        };

        // calculates points based on race, picks highest points
        playerHand.forEach((card) => {
            const race = cardDetails[card].race;
            switch(race) {
                case 'human':
                    allPoints.humanPoints += cardDetails[card].points;
                    break;

                case 'goblin':
                    allPoints.goblinPoints += cardDetails[card].points;
                    break;

                case 'elf':
                    allPoints.elfPoints += cardDetails[card].points;
                    break;

                case 'dwarf':
                    allPoints.dwarfPoints += cardDetails[card].points;
                    break;

                case 'bot':
                    allPoints.botPoints += cardDetails[card].points;
                    break;

                case 'beast':
                    allPoints.beastPoints += cardDetails[card].points;
                    break;

                default:
                    console.log("Didn't match a race???");
            }

            highestPoints = Math.max(
                allPoints.humanPoints,
                allPoints.goblinPoints,
                allPoints.elfPoints,
                allPoints.dwarfPoints,
                allPoints.botPoints,
                allPoints.beastPoints);
        });
        return highestPoints;
    }

    // Calculates total points (special and base)
    function calculateTotalPoints(player, enemy) {
        let highestPoints = 0;
        let humanPoints = 0;
        let goblinPoints = 0;
        let elfPoints = 0;
        let dwarfPoints = 0;
        let botPoints = 0;
        let beastPoints = 0;

        highestPoints = calculateBasePoints(player.hand);

        if (player.hand.includes('emperor')) {
            humanPoints = calculateEmperor(player);
            console.log('emperor detected');
        }

        if (player.hand.includes('goblinLord')) {
            goblinPoints = calculateGoblinLord(player, enemy);
            console.log('goblinLord detected');
        }

        if (player.hand.includes('elfKing')) {
            goblinPoints = calculateElfKing(player, enemy);
            console.log('elfKing detected');
        }

        highestPoints = Math.max(
            highestPoints,
            humanPoints,
            goblinPoints,
            elfPoints,
            dwarfPoints,
            botPoints,
            beastPoints);

            console.log({
                player: player.title,
                highestPoints: highestPoints,
                humanPoints: humanPoints,
                goblinPoints: goblinPoints,
                elfPoints: elfPoints,
                dwarfPoints: dwarfPoints,
                botPoints: botPoints,
                beastPoints: beastPoints,
            })

        return highestPoints;
    }

    // Adds all card points in hand, regardless of race
    function calculateEmperor(player) {
        let points = 0;
        player.hand.forEach(card => {
            points += cardDetails[card].points;
        });
        return points;
    }

    // Instant win for goblins unless enemy has full elf hand + elf king, if so, then instant draw.
    function calculateGoblinLord(player, enemy) {
        // Checks if player hand has only goblins
            const goblinHand = player.hand.every(card => { 
            return cardDetails[card].race === 'goblin';
        });
        console.log(`from inside calculateGoblinLord, goblinHand = ${goblinHand}`)
        
        // Checks if enemy has only elves
        const enemyFullElf = enemy.hand.every(card => {
            return cardDetails[card].race === 'elf';
        });

        // Checks if enemy has the elf king
        const enemyElfKing = enemy.hand.includes('elfKing');

        if (goblinHand && (enemyFullElf && enemyElfKing)) {
            return 500_000;
        } else if (goblinHand) {
            return 1_000_000;
        } else {
            console.log('inside calculateGoblinLord(), else statement :(');
            return calculateBasePoints(player.hand);
        }
    }

    function calculateElfKing(player, enemy) {
    // Checks if enemy hand has only goblins
        const goblinHand = enemy.hand.every(card => { 
        return cardDetails[card].race === 'goblin';
    });
    console.log(`from inside calculateElfKing, goblinHand = ${goblinHand}`)
    
    // Checks if hand has only elves
    const fullElfHand = player.hand.every(card => {
        return cardDetails[card].race === 'elf';
    });

    // Checks if hand has the elf king
    const elfKing = player.hand.includes('elfKing');

    if (goblinHand && (fullElfHand && elfKing)) {
        return 500_000;
    } else {
        console.log('inside calculateElfKing(), else statement :(');
        return calculateBasePoints(player.hand);
    }
}
</script>

<main>
    {#if winMessage}
    <div class="game-results">
        <p>{winMessage}</p>
    </div>
    {/if}
    {#if !startBtnDisabled}
        <Button on:click={startGame} customClasses="btn__green w-25">Start game</Button>
        <Button on:click={decideFirstPlayer} customClasses="btn__orange w-25">Decide who starts</Button>
    {:else}
        <Button customClasses="btn__green_disabled w-25">Game in progress...</Button>
    {/if}
    <div class="game-board">
        {#if startBtnDisabled}
            <p class="turn-text">{player1.turn ? "Player 1" : "Player 2"}<span>'s turn</span></p>
        {/if}
        <div class="card-section card-section__ally {player1.turn ? "section-active" : ""}">
            <p class="p1-name {player1.turn ? "turn-active" : ""}">Player 1</p>
            {#each player1.hand as cardTitle}
                <GGCard
                    on:cardClick={(event) => selectCard(event, player1.hand)}
                    blur={player1.turn ? false : true}
                    displayTitle={cardDetails[cardTitle].displayTitle}
                    title={cardDetails[cardTitle].title}
                    img={cardDetails[cardTitle].image}
                    trait={cardDetails[cardTitle].trait}
                    race={cardDetails[cardTitle].race}
                    points={cardDetails[cardTitle].points} />
            {/each}
        </div>
        <div class="game-buttons">
            <GGCard on:click={() => {player1.turn ? drawCard(player1.hand) : drawCard(player2.hand)}} faceDown={true} />
                {#if gobbledegookDisabled}
                <Button round={true} customClasses="btn__orange_disabled">Gobbledegook!</Button>
                {:else}
                <Button on:click={gobbledegook} round={true} customClasses="btn__orange">Gobbledegook!</Button>
                {/if}
        </div>
        <div class="card-section card-section__enemy {player2.turn ? "section-active" : ""}">
            <p class="p2-name {player2.turn ? "turn-active" : ""}">Player 2</p>
            {#each player2.hand as cardTitle}
            <GGCard
            on:cardClick={(event) => selectCard(event, player2.hand)}
            blur={player2.turn ? false : true}
            displayTitle={cardDetails[cardTitle].displayTitle}
            title={cardDetails[cardTitle].title}
            img={cardDetails[cardTitle].image}
            trait={cardDetails[cardTitle].trait}
            race={cardDetails[cardTitle].race}
            points={cardDetails[cardTitle].points} />
            {/each}
        </div>
    </div>
</main>


<style>
    .game-results {
        font-size: 1.5rem;
        background-color: #1d1d1d;
        color: #fff;
        border-radius: 0.5rem;
        position: absolute;
        top: 5rem;
        left: 5rem;
        padding: 1rem;
        width: 25rem;
        line-height: 1.5;
        border: 1px solid #af4819;
        z-index: 100;
    }

    .game-board {
        position: relative;
        height: 85dvh;
        width: 90%;
        padding: 0.5rem;
        max-width: 1500px;
        margin: 2rem auto;
        border-radius: 1rem;
        background-color: #200f009d;
        box-shadow: 0 4px 20px #000000;
        border: 2px solid #e4c82e1f;

        display: flex;
        justify-content: center;
        align-items: center;
    }

    .card-section {
        width: 70%;
        padding: 1rem;
        background-color: #e4c82e1f;
        min-height: 270px;

        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1.5rem;
    }

    .card-section__ally {
        border-radius: 1rem 1rem 0 0;
        position: absolute;
        bottom: 0;
        right: 1rem;
        transform: translate(-20%)
    }
    
    .card-section__enemy {
        border-radius: 0 0 1rem 1rem;
        position: absolute;
        top: 0;
        left: 1rem;
        transform: translate(20%)
    }

    .section-active {
        background-color: #97f8af42;
    }

    .turn-text {
        z-index: 1;
        position: absolute;
        top: 1rem;
        right: 1rem;
        font-size: 1.75rem;
        color: #af4819;
    }

    .turn-text > span {
        color: #CAB097;
    }

    .p1-name {
        position: absolute;
        font-size: 1.5rem;
        color: #af4819;
        bottom: 17.5rem;
        right: 0;
    }

    .p2-name {
        position: absolute;
        font-size: 1.5rem;
        color: #af4819;
        top: 17.5rem;
        left: 0;
    }

    .turn-active {
        color: #6fff93;
        font-size: 1.75rem;
    }

    .game-buttons {
        z-index: 1;

        display: flex;
        gap: 2rem;
        justify-content: center;
        align-items: center;
    }
</style>