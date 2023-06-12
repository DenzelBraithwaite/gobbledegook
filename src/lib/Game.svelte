<script>
    // Hooks
    import { onMount } from 'svelte';

    // Custom components
    import Button from './Button.svelte';
    import GGCard from '../lib/Card.svelte';

    // img paths
    const cardImgs = {
        bokoblin: '/public/goblin.png',
        hobgoblin: '/public/hobgoblin.png',
        shaman: '/public/shaman.png',
        troll: '/public/troll.png',
        giant: '/public/giant.png',
        goblinLord: '/public/goblin-lord.gif',

        villager: '/public/villager.png',
        scout: '/public/scout.png',
        soldier: '/public/soldier.png',
        knight: '/public/knight.png',
        commander: '/public/commander.png',
        emperor: '/public/emperor.gif',

        halfElf: '/public/half-elf.png',
        wildElf: '/public/wild-elf.png',
        woodElf: '/public/wood-elf.png',
        highElf: '/public/high-elf.png',
        darkElf: '/public/dark-elf.png',
        elfKing: '/public/elf-king.gif',

        miner: '/public/miner.png',
        blacksmith: '/public/blacksmith.png',
        hobbit: '/public/hobbit.png',
        axeThrower: '/public/axe-thrower.png',
        dwarfWarrior: '/public/dwarf-warrior.png',
        longbeardLeader: '/public/longbeard-leader.gif'
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
        'knight',
        'knight',
        'knight',
        'knight',
        'soldier',
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
        'villager'
    ];

    const goblins = [
        'goblinLord',
        'giant',
        'giant',
        'giant',
        'troll',
        'troll',
        'troll',
        'troll',
        'shaman',
        'shaman',
        'shaman',
        'shaman',
        'shaman',
        'hobgoblin',
        'hobgoblin',
        'hobgoblin',
        'hobgoblin',
        'hobgoblin',
        'bokoblin',
        'bokoblin',
        'bokoblin',
        'bokoblin',
        'bokoblin'
    ];

    const elves = [
        'elfKing',
        'darkElf',
        'darkElf',
        'darkElf',
        'highElf',
        'highElf',
        'highElf',
        'highElf',
        'woodElf',
        'woodElf',
        'woodElf',
        'woodElf',
        'woodElf',
        'wildElf',
        'wildElf',
        'wildElf',
        'wildElf',
        'wildElf',
        'halfElf',
        'halfElf',
        'halfElf',
        'halfElf',
        'halfElf'
    ];

    const dwarves = [
        'longbeardLeader',
        'dwarfWarrior',
        'dwarfWarrior',
        'dwarfWarrior',
        'axeThrower',
        'axeThrower',
        'axeThrower',
        'axeThrower',
        'hobbit',
        'hobbit',
        'hobbit',
        'hobbit',
        'hobbit',
        'blacksmith',
        'blacksmith',
        'blacksmith',
        'blacksmith',
        'blacksmith',
        'miner',
        'miner',
        'miner',
        'miner',
        'miner'
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
    }

    // Controller logic for game
    function showDeck(allDecks = false) {
        const humanCardsLeft = fullDeck['humans'].length || 0;
        const goblinCardsLeft = fullDeck['goblins'].length || 0;
        const elfCardsLeft = fullDeck['elves'].length || 0;
        const dwarfCardsLeft = fullDeck['dwarves'].length || 0;
        if (allDecks) {
            console.log(`Cards remaining per deck:\n
            Humans: ${humanCardsLeft}\n
            Goblins: ${goblinCardsLeft}\n
            Elves: ${elfCardsLeft}\n
            Dwarves: ${dwarfCardsLeft}\n`);
        } else {
            const cardsLeft = humanCardsLeft + goblinCardsLeft + elfCardsLeft + dwarfCardsLeft;
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
                <GGCard on:cardClick={(event) => selectCard(event, p1Hand)} blur={p1Turn ? false : true} title={cardTitle} img={cardImgs[cardTitle.replace(/\s/g, '')]} trait={cardTraits[`${cardTitle}Trait`]} race={chooseRace(cardTitle)} points={1} />
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
        height: 90dvh;
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