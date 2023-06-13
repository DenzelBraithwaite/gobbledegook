<script>
    // Hooks
    import { onMount } from 'svelte';

    // Custom components
    import Button from './Button.svelte';
    import GGCard from '../lib/Card.svelte';

    // img paths
    const cardImgs = {
        villager: '/public/humans/villager.png',
        scout: '/public/humans/scout.png',
        soldier: '/public/humans/soldier.png',
        knight: '/public/humans/knight.png',
        assassin: '/public/humans/assassin.png',
        commander: '/public/humans/commander.png',
        emperor: '/public/humans/emperor.gif',
        
        bokoblin: '/public/goblins/goblin.png',
        hobgoblin: '/public/goblins/hobgoblin.png',
        thief: '/public/goblins/thief.png',
        shaman: '/public/goblins/shaman.png',
        troll: '/public/goblins/troll.png',
        giant: '/public/goblins/giant.png',
        goblinLord: '/public/goblins/goblin-lord.gif',

        bard: '/public/elves/bard.png',
        nadallen: '/public/elves/nadallen.png',
        nelladan: '/public/elves/nelladan.png',
        wildElf: '/public/elves/wild-elf.png',
        woodElf: '/public/elves/wood-elf.png',
        forestDweller: '/public/elves/forest-dweller.png',
        darkElf: '/public/elves/dark-elf.png',
        champion: '/public/elves/champion.png',
        elfKing: '/public/elves/elf-king.gif',

        hobbit: '/public/dwarves/hobbit.png',
        bartender: '/public/dwarves/bartender.png',
        traveller: '/public/dwarves/traveller.png',
        blacksmith: '/public/dwarves/blacksmith.png',
        miner: '/public/dwarves/miner.png',
        hunter: '/public/dwarves/hunter.png',
        warrior: '/public/dwarves/warrior.png',
        alchemist: '/public/dwarves/alchemist.png',
        dwarfCommander: '/public/dwarves/dwarf-commander.png',
        longbeardLeader: '/public/dwarves/longbeard-leader.gif',

        virus: '/public/bots/virus.png',
        incubator: '/public/bots/incubator.png',
        faeBot: '/public/bots/fae-bot.png',
        infernoBot: '/public/bots/inferno-bot.png',
        sawBot3000: '/public/bots/saw-bot-3000.png',
        ai: '/public/bots/ai.png',
        crusher5A1A57: '/public/bots/crusher-5A1A-57.gif',

        dog: '/public/animals/dog.png',
        fox: '/public/animals/fox.png',
        wolf: '/public/animals/wolf.png',
        panther: '/public/animals/panther.png',
        lion: '/public/animals/lion.png',
        bear: '/public/animals/bear.png',
        rhino: '/public/animals/rhino.png',
        dreamDestroyer: '/public/animals/dream-destroyer.gif',
    };

    // Card special traits
    const cardTraits = {
        bokoblinTrait: 'none',
        hobgoblinTrait: 'none',
        shamanTrait: 'none',
        trollTrait: 'none',
        giantTrait: 'none',
        goblinLordTrait: 'none',

        scoutTrait: 'none',
        villagerTrait: 'none',
        soldierTrait: 'none',
        knightTrait: 'none',
        commanderTrait: 'none',
        kingTrait: 'none',

        halfElfTrait: 'none',
        wildElfTrait: 'none',
        woodElfTrait: 'none',
        highElfTrait: 'none',
        darkElfTrait: 'none',
        elfKingTrait: 'none',

        minerTrait: 'none',
        blacksmithTrait: 'none',
        hobbitTrait: 'none',
        axeThrowerTrait: 'none',
        dwarfWarrior: 'none',
        longbeardLeaderTrait: 'none'
    };

    const humans = [
        'emperor',
        'commander',
        'commander',
        'commander',
        'commander',
        'assassin',
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
        'villager',
        'villager',
        'villager',
        'villager'
    ];

    const goblins = [
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
        'bokoblin'
    ];

    const elves = [
        'elfKing',
        'elfChampion',
        'elfChampion',
        'darkElf',
        'darkElf',
        'darkElf',
        'forestDweller',
        'forestDweller',
        'forestDweller',
        'woodElf',
        'woodElf',
        'woodElf',
        'wildElf',
        'wildElf',
        'wildElf',
        'Nelladan',
        'Nelladan',
        'Nadallen',
        'Nadallen',
        'bard',
        'bard',
        'bard'
    ];

    const dwarves = [
        'longbeardLeader',
        'commander',
        'commander',
        'alchemist',
        'alchemist',
        'Warrior',
        'Warrior',
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
    
    const bots = [
        'crusher-5A1A-57',
        'ai',
        'ai',
        'sawBot-3000',
        'sawBot-3000',
        'sawBot-3000',
        'infernoBot',
        'infernoBot',
        'infernoBot',
        'infernoBot',
        'roboRouter',
        'roboRouter',
        'roboRouter',
        'roboRouter',
        'incubator',
        'incubator',
        'incubator',
        'incubator',
        'virus',
        'virus',
        'virus',
        'virus'
    ]; 
    
    const animals = [
        'dreamDestroyer',
        'rhino',
        'rhino',
        'bear',
        'bear',
        'bear',
        'lion',
        'lion',
        'lion',
        'panther',
        'panther',
        'panther',
        'wolf',
        'wolf',
        'wolf',
        'fox',
        'fox',
        'fox',
        'dog',
        'dog',
        'dog'
    ]; 
    
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

    const fullDeck = {
    humans: [...humans],
    goblins: [...goblins],
    elves: [...elves],
    dwarves: [...dwarves],
    bots: [...bots],
    animals: [...animals],
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

    // Selects correct card race to apply correct styling, depending on card title
    function chooseRace(title) {
        if (humans.includes(title)) return 'human';
        if (goblins.includes(title)) return 'goblin';
        if (elves.includes(title)) return 'elf';
        if (dwarves.includes(title)) return 'dwarf';
        if (bots.includes(title)) return 'bot';
        if (animals.includes(title)) return 'animal';
    }

    // Controller logic for game
    function showDeck(allDecks = false) {
        const humanCardsLeft = fullDeck['humans'].length || 0;
        const goblinCardsLeft = fullDeck['goblins'].length || 0;
        const elfCardsLeft = fullDeck['elves'].length || 0;
        const dwarfCardsLeft = fullDeck['dwarves'].length || 0;
        const botCardsLeft = fullDeck['bots'].length || 0;
        const animalCardsLeft = fullDeck['animals'].length || 0;
        if (allDecks) {
            console.log(`Cards remaining per deck:\n
            Humans: ${humanCardsLeft}\n
            Goblins: ${goblinCardsLeft}\n
            Elves: ${elfCardsLeft}\n
            Dwarves: ${dwarfCardsLeft}\n)
            Bots: ${botCardsLeft}\n)
            Animals: ${animalCardsLeft}\n`);
        } else {
            const cardsLeft = humanCardsLeft + goblinCardsLeft + elfCardsLeft + dwarfCardsLeft + botCardsLeft + animalCardsLeft;
            console.log(`Cards remaining in deck: ${cardsLeft}`);
        }
    }

    function showHand(playerHand) {
        console.log(`Your hand: ${playerHand}`);
    }

    function changeTurns() {
        console.log('Turns changed!');
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
            console.log('oh sorry! there are no more cards, we will skip to see who wins now');
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
        console.log(`Card: ${card}`);
        if (p1Turn) {
            const index = p1Hand.indexOf(card);
            console.log(`Hand: ${p1Hand}, index:${index}`)
            p1Hand.splice(index, 1)
            p1Hand = [...p1Hand];
        } else {
            const index = p2Hand.indexOf(card);
            console.log(`Card: ${card}, index:${index}`)
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
            console.log(title);
            discard(title);
        }
    }

    function endGame() {
        p1Turn = true;
        p2Turn = true;
        gameOver = true;
        startBtnDisabled = false;
        gobbledegookDisabled = true;
        console.log('game is over, lets see who lost!');
        showDeck();
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
        gameOver = false;
        startBtnDisabled = true;
        gobbledegookDeclared = false;
        gobbledegookDisabled = false;
        dealCards(p1Hand);
        dealCards(p2Hand);
        decideFirstPlayer();
    }

    function assignPoints(card) {
        switch(card) {
            case 'villager':
                return 100
                break;
            case 'scout':
                return 100
                break;
            case 'soldier':
                return 100
                break;
            case 'knight':
                return 10
                break;
            case 'commander':
                return 100
                break;
            case 'emperor':
                return 100
                break;

            case 'bokoblin':
                return 100
                break;
            case 'hobgoblin':
                return 10
                break;
            case 'shaman':
                return 100
                break;
            case 'troll':
                return 100
                break;
            case 'giant':
                return 100
                break;
            case 'goblinLord':
                return 10
                break;

            case 'halfElf':
                return 100
                break;
            case 'wildElf':
                return 100
                break;
            case 'woodElf':
                return 100
                break;
            case 'highElf':
                return 10
                break;
            case 'darkElf':
                return 100
                break;
            case 'elfKing':
                return 100
                break;

            case 'hobbit':
                return 100
                break;
            case 'blacksmith':
                return 10
                break;
            case 'miner':
                return 100
                break;
            case 'axeThrower':
                return 100
                break;
            case 'dwarfWarrior':
                return 100
                break;
            case 'longbeard Leader':
                return 10
                break;

            case 'soldier':
                return 100
                break;
            case 'soldier':
                return 100
                break;
            case 'villager':
                return 100
                break;
            case 'villager':
                return 10
                break;
            case 'soldier':
                return 100
                break;
            case 'soldier':
                return 100
                break;
            case 'villager':
                return 100
                break;
            case 'villager':
                return 10
                break;
            case 'soldier':
                return 100
                break;
            case 'soldier':
                return 100
                break;
            case 'villager':
                return 100
                break;
            case 'villager':
                return 10
                break;
        }
    }

</script>

<main>
    {#if !startBtnDisabled}
        <Button on:click={startGame} customClasses="btn__green w-25">Start game</Button>
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
                    title={cardTitle}
                    img={cardImgs[cardTitle.replace(/\s/g, '')]}
                    trait={cardTraits[`${cardTitle}Trait`]}
                    race={chooseRace(cardTitle)}
                    points={assignPoints(cardTitle)} />
            {/each}
            <!-- <GGCard on:cardClick={selectCard} blur={p1Blur} title="Half Elf" img={cardImgs['halfElf']} trait={cardTraits['halfElfTrait']} race="elf" points={1} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p1Blur} title="Wild Elf" img={cardImgs['wildElf']} trait={cardTraits['wildElfTrait']} race="elf" points={1} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p1Blur} title="Wood Elf" img={cardImgs['woodElf']} trait={cardTraits['woodElfTrait']} race="elf" points={1} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p1Blur} title="High Elf" img={cardImgs['highElf']} trait={cardTraits['highElfTrait']} race="elf" points={1} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p1Blur} title="Dark Elf" img={cardImgs['darkElf']} trait={cardTraits['darkElfTrait']} race="elf" points={1} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p1Blur} title="Elf King" img={cardImgs['elfKing']} trait={cardTraits['elfKingTrait']} race="elf-rare" points={4} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p1Blur} title="Miner" img={cardImgs['miner']} trait={cardTraits['minerTrait']} race="dwarf" points={15} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p1Blur} title="Blacksmith" img={cardImgs['blacksmith']} trait={cardTraits['minderTrait']} race="dwarf" points={15} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p1Blur} title="Hobbit" img={cardImgs['hobbit']} trait={cardTraits['hobbitTrait']} race="dwarf" points={15} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p1Blur} title="Axe Thrower" img={cardImgs['axeThrower']} trait={cardTraits['axeThrowerTrait']} race="dwarf" points={15} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p1Blur} title="Dwarf Warrior" img={cardImgs['dwarfWarrior']} trait={cardTraits['dwarfWarriorTrait']} race="dwarf" points={15} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p1Blur} title="Longbeard Leader" img={cardImgs['longbeardLeader']} trait={cardTraits['longbeardLeaderTrait']} race="dwarf-rare" points={30} /> -->
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
                <GGCard on:cardClick={(event) => selectCard(event, p2Hand)} blur={p2Turn ? false : true} title={cardTitle} img={cardImgs[cardTitle.replace(/\s/g, '')]} trait={cardTraits[`${cardTitle}Trait`]} race={chooseRace(cardTitle)} points={1} />
            {/each}
            <!-- <GGCard on:cardClick={selectCard} blur={p2Blur} title="Bokoblin" img={cardImgs['bokoblin']} trait={cardTraits['bokoblinTrait']} race="goblin" points={1} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p2Blur} title="Hobgoblin" img={cardImgs['hobgoblin']} trait={cardTraits['hobgoblinTrait']} race="goblin" points={1} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p2Blur} title="Shaman" img={cardImgs['shaman']} trait={cardTraits['shamanTrait']} race="goblin" points={1} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p2Blur} title="Troll" img={cardImgs['troll']} trait={cardTraits['trollTrait']} race="goblin" points={1} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p2Blur} title="Giant" img={cardImgs['giant']} trait={cardTraits['giantTrait']} race="goblin" points={1} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p2Blur} title="Goblin Lord" img={cardImgs['goblinLord']} trait={cardTraits['goblinLordTrait']} race="goblin-rare" points={4} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p2Blur} title="Villager" img={cardImgs['villager']} trait={cardTraits['villagerTrait']} race="human" points={15} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p2Blur} title="Scout" img={cardImgs['scout']} trait={cardTraits['scoutTrait']} race="human" points={15} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p2Blur} title="Soldier" img={cardImgs['soldier']} trait={cardTraits['soldierTrait']} race="human" points={15} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p2Blur} title="Knight" img={cardImgs['knight']} trait={cardTraits['knightTrait']} race="human" points={15} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p2Blur} title="Commander" img={cardImgs['commander']} trait={cardTraits['commanderTrait']} race="human" points={15} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p2Blur} title="Emperor" img={cardImgs['emperor']} trait={cardTraits['emperorTrait']} race="human-rare" points={30} /> -->
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