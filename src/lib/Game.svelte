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
            trait: '',
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
            trait: '',
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
    $: p1Turn = false;
    $: p2Turn = false;
    let p1Pts = 0;
    let p2Pts = 0;
    let p1RoundsWon = 0;
    let p2RoundsWon = 0;
    $: p1Hand = [];
    $: p2Hand = [];
    let gobbledegookDeclared = false;
    let gobbledegookDisabled = false;
    let startBtnDisabled = false;
    let gameOver = true;

    // Deck players draw from, includes all race decks
    const fullDeck = {
    humans: [...humanDeck],
    goblins: [...goblinDeck],
    elves: [...elfDeck],
    dwarves: [...dwarfDeck],
    bots: [...botDeck],
    beasts: [...beastDeck],
    };

    // array for each deck, humans, goblins, elves and dwarves
    const deckTypes = Object.keys(fullDeck);

    // Ensures player 1 isn't always first to start
    function decideFirstPlayer() {
        const num = Math.ceil(Math.random() * 2);
        if (num === 1) {
            p1Turn = true
            p2Turn = false;
        } else {
            p1Turn = false
            p2Turn = true;
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

    function changeTurns() {
        p1Turn = !p1Turn;
        p2Turn = !p2Turn;
    }

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
        if (playerHand === p1Hand) {
            p1Hand = [...playerHand];
        } else {
            p2Hand = [...playerHand];
        }
    }

    function drawCard(playerHand) {
        if (gameOver) return;

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
        if (playerHand === p1Hand) {
            p1Hand = [...playerHand];
        } else {
            p2Hand = [...playerHand];
        }
    }

    function discard(card) {
        if (p1Turn) {
            const index = p1Hand.indexOf(card);
            p1Hand.splice(index, 1)
            p1Hand = [...p1Hand];
        } else {
            const index = p2Hand.indexOf(card);
            p2Hand.splice(index, 1)
            p2Hand = [...p2Hand];
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

    function endGame() {
        p1Turn = true;
        p2Turn = true;
        gameOver = true;
        startBtnDisabled = false;
        gobbledegookDisabled = true;
        console.log('Gobbledegook, Gobbledegook!!! The game is now over, time to tally the points!');
        p1Pts = calculatePoints(p1Hand);
        p2Pts = calculatePoints(p2Hand);
        determineWinner();
        showDeck();
        showDeck(true);
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
  
    function startGame() {
        p1Pts = 0;
        p2Pts = 0;
        gameOver = false;
        startBtnDisabled = true;
        gobbledegookDeclared = false;
        gobbledegookDisabled = false;
        fullDeck['humans'] = [...humanDeck];
        fullDeck['goblins'] = [...goblinDeck];
        fullDeck['elves'] = [...elfDeck];
        fullDeck['dwarves'] = [...dwarfDeck];
        fullDeck['bots'] = [...botDeck];
        fullDeck['beasts'] = [...beastDeck];
        dealCards(p1Hand);
        dealCards(p2Hand);
    }

    function calculatePoints(pHand) {
        let totalPoints = 0;
        pHand.forEach((card) => {
            const points = cardDetails[card].points;
            totalPoints += points;
        });
        return totalPoints;
    }

    function determineWinner() {
        if(p1Pts > p2Pts) {
            console.log(`Player 1 is the winner with ${p1Pts} points!!!🎉🙌🎆🥂`);
            console.log(`Player 2 loses with ${p2Pts} points...`)
        } else if(p2Pts > p1Pts) {
            console.log(`Player 2 is the winner with ${p2Pts} points!!!🎊🥳🍾`);
            console.log(`Player 1 loses with ${p1Pts} points...`)
        } else {
            console.log("It's a.... draw ?😢💔")
            console.log(`Player 1 had ${p1Pts} points and player 2 had ${p2Pts} points.😎`);
        }
    }
</script>

<main>
    {#if !startBtnDisabled}
        <Button on:click={startGame} customClasses="btn__green w-25">Start game</Button>
        <Button on:click={decideFirstPlayer} customClasses="btn__orange w-25">Decide who starts</Button>
    {:else}
        <Button customClasses="btn__green_disabled w-25">Game in progress...</Button>
    {/if}
    <div class="game-board">
        {#if startBtnDisabled}
            <p class="turn-text">{p1Turn ? "Player 1" : "Player 2"}<span>'s turn</span></p>
        {/if}
        <div class="card-section card-section__ally {p1Turn ? "section-active" : ""}">
            <p class="p1-name {p1Turn ? "turn-active" : ""}">Player 1</p>
            {#each p1Hand as cardTitle}
                <GGCard
                    on:cardClick={(event) => selectCard(event, p1Hand)}
                    blur={p1Turn ? false : true}
                    displayTitle={cardDetails[cardTitle].displayTitle}
                    title={cardDetails[cardTitle].title}
                    img={cardDetails[cardTitle].image}
                    trait={cardDetails[cardTitle].trait}
                    race={cardDetails[cardTitle].race}
                    points={cardDetails[cardTitle].points} />
            {/each}
        </div>
        <div class="game-buttons">
            <!-- <Button on:click={changeTurns} round={true} customClasses="btn__brown">Change Turns</Button> -->
            <GGCard on:click={() => {p1Turn ? drawCard(p1Hand) : drawCard(p2Hand)}} faceDown={true} />
                {#if gobbledegookDisabled}
                <Button round={true} customClasses="btn__orange_disabled">Gobbledegook!</Button>
                {:else}
                <Button on:click={gobbledegook} round={true} customClasses="btn__orange">Gobbledegook!</Button>
                {/if}
        </div>
        <div class="card-section card-section__enemy {p2Turn ? "section-active" : ""}">
            <p class="p2-name {p2Turn ? "turn-active" : ""}">Player 2</p>
            {#each p2Hand as cardTitle}
            <GGCard
            on:cardClick={(event) => selectCard(event, p2Hand)}
            blur={p2Turn ? false : true}
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