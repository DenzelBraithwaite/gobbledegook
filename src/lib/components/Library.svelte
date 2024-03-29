<script>
  // Stores
  import { cardDetails } from '../stores';

  // Props
  import { Card, LibraryCard } from './index';

  // These will result in a multi-dimensional array [[card, details], [card, details]...]
  const humanCards = Object.entries($cardDetails).filter(([card, details]) => details.race === 'human');
  const goblinCards = Object.entries($cardDetails).filter(([card, details]) => ['goblin', 'goblin-ish'].includes(details.race));
  const elfCards = Object.entries($cardDetails).filter(([card, details]) => details.race === 'elf');
  const dwarfCards = Object.entries($cardDetails).filter(([card, details]) => details.race === 'dwarf');
  const botCards = Object.entries($cardDetails).filter(([card, details]) => details.race === 'bot');
  const beastCards = Object.entries($cardDetails).filter(([card, details]) => details.race === 'beast');
  const xenoCards = Object.entries($cardDetails).filter(([card, details]) => details.race === 'xeno');
  const boostCards = Object.entries($cardDetails).filter(([card, details]) => details.race === 'boost');
  const trapCards = Object.entries($cardDetails).filter(([card, details]) => details.race === 'trap');
  const neutralCards = Object.entries($cardDetails).filter(([card, details]) => details.race === 'neutral');
</script>

