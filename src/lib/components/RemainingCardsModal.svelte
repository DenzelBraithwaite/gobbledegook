<script>
// @ts-nocheck

  // Hooks
  import { createEventDispatcher } from 'svelte';

  // Transitions
  import { fade } from 'svelte/transition';

  // Stores
  import { cardDetails } from '../stores';

  // Components
  import { Card } from './index';

  // Props
  export let fullDeck = {};
  export let deckTypes = [];

  const createEvent = createEventDispatcher();
  const humanCardsRemaining = fullDeck['humans'] ?? [];
  const goblinCardsRemaining = fullDeck['goblins'] ?? [];
  const elfCardsRemaining = fullDeck['elves'] ?? [];
  const dwarfCardsRemaining = fullDeck['dwarves'] ?? [];
  const beastCardsRemaining = fullDeck['beasts'] ?? [];
  const botCardsRemaining = fullDeck['bots'] ?? [];
  const xenoCardsRemaining = fullDeck['xenos'] ?? [];
  const spiritCardsRemaining = fullDeck['spirits'] ?? [];
  const boostCardsRemaining = fullDeck['boosts'] ?? [];
  const trapCardsRemaining = fullDeck['traps'] ?? [];
  const neutralCardsRemaining = fullDeck['neutrals'] ?? [];
  const totalCardsLeft = humanCardsRemaining.length + goblinCardsRemaining.length + elfCardsRemaining.length + dwarfCardsRemaining.length + beastCardsRemaining.length + botCardsRemaining.length + xenoCardsRemaining.length + spiritCardsRemaining.length + boostCardsRemaining.length + trapCardsRemaining.length + neutralCardsRemaining.length;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<main class="main-content" transition:fade>
