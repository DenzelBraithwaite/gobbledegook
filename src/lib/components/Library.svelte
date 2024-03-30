<script>
  // Transitions
  import { fade } from 'svelte/transition';

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

<main class="main-content" transition:fade>
  <!-- Humans -->
  <div class="deck-section human-section">
    <h2 class="section-title">Humans</h2>
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
  <div class="deck-section goblin-section">
    <h2 class="section-title">Goblins</h2>
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
  <div class="deck-section elf-section">
    <h2 class="section-title">Elves</h2>
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
  <div class="deck-section dwarf-section">
    <h2 class="section-title">Dwarves</h2>
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
  <div class="deck-section beast-section">
    <h2 class="section-title">Beasts</h2>
    {#each beastCards as keyValuePair}
      <div class="card-wrapper beast-section">
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
  <div class="deck-section bot-section">
    <h2 class="section-title">Bots</h2>
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
  <div class="deck-section xeno-section">
    <h2 class="section-title">Xenos</h2>
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
  <div class="deck-section boost-section">
    <h2 class="section-title">Boosts</h2>
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
  <div class="deck-section trap-section">
    <h2 class="section-title">Traps</h2>
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
  <div class="deck-section neutral-section">
    <h2 class="section-title">Neutrals</h2>
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
  <h2 class="section-title">Full Deck</h2>
  <div class="grid deck-section bg-rainbow">
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
    background-color: #000000be;
    overflow-y: scroll;
    border-radius: 0.5rem;
    box-shadow: 0 0.5rem 2rem #00000080;
    border: 2px solid #0d3010;

    position: fixed;
    bottom: 50%;
    right: 50%;
    transform: translate(50%, 50%);
  }

  .card-wrapper {
    margin: 1.5rem auto 0;
    width: 60%;
    max-width: 1000px;
  }

  .grid {  
    display: grid;
    grid-template-columns: repeat(5, minmax(3.5rem, 9.5rem)); // Match small card size mobile
    gap: 1rem;
    justify-content: center;
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

  .human-section {
    background: linear-gradient(to top left, #324277b4, #69c0adb4, #324277b4);
  }

  .goblin-section {
    background: linear-gradient(to top left, #327738b4, #78c069b4, #327738b4);
  }

  .elf-section {
    background: linear-gradient(to top left, #726b7ab4, #ddceeeb4, #726b7ab4);
  }

  .dwarf-section {
    background: linear-gradient(to top left, #774b32b4, #c07369b4, #774b32b4);
  }

  .bot-section {
    background: linear-gradient(to top left, #424242b4, #7e7e7eb4, #424242b4);
  }

  .beast-section {
    background: linear-gradient(to top left, #55431eb4, #855a2ab4, #55431eb4);
  }

  .xeno-section {
    background: linear-gradient(to top left, #776832b4, #c2a84cb4, #776832b4);
  }

  .boost-section {
    background: linear-gradient(to top left, #90beffb4, #8bc8d1b4, #90beffb4);
  }

  .trap-section {
    background: linear-gradient(to top left, #327738b4, #78c069b4, #327738b4);
    background: linear-gradient(353deg, #000000, #ffffff4a 50%);
  }

  .neutral-section {
    background: linear-gradient(to top left, #327738b4, #78c069b4, #327738b4);
    background: linear-gradient(353deg,#31273e,#933ce929 50%);
  }

  .bg-rainbow {
    background: linear-gradient(to bottom, #324277b4, #327738b4, #ddceeeb4, #c07369b4, #7e7e7eb4, #855a2ab4, #c2a84c99);
  }

  /* Breakpoints */
  @media only screen and (max-width: 1100px) {
    .grid {  
      grid-template-columns: repeat(4, minmax(3.5rem, 7rem)); // Match small card size mobile
      gap: 1rem;
      justify-content: center;
    }
  }
</style>