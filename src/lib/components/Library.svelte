<script>
  // Stores
  import { cardDetails } from '../stores';

  // Props
  import { Card, LibraryCard } from './index';

  // These will result in a multi-dimensional array [[card, details], [card, details]...]
  const humanCards = Object.entries($cardDetails).filter(([card, details]) => details.race === 'human');
  const goblinCards = Object.entries($cardDetails).filter(([card, details]) => details.race === 'goblin');
  const elfCards = Object.entries($cardDetails).filter(([card, details]) => details.race === 'elf');
  const dwarfCards = Object.entries($cardDetails).filter(([card, details]) => details.race === 'dwarf');
  const botCards = Object.entries($cardDetails).filter(([card, details]) => details.race === 'bot');
  const beastCards = Object.entries($cardDetails).filter(([card, details]) => details.race === 'beast');
  const xenoCards = Object.entries($cardDetails).filter(([card, details]) => details.race === 'xeno');
</script>

<!-- Humans -->
<main class="main-content">
  {#each humanCards as keyValuePair}
    <div class="card-details">
      <!-- Card art -->
      <!-- <LibraryCard
        displayTitle={keyValuePair[1].displayTitle}
        title={keyValuePair[1].title}
        img={keyValuePair[1].image}
        description={keyValuePair[1].description}
        race={keyValuePair[1].race}
        rarity={keyValuePair[1].rarity}
        points={keyValuePair[1].points}
      /> -->

      <!-- Card details -->
      <!-- <h2>Details here</h2> -->

      <!-- Card trait info -->
      <!-- <h2>Trait here</h2> -->
    </div>
  {/each}

  <!-- Card Grid -->
  <div class="grid">
    {#each Object.entries($cardDetails) as [card, details]}
        <Card
        displayTitle={$cardDetails[card].displayTitle}
        title={$cardDetails[card].title}
        img={$cardDetails[card].image}
        description={$cardDetails[card].description}
        traitTitle={$cardDetails[card].traitTitle}
        trait={$cardDetails[card].trait}
        race={$cardDetails[card].race}
        rarity={$cardDetails[card].rarity}
        points={$cardDetails[card].points}
        />
    {/each}
  </div>
</main>

<style lang="scss">
  .main-content {
    z-index: 5;
    height: 90dvh;
    width: 90dvw;
    padding: 1rem;
    background: linear-gradient(214deg, #ddceee99, #855a2a99, #69c0ad99, #78c06999, #c0736999, #c2a84c99);
    overflow-y: scroll;
    border-radius: 0.5rem;
    box-shadow: 0 0.5rem 2rem #00000080;
    border: 2px solid #327738;

    position: fixed;
    bottom: 50%;
    right: 50%;
    transform: translate(50%, 50%);
  }

  .card-details {
    margin-bottom: 1rem;

    display: flex;
    justify-content: space-evenly;
    align-items: center;
  }

  .grid {  
    display: grid;
    grid-template-columns: repeat(5, minmax(3.5rem, 9.5rem)); // Match small card size mobile
    gap: 1rem;
    justify-content: center;
  }
</style>