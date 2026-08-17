<script lang="ts">
  // Transitions
  import { fade } from 'svelte/transition';

  // Stores
  import { cardDetails } from '../stores';

  // Components
  import { Card } from './index';
  
  // Props
  export let draws: string[] = [];
  export let discards: string[] = [];

  // These will result in a multi-dimensional array [[card, details], [card, details]...]
  let drawsWithCardDetails: any[] = [];
  let discardsWithCardDetails: any[] = [];
  draws.forEach(d => drawsWithCardDetails.push($cardDetails[d]));
  discards.forEach(d => discardsWithCardDetails.push($cardDetails[d]));
</script>

<main class="main-content" transition:fade>
  <div class="flex">
    <h2 class="section-title">Draws</h2>
    {#each drawsWithCardDetails as card}
        <Card
        displayTitle={card.displayTitle}
        title={card.title}
        img={card.image}
        description={card.description}
        traitTitle={card.traitTitle}
        trait={card.trait}
        race={card.race}
        rarity={card.rarity}
        points={card.points}
        />
    {/each}
  </div>

  <div class="flex">
    <h2 class="section-title">Discards</h2>
    {#each discardsWithCardDetails as card}
        <Card
        displayTitle={card.displayTitle}
        title={card.title}
        img={card.image}
        description={card.description}
        traitTitle={card.traitTitle}
        trait={card.trait}
        race={card.race}
        rarity={card.rarity}
        points={card.points}
        />
    {/each}
  </div>
</main>

<style lang="scss">
  ::-webkit-scrollbar {
    width: 8px;
    background-color: #0c0500d0;
  }

  ::-webkit-scrollbar-thumb {
    background-color: #003600;
    border-radius: 5px;
  }

  .main-content {
    z-index: 6;
    height: 90dvh;
    width: 80dvw;
    padding: 1rem;
    background: linear-gradient(to bottom, #324277a1, #327738a1, #ddceeea1, #c07369a1, #7e7e7ea1, #855a2aa1, #c2a84ca1, #b63baca1);
    overflow-y: auto;
    border-radius: 0.5rem;
    box-shadow: 0 0.5rem 2rem #00000080;
    border: 2px solid #0d3010;

    position: fixed;
    bottom: 50%;
    right: 50%;
    transform: translate(50%, 50%);

    display: flex;
    justify-content: space-around;
  }

  .grid {  
    display: grid;
    grid-template-columns: repeat(5, minmax(3.5rem, 9.5rem)); // Match small card size mobile
    gap: 1rem;
    justify-content: center;
    min-height: 75%;
  }

  .section-title {
    margin: 2.5rem auto 1rem;
    font-size: 2rem;
    text-align: center;
    color: #fff0d2;
    background-color: #00000059;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .deck-section {
    border-radius: 0.5rem;
    padding-top: 1rem;
    padding-bottom: 2rem;
    border-top: 2px solid #00000059;
  }

  .flex {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  /* Breakpoints */
  @media only screen and (max-width: 1100px) {
    .grid {  
      grid-template-columns: repeat(4, minmax(3.5rem, 7rem)); // Match small card size mobile
      gap: 0.5rem;
      justify-content: center;
    }

    .flex {
      gap: 14px;
    }
  }
</style>