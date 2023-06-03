<script>
    // Hooks
    import { onMount } from 'svelte';

    // Custom components
    import Button from './Button.svelte';
    import GGCard from '../lib/Card.svelte';

    class Game {    
        constructor() {
            // Humans
            this.humanDeck = 50;
            this.humanHand = 0;
            this.humanPoints = 0;
            this.kingsRemaining = 1;
            this.paladinsRemaining = 9;
            this.knightsRemaining = 15;
            this.soldiersRemaining = 25;
            // Consider making a human class or card class for all of these instances
            this.king = {
                health: 60,
                damage: 5,
                points: 100,
                moved: false,
            };
            this.paladin = {
                health: 15,
                damage: [4, 5, 6],
                points: 10,
                moved: false,
            };
            this.knight = {
                health: 8,
                damage: [2, 3, 4],
                points: 5,
                moved: false,
            };
            this.soldier = {
                health: 2,
                damage: [1, 2],
                points: 2,
                moved: false,
            };

            
            // Goblins
            this.goblinDeck = 50;
            this.goblinHand = 0;
            this.goblinPoints = 0;

            this.giantsRemaining = 3;
            this.trollsRemaining = 7;
            this.shamansRemaining = 15;
            this.goblinsRemaining = 25;

            this.giant = {
                health: 35,
                damage: [7, 8, 9, 10, 11, 12],
                points: 30,
                moved: false,
            };
            this.troll = {
                health: 25,
                damage: [5, 6, 7, 8, 9 ,10],
                points: 15,
                moved: false,
            };
            this.shaman = {
                health: 6,
                damage: [2, 3],
                points: 4,
                moved: false,
            };
            this.goblin = {
                health: 1,
                damage: [0, 1, 2],
                points: 1,
                moved: false,
            };

            this.gameInProg = false;
            this.roundInProg = false;
            this.p1Cards = {};
            this.p2Cards = {};
        };
        
        // TODO: Method to start the game
        startGame() {
            this.gameInProg = true;
            console.log(this.gameInProg);
        };

        // TODO: Method to end the game
        endGame() {
            this.gameInProg = false;
        };

        // TODO: Method to handle a round
        startRound() {

        };

        // TODO: Method to deal cards
        dealCards() {
            this.humanDeck -= 5;
            this.humanHand = 5;
            
            this.goblinDeck -= 5;
            this.goblinHand = 5;
        };

    };

    $: game = new Game();

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

    function dealCards() {
        game.dealCards();
    }

</script>

<main>
    <Button on:click={dealCards} customClasses="w-50 btn__orange">Start Game!</Button>
    <div class="game-board">
        <GGCard faceDown={true} bottomDeck={false}/>
        <div class="card-section card-section__enemy">
            <GGCard title="Goblin" img={goblinImg} description={goblinDescription} dmg="0-2" points="1" hp="1" />
            <GGCard title="Shaman" img={shamanImg} description={shamanDescription} dmg="2-3" points="4" hp="6" />
            <GGCard title="Troll" img={trollImg} description={trollDescription} dmg="5-10" points="15" hp="25" />
            <GGCard title="Giant" img={giantImg} description={giantDescription} dmg="7-12" points="30" hp="35" />
        </div>
        
        <GGCard faceDown={true} bottomDeck={true}/>
        <div class="card-section card-section__ally">
            <GGCard title="Soldier" img={soldierImg} description={soldierDescription} dmg="0-2" points="1" hp="1" />
            <GGCard title="Knight" img={knightImg} description={knightDescription} dmg="2-3" points="4" hp="6" />
            <GGCard title="Paladin" img={paladinImg} description={paladinDescription} dmg="5-10" points="15" hp="25" />
            <GGCard title="King" img={kingImg} description={kingDescription} dmg="7-12" points="30" hp="35" />
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