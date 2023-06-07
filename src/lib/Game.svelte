<script>
    // Hooks
    import { onMount } from 'svelte';

    // Custom components
    import Button from './Button.svelte';
    import GGCard from '../lib/Card.svelte';
    
    // Card props
    const goblinImg = '/public/goblin-img.png';
    const shamanImg = '/public/shaman-img.png';
    const trollImg = '/public/troll-img.png';
    const giantImg = '/public/giant-img.png';
    const goblinDescription = "A lower ranked military unit known as the common goblin. Nothing special about this one, except maybe its breath.";
    const trollDescription = "A middle rank beast with incredible offense and durability, even its intelligence is average amongst humans.";
    const shamanDescription = "A goblin who's meddled in magic. They can cast strong spells so beware. They're known to be officers in the goblin army.";
    const giantDescription = "The greatest force the goblins have at their disposal, 3 giants with a mysterious bond to the goblins.";

    const soldierImg = '/public/soldier-img.png';
    const knightImg = '/public/knight-img.png';
    const paladinImg = '/public/paladin-img.png';
    const kingImg = '/public/king-img.png';
    const soldierDescription = "A lower ranked military soldier, quite common and reliable.";
    const knightDescription = "A middle rank axe wielding horseman with great mobility and defense.";
    const paladinDescription = "A soldier who's dedicated his life to following a righteous path. An elite in the human army that instills fear in the eyes of many. Be careful, they're quite the formidable foe.";
    const kingDescription = "An invaluable asset to the human army, their leader, the king! If he dies, the humans will lose. But be warned, the king is always well guarded and certainly not defenseless on his own.";
    
    // Game logic
    let p1Turn = true;
    let p2Turn = false;
    let p1Pts = 0;
    let p2Pts = 0;
    let p1RoundsWon = 0;
    let p2RoundsWon = 0;
    const p1Hand = [];
    const p2Hand = [];

    // The 'backups' are used to reset the game without having to redefine the decks
    const humansBackup = [
        'emperor',
        'commander',
        'commander',
        'commander',
        'captain',
        'captain',
        'captain',
        'captain',
        'knight',
        'knight',
        'knight',
        'knight',
        'knight',
        'soldier',
        'soldier',
        'soldier',
        'soldier',
        'soldier',
        'soldier',
        'soldier',
        'soldier',
        'soldier',
        'soldier',
    ];
    const humans = [...humansBackup];

    const goblinsBackup = [
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
    const goblins = [...goblinsBackup];

    const elvesBackup = [
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
    const elves = [...elvesBackup];

    const dwarvesBackup = [
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
    const dwarves = [...dwarvesBackup];

    const fullDeck = {
    humans: [...humans],
    goblins: [...goblins],
    elves: [...elves],
    dwarves: [...dwarves],
    };

    const deckTypes = Object.keys(fullDeck);

    // Controller logic for game
    function showDecks() {
        console.log(`Cards remaining per deck:\n
                    Humans: ${fullDeck['humans'].length}\n
                    Goblins: ${fullDeck['goblins'].length}\n
                    Elves: ${fullDeck['elves'].length}\n
                    Dwarves: ${fullDeck['dwarves'].length}\n`);
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
        showDecks();
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
    }

    function endGame() {

    }

</script>

<main>
    <Button on:click={startGame} customClasses="w-50 btn__orange">Start Game!</Button>
    <div class="game-board">
        <GGCard faceDown={true} bottomDeck={false}/>
        <div class="card-section card-section__enemy">
            <GGCard title="Goblin" img={goblinImg} description={goblinDescription} race="goblin" points="1" />
            <GGCard title="Shaman" img={shamanImg} description={shamanDescription} race="goblin" points="4" />
            <GGCard title="Troll" img={trollImg} description={trollDescription} race="goblin" points="15" />
            <GGCard title="Giant" img={giantImg} description={giantDescription} race="goblin" points="30" />
        </div>
        
        <GGCard faceDown={true} bottomDeck={true}/>
        <div class="card-section card-section__ally">
            <GGCard title="Soldier" img={soldierImg} description={soldierDescription} race="human" points="1" />
            <GGCard title="Knight" img={knightImg} description={knightDescription} race="human" points="4" />
            <GGCard title="Paladin" img={paladinImg} description={paladinDescription} race="human" points="15" />
            <GGCard title="King" img={kingImg} description={kingDescription} race="human" points="30" />
        </div>
    </div>
</main>


<style>
    .game-board {
        position: relative;
        height: 850px;
        width: 90%;
        padding: 0.5rem;
        max-width: 1500px;
        margin: 1rem auto;
        border-radius: 1rem;
        background-color: #200f009d;
        box-shadow: 0 4px 20px #000000;
    }

    .card-section {
        width: 70%;
        padding: 1.25rem;
        background-color: #5f3b2288;

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
</style>