<script>
    // Hooks
    import { onMount } from 'svelte';

    // Custom components
    import Button from './Button.svelte';
    import GGCard from '../lib/Card.svelte';
    
    // Card props
    let p1Blur = false;
    let p2Blur = false;

    // img paths
    const cardImgs = {
        bokoblinImg: '/public/goblin-img.png',
        hobgoblinImg: '/public/hobgoblin-img.png',
        shamanImg: '/public/shaman-img.png',
        trollImg: '/public/troll-img.png',
        giantImg: '/public/giant-img.png',
        scoutImg: '/public/scout-img.png',
        soldierImg: '/public/soldier-img.png',
        knightImg: '/public/knight-img.png',
        commanderImg: '/public/commander-img.png',
        emperorImg: '/public/emperor-img.gif',
        halfElfImg: '/public/half-elf-img.png',
        woodElfImg: '/public/wood-elf-img.png',
        highElfImg: '/public/high-elf-img.png',
        darkElfImg: '/public/dark-elf-img.png',
        elfKingImg: '/public/elf-king-img.png',
        minerImg: '/public/miner-img.png',
        hobbitImg: '/public/hobbit-img.png',
        axeThrowerImg: '/public/axe-thrower-img.png',
        dwarfWarrior: '/public/dwarf-warrior-img.png',
        longbeardLeaderImg: '/public/longbeard-leader-img.png'
    };

    // Card special traits
    const cardTraits = {
        bokoblinTrait: 'none',
        hobgoblinTrait: 'none',
        shamanTrait: 'none',
        trollTrait: 'none',
        giantTrait: 'none',
        scoutTrait: 'none',
        soldierTrait: 'none',
        knightTrait: 'none',
        commanderTrait: 'none',
        kingTrait: 'none',
        halfElfTrait: 'none',
        woodElfTrait: 'none',
        highElfTrait: 'none',
        darkElfTrait: 'none',
        elfKingTrait: 'none',
        minerTrait: 'none',
        hobbitTrait: 'none',
        axeThrowerTrait: 'none',
        dwarfWarrior: 'none',
        longbeardLeaderTrait: 'none'
    };
    
    // Game logic
    let p1Turn = true;
    let p2Turn = false;
    let p1Pts = 0;
    let p2Pts = 0;
    let p1RoundsWon = 0;
    let p2RoundsWon = 0;
    const p1Hand = [];
    const p2Hand = [];

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
        'scout',
        'scout',
        'scout',
        'scout',
        'scout',
    ];

    const goblins = [
        'goblin lord',
        'goblin champion',
        'goblin champion',
        'goblin champion',
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
        'bokoblin',
        'bokoblin',
        'bokoblin',
        'bokoblin',
        'bokoblin',
        'bokoblin',
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
        'half elf',
        'half elf',
        'half elf',
        'half elf',
        'half elf',
        'half elf',
        'half elf',
        'half elf',
        'half elf',
        'half elf',
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
        'miner',
        'miner',
        'miner',
        'miner',
        'miner',
        'miner',
        'miner',
        'miner',
        'miner',
        'miner',
    ];

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

            // When the last card is drawn, currentDeck becomes undefined. This will catch that
            if (deckTypes.length === 0 && currentDeck === undefined) {
                playerHand.length = 0;
                console.log('oh sorry! there are no more cards, we will skip to see who wins now');
                return;
            };

            // TODO: What if deck runs out? Deck length 0, remove from deckTypes array ?
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
        startRound(p1Hand);
        showDecks();
    }

    function endGame() {
        
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
        <div class="card-section card-section__enemy blur">
            <p class="p1-name">Player 2</p>
            <GGCard blur={p2Blur} title="Goblin" img={cardImgs['bokoblinImg']} trait={cardTraits['goblinTrait']} race="goblin" points={1} />
            <GGCard blur={p2Blur} title="Shaman" img={cardImgs['shamanImg']} trait={cardTraits['shamanTrait']} race="goblin-rare" points={4} />
            <GGCard blur={p2Blur} title="Troll" img={cardImgs['trollImg']} trait={cardTraits['trollTrait']} race="elf-rare" points={15} />
            <GGCard blur={p2Blur} title="Giant" img={cardImgs['giantImg']} trait={cardTraits['giantTrait']} race="dwarf-rare" points={30} />
        </div>
        
        <div class="card-section card-section__ally">
            <p class="p2-name">Player 1</p>
            <GGCard blur={p1Blur} title="Soldier" img={cardImgs['soldierImg']} trait={cardTraits['soldierTrait']} race="human" points={1} />
            <GGCard blur={p1Blur} title="Knight" img={cardImgs['knightImg']} trait={cardTraits['knightTrait']} race="human" points={4} />
            <GGCard blur={p1Blur} title="Scout" img={cardImgs['scoutImg']} trait={cardTraits['scoutTrait']} race="human" points={15} />
            <GGCard blur={p1Blur} title="Emperor" img={cardImgs['emperorImg']} trait={cardTraits['emperorTrait']} race="human-rare" points={30} />
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
    }
    
    .card-section__enemy {
        border-radius: 0 0 1rem 1rem;
        position: absolute;
        top: 0;
        left: 1rem;
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