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
        'goblin lord',
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
        'elf king',
        'dark elf',
        'dark elf',
        'dark elf',
        'high elf',
        'high elf',
        'high elf',
        'high elf',
        'wood elf',
        'wood elf',
        'wood elf',
        'wood elf',
        'wood elf',
        'wild elf',
        'wild elf',
        'wild elf',
        'wild elf',
        'wild elf',
        'half elf',
        'half elf',
        'half elf',
        'half elf',
        'half elf'
    ];

    const dwarves = [
        'longbeard leader',
        'dwarf warrior',
        'dwarf warrior',
        'dwarf warrior',
        'axe thrower',
        'axe thrower',
        'axe thrower',
        'axe thrower',
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
    
    // Card props
    let p1Blur = false;
    let p2Blur = false;

    // Game logic
    let p1Turn = true;
    let p2Turn = false;
    let p1Pts = 0;
    let p2Pts = 0;
    let p1RoundsWon = 0;
    let p2RoundsWon = 0;
    let p1Hand = [];
    let p2Hand = [];

    const fullDeck = {
    humans: [...humans],
    goblins: [...goblins],
    elves: [...elves],
    dwarves: [...dwarves],
    };

    const deckTypes = Object.keys(fullDeck);

    // Controller logic for game
    function showDecks(allDecks = false) {
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

    function discard(playerHand) {
        const card = prompt("which card would you like to remove?");
        const index = playerHand.indexOf(card);
        playerHand.splice(index, 1)
        showHand(playerHand);
    };

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

            // TODO: Remove card from deck
            // const removedCard = fullDeck[currentDeck].find(card => card === cardDrawn);
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
        // Grab random deck 
        let randomNum = Math.floor(Math.random() * deckTypes.length);
        let currentDeck = deckTypes[randomNum];

        // When the last card is drawn, currentDeck becomes undefined. This will catch that
        if (deckTypes.length === 0 && currentDeck === undefined) {
            playerHand.length = 0;
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

        // TODO: Remove card from deck
        // const removedCard = fullDeck[currentDeck].find(card => card === cardDrawn);
        const removedCardIndex = fullDeck[currentDeck].indexOf(cardDrawn);
        fullDeck[currentDeck].splice(removedCardIndex, 1);

        // Add to player's hand
        playerHand.push(cardDrawn);
        console.log(`Your hand: ${playerHand}`);
    }

    function startRound(playerHand) {        
        showHand(playerHand);
        // This will be a button the player clicks, not a prompt
        const gobbledegook = prompt("Would you like to declare gobbledegook?");
        
        // If player declares gobbledegook, their turn is skipped and the game ends on their next turn
        if (gobbledegook === 'yes') {
            console.log("gobble gobble");
        } else {
            console.log('drawing card...');
            drawCard(playerHand);
            discard(playerHand);
        }

        // If player draws card, they will temporarily have 6 cards and MUST choose 1 to discard.
    }

    function startGame() {
        console.log('game will begin shortly, now drawing cards...');
        dealCards(p1Hand);
        dealCards(p2Hand);
        // startRound(p1Hand);
        // showDecks();
        console.log(p1Hand);
    }

    function endGame() {
        
    }

    function assignCard() {

    }

    // Handles player click on card
    function selectCard(event) {
        // Gather info about the card, what card was just clicked? Title is most important
        const title = event.detail.title;
        return title.replace(/\s/g, '');
    }

</script>

<main>
    <Button on:click={startGame} customClasses="btn__green w-25">Start game</Button>
    <div class="game-buttons">
        <GGCard on:click={() => {startRound(p1Hand)}} faceDown={true} />
        <Button on:click={changeTurns} gobbledegook={true} />
    </div>

    <div class="game-board">
        <p class="turn-text">{p1Turn ? "Player 1" : "Player 2"}<span>'s turn</span></p>
                
        <div class="card-section card-section__ally">
            <p class="p2-name">Player 1</p>
            {#each p1Hand as card}
                <li>{card}</li>
                <GGCard on:cardClick={selectCard} blur={p1Blur} title={card} img={cardImgs[card.replace(/\s/g, '')]} trait={cardTraits[`${card}Trait`]} race="elf" points={1} />

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
        <div class="card-section card-section__enemy blur">
            <p class="p1-name">Player 2</p>
            <!-- <GGCard on:cardClick={selectCard} blur={p2Blur} title="Bokoblin" img={cardImgs['bokoblin']} trait={cardTraits['bokoblinTrait']} race="goblin" points={1} /> -->
            <GGCard on:cardClick={selectCard} blur={p2Blur} title="Hobgoblin" img={cardImgs['hobgoblin']} trait={cardTraits['hobgoblinTrait']} race="goblin" points={1} />
            <!-- <GGCard on:cardClick={selectCard} blur={p2Blur} title="Shaman" img={cardImgs['shaman']} trait={cardTraits['shamanTrait']} race="goblin" points={1} /> -->
            <GGCard on:cardClick={selectCard} blur={p2Blur} title="Troll" img={cardImgs['troll']} trait={cardTraits['trollTrait']} race="goblin" points={1} />
            <!-- <GGCard on:cardClick={selectCard} blur={p2Blur} title="Giant" img={cardImgs['giant']} trait={cardTraits['giantTrait']} race="goblin" points={1} /> -->
            <GGCard on:cardClick={selectCard} blur={p2Blur} title="Goblin Lord" img={cardImgs['goblinLord']} trait={cardTraits['goblinLordTrait']} race="goblin-rare" points={4} />
            <!-- <GGCard on:cardClick={selectCard} blur={p2Blur} title="Villager" img={cardImgs['villager']} trait={cardTraits['villagerTrait']} race="human" points={15} /> -->
            <GGCard on:cardClick={selectCard} blur={p2Blur} title="Scout" img={cardImgs['scout']} trait={cardTraits['scoutTrait']} race="human" points={15} />
            <!-- <GGCard on:cardClick={selectCard} blur={p2Blur} title="Soldier" img={cardImgs['soldier']} trait={cardTraits['soldierTrait']} race="human" points={15} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p2Blur} title="Knight" img={cardImgs['knight']} trait={cardTraits['knightTrait']} race="human" points={15} /> -->
            <!-- <GGCard on:cardClick={selectCard} blur={p2Blur} title="Commander" img={cardImgs['commander']} trait={cardTraits['commanderTrait']} race="human" points={15} /> -->
            <GGCard on:cardClick={selectCard} blur={p2Blur} title="Emperor" img={cardImgs['emperor']} trait={cardTraits['emperorTrait']} race="human-rare" points={30} />
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
        margin: 1rem auto;
        border-radius: 1rem;
        background-color: #200f009d;
        box-shadow: 0 4px 20px #000000;
        border: 2px solid #e4c82e1f;
    }

    .card-section {
        width: 70%;
        padding: 1rem;
        background-color: #e4c82e1f;

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

    .turn-text {
        position: absolute;
        right: 1rem;
        font-size: 2rem;
        color: #af4819;
    }

    .turn-text > span {
        color: #CAB097;
    }

    .p1-name {
        position: absolute;
        font-size: 1.5rem;
        color: #af4819;
        top: 17.5rem;
        left: 0;
    }

    .p2-name {
        position: absolute;
        font-size: 1.5rem;
        color: #af4819;
        bottom: 17.5rem;
        right: 0;
    }

    .game-buttons {
        z-index: 1;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-30%, -30%);

        display: flex;
        gap: 2rem;
        justify-content: center;
        align-items: center;
    }
</style>