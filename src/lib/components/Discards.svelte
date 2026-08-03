<script lang="ts">
  // Transitions
  import { fade } from 'svelte/transition';

  // Stores
  import { cardDetails } from '../stores';

  // Components
  import { Card } from './index';
  
  // Props
  export let discards: string[] = ['wolf', 'dog', 'panther', 'rhino', 'lion', 'bear'];
  // discards = [
  //   'wolf', 'dog', 'panther', 'rhino', 'lion', 'bear',
  //   'wolf', 'dog', 'panther', 'rhino', 'lion', 'bear',
  //   'wolf', 'dog', 'panther', 'rhino', 'lion', 'bear'
  // ];

  // These will result in a multi-dimensional array [[card, details], [card, details]...]
  let discardsWithCardDetails = [];
  discards.forEach(d => discardsWithCardDetails.push($cardDetails[d]));
</script>

<main class="main-content" transition:fade>
  <!-- Card Grid -->
  <h2 class="section-title">Discards</h2>
  <div class="grid deck-section bg-rainbow">
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
  .main-content {
    z-index: 6;
    height: 90dvh;
    width: 90dvw;
    padding: 1rem;
    background-color: #000000be;
    overflow-y: auto;
    border-radius: 0.5rem;
    box-shadow: 0 0.5rem 2rem #00000080;
    border: 2px solid #0d3010;

    position: fixed;
    bottom: 50%;
    right: 50%;
    transform: translate(50%, 50%);
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

  .bg-rainbow {
    background: linear-gradient(to bottom, #324277b4, #327738b4, #ddceeeb4, #c07369b4, #7e7e7eb4, #855a2ab4, #c2a84c99);
  }

  /* Breakpoints */
  @media only screen and (max-width: 1100px) {
    .grid {  
      grid-template-columns: repeat(4, minmax(3.5rem, 7rem)); // Match small card size mobile
      gap: 0.5rem;
      justify-content: center;
    }
  }
</style>