<script lang="ts">
    // Hooks
    import { onMount } from 'svelte';

    // Custom components
    import Button from './Button.svelte';
    import GGCard from '../lib/Card.svelte';

    class Game {
        humanDeck: number;
        humanHand: number;
        humanPoints: number;
        kingsRemaining: number;
        paladinsRemaining: number;
        knightsRemaining: number;
        soldiersRemaining: number;
        king: Record<string, number>
        paladin: Record<string, number | number[]>
        knight: Record<string, number | number[]>
        soldier: Record<string, number | number[]>

        goblinDeck: number;
        goblinHand: number;
        goblinPoints: number;
        giantsRemaining: number;
        trollsRemaining: number;
        shamansRemaining: number;
        goblinsRemaining: number;
        giant: Record<string, number | number[]>
        troll: Record<string, number | number[]>
        shaman: Record<string, number | number[]>
        goblin: Record<string, number | number[]>
    
        gameInProg: boolean;
        roundInProg: boolean;
        p1Cards: Record<string, unknown>;
        p2Cards: Record<string, unknown>;
        
        
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
            };
            this.paladin = {
                health: 15,
                damage: [4, 5, 6],
                points: 10,
            };
            this.knight = {
                health: 8,
                damage: [2, 3, 4],
                points: 5,
            };
            this.soldier = {
                health: 2,
                damage: [1, 2],
                points: 2,
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
            };
            this.troll = {
                health: 25,
                damage: [5, 6, 7, 8, 9 ,10],
                points: 15,
            };
            this.shaman = {
                health: 6,
                damage: [2, 3],
                points: 4,
            };
            this.goblin = {
                health: 1,
                damage: [0, 1, 2],
                points: 1,
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
    
    function dealCards() {
        game.dealCards();
    }

</script>

<main>
    <Button on:click={dealCards} customClasses="w-50 btn__green">Start Game!</Button>
    <div class="game-board">
        <div class="card-section card-section__enemy">
            <GGCard blurred={true} />
            <GGCard blurred={true} />
            <GGCard blurred={true} />
            <GGCard blurred={true} />
            <GGCard blurred={true} />
        </div>
        <div class="card-section card-section__ally">
            <GGCard />
            <GGCard />
            <GGCard />
            <GGCard />
            <GGCard />
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