<main class="main-content">
  <!-- Humans -->
  <div class="deck-section">
    {#each humanCards as keyValuePair}
      <div class="card-wrapper">
        <!-- Card art -->
        <LibraryCard
          displayTitle={keyValuePair[1].displayTitle}
          title={keyValuePair[1].title}
          img={keyValuePair[1].image}
          description={keyValuePair[1].description}
          trait={keyValuePair[1].trait}
          traitTitle={keyValuePair[1].traitTitle}
          race={keyValuePair[1].race}
          rarity={keyValuePair[1].rarity}
          points={keyValuePair[1].points}
        />
      </div>
    {/each}
  </div>

  <!-- Goblins -->
  <div class="deck-section">
    {#each goblinCards as keyValuePair}
      <div class="card-wrapper">
        <!-- Card art -->
        <LibraryCard
          displayTitle={keyValuePair[1].displayTitle}
          title={keyValuePair[1].title}
          img={keyValuePair[1].image}
          description={keyValuePair[1].description}
          trait={keyValuePair[1].trait}
          traitTitle={keyValuePair[1].traitTitle}
          race={keyValuePair[1].race}
          rarity={keyValuePair[1].rarity}
          points={keyValuePair[1].points}
        />
      </div>
    {/each}
  </div>

  <!-- Elves -->
  <div class="deck-section">
    {#each elfCards as keyValuePair}
      <div class="card-wrapper">
        <!-- Card art -->
        <LibraryCard
          displayTitle={keyValuePair[1].displayTitle}
          title={keyValuePair[1].title}
          img={keyValuePair[1].image}
          description={keyValuePair[1].description}
          trait={keyValuePair[1].trait}
          traitTitle={keyValuePair[1].traitTitle}
          race={keyValuePair[1].race}
          rarity={keyValuePair[1].rarity}
          points={keyValuePair[1].points}
        />
      </div>
    {/each}
  </div>

  <!-- Dwarves -->
  <div class="deck-section">
    {#each dwarfCards as keyValuePair}
      <div class="card-wrapper">
        <!-- Card art -->
        <LibraryCard
          displayTitle={keyValuePair[1].displayTitle}
          title={keyValuePair[1].title}
          img={keyValuePair[1].image}
          description={keyValuePair[1].description}
          trait={keyValuePair[1].trait}
          traitTitle={keyValuePair[1].traitTitle}
          race={keyValuePair[1].race}
          rarity={keyValuePair[1].rarity}
          points={keyValuePair[1].points}
        />
      </div>
    {/each}
  </div>

  <!-- Beasts -->
  <div class="deck-section">
    {#each beastCards as keyValuePair}
      <div class="card-wrapper">
        <!-- Card art -->
        <LibraryCard
          displayTitle={keyValuePair[1].displayTitle}
          title={keyValuePair[1].title}
          img={keyValuePair[1].image}
          description={keyValuePair[1].description}
          trait={keyValuePair[1].trait}
          traitTitle={keyValuePair[1].traitTitle}
          race={keyValuePair[1].race}
          rarity={keyValuePair[1].rarity}
          points={keyValuePair[1].points}
        />
      </div>
    {/each}
  </div>

  <!-- Bots -->
  <div class="deck-section">
    {#each botCards as keyValuePair}
      <div class="card-wrapper">
        <!-- Card art -->
        <LibraryCard
          displayTitle={keyValuePair[1].displayTitle}
          title={keyValuePair[1].title}
          img={keyValuePair[1].image}
          description={keyValuePair[1].description}
          trait={keyValuePair[1].trait}
          traitTitle={keyValuePair[1].traitTitle}
          race={keyValuePair[1].race}
          rarity={keyValuePair[1].rarity}
          points={keyValuePair[1].points}
        />
      </div>
    {/each}
  </div>

  <!-- Xenos -->
  <div class="deck-section">
    {#each xenoCards as keyValuePair}
      <div class="card-wrapper">
        <!-- Card art -->
        <LibraryCard
          displayTitle={keyValuePair[1].displayTitle}
          title={keyValuePair[1].title}
          img={keyValuePair[1].image}
          description={keyValuePair[1].description}
          trait={keyValuePair[1].trait}
          traitTitle={keyValuePair[1].traitTitle}
          race={keyValuePair[1].race}
          rarity={keyValuePair[1].rarity}
          points={keyValuePair[1].points}
        />
      </div>
    {/each}
  </div>

  <!-- Boosts -->
  <div class="deck-section">
    {#each boostCards as keyValuePair}
      <div class="card-wrapper">
        <!-- Card art -->
        <LibraryCard
          displayTitle={keyValuePair[1].displayTitle}
          title={keyValuePair[1].title}
          img={keyValuePair[1].image}
          description={keyValuePair[1].description}
          trait={keyValuePair[1].trait}
          traitTitle={keyValuePair[1].traitTitle}
          race={keyValuePair[1].race}
          rarity={keyValuePair[1].rarity}
          points={keyValuePair[1].points}
        />
      </div>
    {/each}
  </div>

  <!-- Traps -->
  <div class="deck-section">
    {#each trapCards as keyValuePair}
      <div class="card-wrapper">
        <!-- Card art -->
        <LibraryCard
          displayTitle={keyValuePair[1].displayTitle}
          title={keyValuePair[1].title}
          img={keyValuePair[1].image}
          description={keyValuePair[1].description}
          trait={keyValuePair[1].trait}
          traitTitle={keyValuePair[1].traitTitle}
          race={keyValuePair[1].race}
          rarity={keyValuePair[1].rarity}
          points={keyValuePair[1].points}
        />
      </div>
    {/each}
  </div>

  <!-- Neutral -->
  <div class="deck-section">
    {#each neutralCards as keyValuePair}
      <div class="card-wrapper">
        <!-- Card art -->
        <LibraryCard
          displayTitle={keyValuePair[1].displayTitle}
          title={keyValuePair[1].title}
          img={keyValuePair[1].image}
          description={keyValuePair[1].description}
          trait={keyValuePair[1].trait}
          traitTitle={keyValuePair[1].traitTitle}
          race={keyValuePair[1].race}
          rarity={keyValuePair[1].rarity}
          points={keyValuePair[1].points}
        />
      </div>
    {/each}
  </div>

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
    background-color: #000000f6;
    overflow-y: scroll;
    border-radius: 0.5rem;
    box-shadow: 0 0.5rem 2rem #00000080;
    border: 2px solid #0d3010;

    position: fixed;
    bottom: 50%;
    right: 50%;
    transform: translate(50%, 50%);
  }

  .deck-section {
    margin-bottom: 5rem;
  }

  .card-wrapper {
    margin: 1.5rem auto 0;
    width: 90%;
  }

  .grid {  
    display: grid;
    grid-template-columns: repeat(5, minmax(3.5rem, 9.5rem)); // Match small card size mobile
    gap: 1rem;
    justify-content: center;
  }
</style>