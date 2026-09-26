<script lang="ts">
  // Transitions
  import { fade } from 'svelte/transition';

  // Stores
  import { cardDetails, type Player } from '../stores';

  // Components
  import { Card } from './index';
  
  // Props
  export let draws: string[] = [];
  export let discards: string[] = [];
  export let player: Player;
  export let otherNeutralEffects: string[] = [];
  export let boostsBlocked = false;
  export let trapsBlocked = false;

  // ai generated: Rebuild these lists when cards change so an open modal reflects the current turn.
  $: drawsWithCardDetails = draws.map(card => $cardDetails[card]);
  $: discardsWithCardDetails = discards.map(card => $cardDetails[card]);
</script>

<main class="main-content" transition:fade>
  <!-- ai generated: Mirrors the player's end-game effect summary while the round is still in progress. -->
  <section class="effect-summary">
    <h2>Your effects</h2>
    <p>Boosts: <span class:line-through={boostsBlocked}>{player.boosts.join(', ') || 'None'}</span></p>
    <p>Charge Points: <span class:line-through={boostsBlocked}>{player.chargePoints}</span></p>
    <p>Growth Points: <span class:line-through={boostsBlocked}>{player.growthPoints}</span></p>
    <p>Traps: <span class:line-through={trapsBlocked}>{player.traps.join(', ') || 'None'}</span></p>
    <p>Infect Penalty: <span class:line-through={trapsBlocked}>{player.infectPoints}</span></p>
    <p>Neutral Cards: {player.neutrals.join(', ') || 'None'}</p>
    <p>Other Neutral Effects: {otherNeutralEffects.join(', ') || 'None'}</p>
    <p>Neutralized Cards: {player.neutralizedCards.join(', ') || 'None'}</p>
  </section>

  <div class="card-lists">
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
    // background: linear-gradient(to bottom, #324277a1, #327738a1, #ddceeea1, #c07369a1, #7e7e7ea1, #855a2aa1, #c2a84ca1, #b63baca1);
    background-color: #000000c2;
    overflow-y: auto;
    border-radius: 0.5rem;
    box-shadow: 0 0.5rem 2rem #00000080;
    border: 2px solid #0d3010;

    position: fixed;
    bottom: 50%;
    right: 50%;
    transform: translate(50%, 50%);

    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .effect-summary {
    padding: 0.75rem 1rem;
    color: #fff0d2;
    background-color: #000000c2;
    border-radius: 0.5rem;

    h2 {
      margin: 0 0 0.5rem;
    }

    p {
      margin: 0.2rem 0;
    }
  }

  .line-through {
    text-decoration: line-through;
  }

  .card-lists {
    border-radius: 0.5rem;
    display: flex;
    justify-content: space-around;
    gap: 1rem;
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

  .flex {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  /* Breakpoints */
  @media only screen and (max-width: 1100px) {
    .flex {
      gap: 14px;
    }
  }
</style>
