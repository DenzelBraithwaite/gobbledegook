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
    const goblinImg = '/public/goblin-card-img.png';
    const shamanImg = '/public/shaman-card-img.png';
    const trollImg = '/public/troll-card-img.png';
    const giantImg = '/public/giant-card-img.png';

    const goblinDescription = "A lower ranked military unit known as the common goblin. Nothing special about this one, except maybe its breath.";
    const trollDescription = "A middle rank beast with incredible offense and durability, even its intelligence is average amongst humans.";
    const shamanDescription = "A goblin who's meddled in magic. They can cast strong spells so beware. They're known to be officers in the goblin army.";
    const giantDescription = "The greatest force the goblins have at their disposal, 3 giants with a mysterious bond to the goblins.";

    function dealCards() {
        game.dealCards();
    }

</script>

<main>
    <Button on:click={dealCards} customClasses="w-50 btn__green">Start Game!</Button>
    <div class="game-board">
        <div class="card-section card-section__enemy">
            <GGCard dmg='0-1' points='0-1' hp='0-1' />
            <GGCard dmg='0-1' points='0-1' hp='0-1' />
            <GGCard dmg='0-1' points='0-1' hp='0-1' />
            <GGCard dmg='0-1' points='0-1' hp='0-1' />
            <GGCard dmg='0-1' points='0-1' hp='0-1' />
        </div>
        <div class="card-section card-section__ally">
            <GGCard img={goblinImg} description={goblinDescription} dmg='0-1' points='0-1' hp='0-1' />
            <GGCard img={shamanImg} description={shamanDescription} dmg='0-1' points='0-1' hp='0-1' />
            <GGCard img={trollImg} description={trollDescription} dmg='0-1' points='0-1' hp='0-1' />
            <GGCard img={giantImg} description={giantDescription} dmg='0-1' points='0-1' hp='0-1' />
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