<!-- Close X -->
  <svg on:click={() => createEvent('close')} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="x-icon">
    <circle cx="12" cy="12" r="10"/>
    <path d="m15 9-6 6"/>
    <path d="m9 9 6 6"/>
  </svg>
  
  <h2 class="section-title">Total Remaining Cards({totalCardsLeft})</h2>
  <h2 class="section-title">Remaining Humans({humanCardsRemaining.length})</h2>
  <div class="deck-section human-section" id="human-section">
    {#each humanCardsRemaining as card}
      <Card
        displayTitle={$cardDetails[card].displayTitle}
        title={$cardDetails[card].title}
        img={$cardDetails[card].image}
        description={$cardDetails[card].description}
        traitTitle={$cardDetails[card].traitTitle}
        trait={$cardDetails[card].trait}
        race={$cardDetails[card].race}
        rarity={$cardDetails[card].rarity}
        points={$cardDetails[card].points}/>
    {/each}
  </div>

  <h2 class="section-title">Remaining Goblins({goblinCardsRemaining.length})</h2>
  <div class="deck-section goblin-section" id="goblin-section">
    {#each goblinCardsRemaining as card}
      <Card
        displayTitle={$cardDetails[card].displayTitle}
        title={$cardDetails[card].title}
        img={$cardDetails[card].image}
        description={$cardDetails[card].description}
        traitTitle={$cardDetails[card].traitTitle}
        trait={$cardDetails[card].trait}
        race={$cardDetails[card].race}
        rarity={$cardDetails[card].rarity}
        points={$cardDetails[card].points}/>
    {/each}
  </div>

  <h2 class="section-title">Remaining Elves({elfCardsRemaining.length})</h2>
  <div class="deck-section elf-section" id="elf-section">
    {#each elfCardsRemaining as card}
      <Card
        displayTitle={$cardDetails[card].displayTitle}
        title={$cardDetails[card].title}
        img={$cardDetails[card].image}
        description={$cardDetails[card].description}
        traitTitle={$cardDetails[card].traitTitle}
        trait={$cardDetails[card].trait}
        race={$cardDetails[card].race}
        rarity={$cardDetails[card].rarity}
        points={$cardDetails[card].points}/>
    {/each}
  </div>

  <h2 class="section-title">Remaining Dwarves({dwarfCardsRemaining.length})</h2>
  <div class="deck-section dwarf-section" id="dwarf-section">
    {#each dwarfCardsRemaining as card}
      <Card
        displayTitle={$cardDetails[card].displayTitle}
        title={$cardDetails[card].title}
        img={$cardDetails[card].image}
        description={$cardDetails[card].description}
        traitTitle={$cardDetails[card].traitTitle}
        trait={$cardDetails[card].trait}
        race={$cardDetails[card].race}
        rarity={$cardDetails[card].rarity}
        points={$cardDetails[card].points}/>
    {/each}
  </div>

  <h2 class="section-title">Remaining Beasts({beastCardsRemaining.length})</h2>
  <div class="deck-section beast-section" id="beast-section">
    {#each beastCardsRemaining as card}
      <Card
        displayTitle={$cardDetails[card].displayTitle}
        title={$cardDetails[card].title}
        img={$cardDetails[card].image}
        description={$cardDetails[card].description}
        traitTitle={$cardDetails[card].traitTitle}
        trait={$cardDetails[card].trait}
        race={$cardDetails[card].race}
        rarity={$cardDetails[card].rarity}
        points={$cardDetails[card].points}/>
    {/each}
  </div>

  <h2 class="section-title">Remaining Bots({botCardsRemaining.length})</h2>
  <div class="deck-section bot-section" id="bot-section">
    {#each botCardsRemaining as card}
      <Card
        displayTitle={$cardDetails[card].displayTitle}
        title={$cardDetails[card].title}
        img={$cardDetails[card].image}
        description={$cardDetails[card].description}
        traitTitle={$cardDetails[card].traitTitle}
        trait={$cardDetails[card].trait}
        race={$cardDetails[card].race}
        rarity={$cardDetails[card].rarity}
        points={$cardDetails[card].points}/>
    {/each}
  </div>

  <h2 class="section-title">Remaining Xenos({xenoCardsRemaining.length})</h2>
  <div class="deck-section xeno-section" id="xeno-section">
    {#each xenoCardsRemaining as card}
      <Card
        displayTitle={$cardDetails[card].displayTitle}
        title={$cardDetails[card].title}
        img={$cardDetails[card].image}
        description={$cardDetails[card].description}
        traitTitle={$cardDetails[card].traitTitle}
        trait={$cardDetails[card].trait}
        race={$cardDetails[card].race}
        rarity={$cardDetails[card].rarity}
        points={$cardDetails[card].points}/>
    {/each}
  </div>

  <h2 class="section-title">Remaining Spirits({spiritCardsRemaining.length})</h2>
  <div class="deck-section spirit-section" id="spirit-section">
    {#each spiritCardsRemaining as card}
      <Card
        displayTitle={$cardDetails[card].displayTitle}
        title={$cardDetails[card].title}
        img={$cardDetails[card].image}
        description={$cardDetails[card].description}
        traitTitle={$cardDetails[card].traitTitle}
        trait={$cardDetails[card].trait}
        race={$cardDetails[card].race}
        rarity={$cardDetails[card].rarity}
        points={$cardDetails[card].points}/>
    {/each}
  </div>

  <h2 class="section-title">Remaining Boosts({boostCardsRemaining.length})</h2>
  <div class="deck-section boost-section" id="boost-section">
    {#each boostCardsRemaining as card}
      <Card
        displayTitle={$cardDetails[card].displayTitle}
        title={$cardDetails[card].title}
        img={$cardDetails[card].image}
        description={$cardDetails[card].description}
        traitTitle={$cardDetails[card].traitTitle}
        trait={$cardDetails[card].trait}
        race={$cardDetails[card].race}
        rarity={$cardDetails[card].rarity}
        points={$cardDetails[card].points}/>
    {/each}
  </div>

  <h2 class="section-title">Remaining Traps({trapCardsRemaining.length})</h2>
  <div class="deck-section trap-section" id="trap-section">
    {#if deckTypes.includes('traps')}
      {#each trapCardsRemaining as card}
        <Card
          displayTitle={$cardDetails[card].displayTitle}
          title={$cardDetails[card].title}
          img={$cardDetails[card].image}
          description={$cardDetails[card].description}
          traitTitle={$cardDetails[card].traitTitle}
          trait={$cardDetails[card].trait}
          race={$cardDetails[card].race}
          rarity={$cardDetails[card].rarity}
          points={$cardDetails[card].points}/>
      {/each}
    {/if}
  </div>

  <h2 class="section-title">Remaining Neutrals({neutralCardsRemaining.length})</h2>
  <div class="deck-section neutral-section" id="neutral-section">
    {#each neutralCardsRemaining as card}
      <Card
        displayTitle={$cardDetails[card].displayTitle}
        title={$cardDetails[card].title}
        img={$cardDetails[card].image}
        description={$cardDetails[card].description}
        traitTitle={$cardDetails[card].traitTitle}
        trait={$cardDetails[card].trait}
        race={$cardDetails[card].race}
        rarity={$cardDetails[card].rarity}
        points={$cardDetails[card].points}/>
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
    margin-left: auto;
    margin-right: auto;

    display: grid;
    grid-template-columns: repeat(5, 1fr);
  }

  .x-icon {
    z-index: 7; // 1 higher than library to make sure it's never hidden behind.
    stroke: #d44215;
    fill: #d442158a;
    border: 1px solid #d44215;
    border-radius: 0.5rem;
    stroke-width: 1.5;
    background-color: #0c0c0cd3;
    width: 40px;
    padding: 0.125rem;
    transition: all 0.15s ease-out;

    position: sticky;
    top: 0;

    &:hover {
      cursor: pointer;
      stroke: #327738;
      fill: #32773874;
      scale: 1.1;
      border: 1px solid #327738;
    }
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

  .spirit-section {
    background: linear-gradient(to top left, #b63bacb4, #b390b7b4, #b63bacb4);
  }

  .boost-section {
    background: linear-gradient(to top left, #90beffb4, #8bc8d1b4, #90beffb4);
  }

  .trap-section {
    background: linear-gradient(353deg, #000000, #ffffff4a 50%);
  }

  .neutral-section {
    background: linear-gradient(353deg,#31273e,#933ce929 50%);
  }
</style>