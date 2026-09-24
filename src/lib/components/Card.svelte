<script lang="ts">
  // hooks
  import { createEventDispatcher } from 'svelte';

  // stores
  import { cardDetails } from '../stores';

  // Transitions
  import { fly, fade } from 'svelte/transition';

  // props
  export let faceUp = true;
  export let displayTitle = 'Title here...';
  export let title = '';
  export let img = '/card-bg-goblin.png';
  export let points = 0;
  export let modifiedPoints = 0;
  export let race = 'none';
  export let rarity: 'legendary' | 'epic' | 'amazing' | 'great' | 'poor' = 'poor';
  export let description = '';
  export let trait = '';
  export let traitTitle = '';
  export let buffed = false;
  export let reduced = false;

  $: if (race === 'goblin-ish') race = 'goblin';

  const createEvent = createEventDispatcher();
  // ai generated: These 3×3 positions mirror dice pips: corners, diagonals, and a center star for odd rarities.
  const rarityStarPositions = {
    legendary: [1, 3, 5, 7, 9],
    epic: [1, 3, 7, 9],
    amazing: [1, 5, 9],
    great: [1, 9],
    poor: [5]
  };

  function cardClickHandler(event) {    
    createEvent('cardClick', {
      'title': title,
      'points': points,
      'race': race,
      'trait': trait
    })
  }

  function capitalize(string){
    const firstHalf = string[0].toUpperCase();
    const secondHalf = string.slice(1);
    return firstHalf + secondHalf;
  };

  // ai generated: Text stars can inherit soft race colors and sit at fixed dice positions.
  function displayRarityStars(rarity: 'legendary' | 'epic' | 'amazing' | 'great' | 'poor'): number[] {
    return rarityStarPositions[rarity];
  }
</script>

{#if !faceUp}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div on:click class="card facedown bottom-deck" in:fly={{x: 100}} out:fade></div>
{:else}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!-- If card is legendary, shows special race colors, otherwise matches race color -->
  <div on:contextmenu|preventDefault on:click={cardClickHandler} class="card bg-{race}{rarity === 'legendary' ? '-rare' : ''}" in:fly={{x: 100}} out:fade>
    <img class="card-img" src={img} alt="img of card">
    <!-- ai generated: This compact rarity badge mirrors the point badge on the opposite top corner. -->
    <p class="rarity {race}-race-transparent height-24" aria-label="{capitalize($cardDetails[title].rarity)} rarity">
      <span class="rarity-stars" aria-hidden="true">
        {#each displayRarityStars($cardDetails[title].rarity) as position}
          <span class="rarity-star" style={`grid-area: ${Math.ceil(position / 3)} / ${((position - 1) % 3) + 1}`}>★</span>
        {/each}
      </span>
    </p>
    <p class="race {race}-race-transparent">{capitalize(race)}</p>
    <p class="points {race}-race" class:line-through={buffed || reduced}>{points}</p>
    {#if buffed || reduced}
      <p class="points__modified {race}-race" class:points__modified--reduced={reduced}>{modifiedPoints}</p>
    {/if}
    <p class="card-title {race}-title">{displayTitle}</p>
    <div class="card-bottom-section">
      <div class="bottom-section-wrapper">
        {#if trait}
          <p class="trait-title">{traitTitle}</p>
          <p>{trait}</p>
          <hr>
          <p class="description-title">Description</p>
        {/if}
        <p>{description}</p>
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  .card {
    z-index: 0;
    cursor: pointer;
    position: relative;
    width: 9.5rem;
    height: 14rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3882352941);
    border-radius: 6px 6px 0 0;
    transition: all 0.3s ease-out;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;

    &:hover {
      scale: 1.4;
      z-index: 2;
      box-shadow: 0 4px 12px #000000a8;
    }
  }

  .card-bottom-section {
    position: relative;
    width: 100%;
    height: 100%;
    background-color: #ffffff3b;
    overflow-y: scroll;
    text-align: center;
    line-height: 1.125;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .card-title {
    color: #ddd;
    width: 100%;
    height: 3rem;
    text-shadow: 0 2px 8px #000000a8;
    font-size: 1.25rem;
    font-weight: bold;
    text-align: center;
    z-index: 10;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-img {
    height: 45%;
    width: 100%;
    object-fit: contain;
    object-position: center;
    border-radius: 0.25rem 0.25rem 0 0;
  }

  .bottom-section-wrapper::-webkit-scrollbar,
  .card-bottom-section::-webkit-scrollbar {
    background: transparent;
    width: 0;
  }

  .bottom-section-wrapper {
    width: 90%;
    padding-bottom: 0.9rem;
    font-size: 0.85rem;
    color: #ebebeb;
    text-shadow: 0 1px 3px #0000008f;
    padding-top: 0.5rem;
    overflow-y: scroll;
  }

  .race,
  .rarity {
    color: #eee;
    z-index: 10;
    text-align: center;
    font-weight: 500;
    font-size: 0.8rem;
    letter-spacing: 1px;
    height: 1.5rem;
    max-height: 100%;
    padding: 0.125rem;
    position: absolute;
    width: 105%;

    display: flex;
    align-items: center;
    justify-content: center;
  }

  .race {
    border-radius: 0 0 6px 6px;
    // width: 3.75rem;

    bottom: -18px;
    right: 50%;
    transform: translate(50%, 0);
  }

  .rarity {
    /* ai generated: Match the point badge's footprint, mirrored into the top-right corner. */
    border-radius: 0 0 0 0.75rem;
    box-shadow: inset -2px -2px 8px #0000004d;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0;
    top: 0;
    right: 0;
  }

  /* ai generated: A fixed grid gives each rarity the same centered dice geometry. */
  .rarity-stars {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    place-items: center;
    width: 100%;
    height: 100%;
  }

  .rarity-star {
    font-size: 0.45rem;
    line-height: 1;
    text-shadow: 0 1px 2px #00000045;
  }

  .rarity.human-race-transparent { color: #afd3cd; }
  .rarity.goblin-race-transparent { color: #b9d6af; }
  .rarity.elf-race-transparent { color: #dfcdec; }
  .rarity.dwarf-race-transparent { color: #d8b3a2; }
  .rarity.beast-race-transparent { color: #d2b889; }
  .rarity.bot-race-transparent { color: #ced1d2; }
  .rarity.xeno-race-transparent { color: #d5ca92; }
  .rarity.spirit-race-transparent { color: #dfb9d7; }
  .rarity.boost-race-transparent { color: #c5dbe2; }
  .rarity.trap-race-transparent { color: #b9b9c2; }
  .rarity.neutral-race-transparent { color: #d2c0dc; }

  .points {
    color: #eee;
    z-index: 10;
    text-align: center;
    font-weight: 500;
    font-size: 0.9rem;
    letter-spacing: 1px;
    height: 1.75rem;
    width: 1.75rem;
    border-radius: 0 0 0.75rem 0;
    box-shadow: inset -2px -2px 8px #0000004d;

    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .points__modified {
    color: #2fdb2f;
    font-weight: bold;
    font-size: 0.9rem;
    z-index: 10;
    text-align: center;
    letter-spacing: 1px;
    height: 1.75rem;
    width: 1.75rem;
    border-radius: 0 0.75rem 0.75rem 0;
    box-shadow: inset -2px -2px 8px #0000004d;

    position: absolute;
    top: 30px;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .points__modified--reduced {
    color: #ff4d4d;
  }

  .trait-title {
    font-weight: bold;
    color: #fdf3c8;
    margin-bottom: 0.25rem;
  }

  .description-title {
    font-weight: bold;
    margin-bottom: 0.25rem;
  }

  .facedown {
    background: url('/card-bg-goblin.png');
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
    border: 3px double #c5a88a94;
   
    &:hover {
      scale: 1.05;
      transform: translate(0, -0.4rem);
    }

    &:active {
      scale: 1;
    }
  }

  /* Utility classes */
  .line-through {
    text-decoration: line-through;
  }
  
  .flip-180 {
    transform: rotate(0.5turn);
  }
  
  /* bg color based on race */
  .bg-human {
    background: linear-gradient(to top left, #324277, #69c0ad 50%);
    outline: 4px solid #324277a8;
  }

  .bg-human-rare {
    background: linear-gradient(to top left, #324277 5%, #e0de69, #69c0ad 90%);
    outline: 4px solid #324277a8;
  }

  .bg-goblin {
    background: linear-gradient(to top left, #327738, #78c069 50%);
    outline: 4px solid #327738a8;
  }
  
  .bg-goblin-rare {
    background: linear-gradient(to top left, #327738 5%, #e0de69, #78c069 90%);
    outline: 4px solid #327738a8;
  }
  
  .bg-elf {
    background: linear-gradient(to top left, #726b7a, #ddceee 50%);
    outline: 4px solid #726b7a;
  }
  
  .bg-elf-rare {
    background: linear-gradient(to top left, #726b7a 5%, #e0de69, #ddceee 90%);
    outline: 4px solid #726b7a;
  }

  .bg-dwarf {
    background: linear-gradient(to top left, #774b32, #c07369 50%);
    outline: 4px solid #774b32a8;
  }
  
  .bg-dwarf-rare {
    background: linear-gradient(to top left, #774b32 5%, #e0de69, #c07369 90%);
    outline: 4px solid #774b32a8;
  }

  .bg-beast {
    background: linear-gradient(to top left, #55431e, #855a2a 50%);
    outline: 4px solid #55431e;
  }
  
  .bg-beast-rare {
    background: linear-gradient(to top left, #614d22 5%, #e0de69b6, #855a2a 90%);
    outline: 4px solid #774b32a8;
  }
  
  .bg-bot {
    background: linear-gradient(to top left, #424242, #7e7e7e 50%);
    outline: 4px solid #424242;
  }
  
  .bg-bot-rare {
    background: linear-gradient(to top left, #424242 5%, #e0de69, #7e7e7e 90%);
    outline: 4px solid #424242;
  }

  .bg-xeno {
    background: linear-gradient(to top left,#776832,#c2a84c 50%);
    outline: 4px solid #957c1e;
  }

  .bg-spirit {
    background: linear-gradient(to top left, #b63bac00, #b390b7 50%);
    outline: 4px solid #c173baa8;
  }
  
  .bg-spirit-rare {
    background: linear-gradient(to top left, #b63bac00 5%, #e0de69, #b390b7 90%);
    outline: 4px solid #c173baa8;
  }

  .bg-boost {
    background: linear-gradient(353deg, #90beff, #8bc8d13d 50%);
    outline: 4px solid #eeeeeed4;
  }
  
  .bg-boost-rare {
    background: linear-gradient(to top left, #90beff47 5%, #fffecdbf, #90beff47 90%);
    outline: 4px solid #eeeeeed4;
  }

  .bg-trap {
    background: linear-gradient(353deg, #000000, #ffffff4a 50%);
    outline: 4px solid #111111;
  }
  
  .bg-trap-rare {
    background: linear-gradient(to top left, #000000 5%, #fffecdbf, #000000 90%);
    outline: 4px solid #111111;
  }

  .bg-neutral {
    background: linear-gradient(353deg,#31273e,#933ce929 50%);
    outline: 4px solid #3d1f5a;
  }
  
  .bg-neutral-rare {
    background: linear-gradient(to top left, #31273e 5%, #fffecd69, #933ce929 90%);
    outline: 4px solid #3d1f5a;
  }

  /* Race text color */  
  .human-race {
    background-color: #324277;
    border: 2px solid #324277;
  }

  .human-race-transparent {
    background-color: #3242777d;
    border: 2px solid #324277;
    border-top: none;
    font-size: 0.85rem;
    height: 8%;
  }
  
  .goblin-race {
    background-color: #327738;
    border: 2px solid #327738;
  }

  .goblin-race-transparent {
    background-color: #3277387d;
    border: 2px solid #327738;
    border-top: none;
    font-size: 0.85rem;
    height: 8%;
  }

  .elf-race {
    background-color: #726b7a;
    border: 2px solid #726b7a;
  }

  .elf-race-transparent {
    background-color: #726b7a7d;
    border: 2px solid #726b7a;
    border-top: none;
    font-size: 0.85rem;
    height: 8%;
  }
  
  .dwarf-race {
    background-color: #774b32;
    border: 2px solid #774b32;
  }

  .dwarf-race-transparent {
    background-color: #774b327d;
    border: 2px solid #774b32;
    border-top: none;
    font-size: 0.85rem;
    height: 8%;
  }

  .beast-race {
    background-color: #55431e;
    border: 2px solid #55431e;
  }

  .beast-race-transparent {
    background-color: #55431e7d;
    border: 2px solid #55431e;
    border-top: none;
    font-size: 0.85rem;
    height: 8%;
  }
  
  .bot-race {
    background-color: #424242;
    border: 2px solid #424242;
  }

  .bot-race-transparent {
    background-color: #4242427d;
    border: 2px solid #424242;
    border-top: none;
    font-size: 0.85rem;
    height: 8%;
  }
  
  .xeno-race {
    background-color: #8e7419;
    border: 2px solid #8e7419;
  }

  .xeno-race-transparent {
    background-color: #8e74197d;
    border: 2px solid #8e7419;
    border-top: none;
    font-size: 0.85rem;
    height: 8%;
  }

  .spirit-race {
    background-color: #b63bac;
    border: 2px solid #b63bac;
  }

  .spirit-race-transparent {
    background-color: #b63bac7d;
    border: 2px solid #b63bac;
    border-top: none;
    font-size: 0.85rem;
    height: 8%;
  }

  .boost-race {
    background-color: #a0aec8;
    border: 2px solid #a0aec8;
  }

  .boost-race-transparent {
    background-color: #a0aec87d;
    border: 2px solid #a0aec8;
    border-top: none;
    font-size: 0.85rem;
    height: 8%;
  }

  .trap-race {
    background-color: #111;
    border: 2px solid #3e3e3e12;
  }

  .trap-race-transparent {
    background-color: #1111117d;
    border: 2px solid #3e3e3e12;
    border-top: none;
    font-size: 0.85rem;
    height: 8%;
  }

  .neutral-race {
    background-color: #462e59;
    border: 2px solid #3b3b3b12;
  }

  .neutral-race-transparent {
    background-color: #462e597d;
    border: 2px solid #3b3b3b12;
    border-top: none;
    font-size: 0.85rem;
    height: 8%;
  }

  .height-24 {
    height: 24px;
  }

  /* race title color */
  .human-title {
    background-color: #3242775e;
  }
  
  .goblin-title {
    background-color: #3277385e;
  }
  
  .elf-title {
    background-color: #726b7a5e;
  }
  
  .dwarf-title {
    background-color: #774b325e;
  }
  
  .beast-title {
    background-color: #55431e5e;
  }
  
  .bot-title {
    background-color: #4242425e;
  }

  .xeno-title {
    background-color: #8e74195e;
  }

  .spirit-title {
    background-color: #b63bac5e;
  }

  .boost-title {
    background-color: #ffffff5e;
  }

  .trap-title {
    background-color: #0000005e;
  }

  .neutral-title {
    background-color: #3b1d4e5e;
  }

  // Utility
  @media only screen and (max-width: 1100px) {
    .rarity {
      width: 0.9rem;
      height: 0.9rem;
    }

    .rarity-star { font-size: 0.22rem; }

    .card {
      width: 6.5rem;
      min-width: 6.5rem;
      height: 9rem;
      min-height: 9rem;
    }

    .card-title {
      height: 1.25rem;
      font-size: 0.85rem;
    }

  .bottom-section-wrapper::-webkit-scrollbar,
    .card-bottom-section::-webkit-scrollbar {
      background: transparent;
      width: 0;
    }

    .bottom-section-wrapper {
      padding-bottom: 0.9rem;
      font-size: 0.5rem;
      padding-top: 0.125rem;
    }

    .race {
      font-size: 0.4rem;
      height: 1rem;
      padding: 0.125rem;
      width: 2rem;

      bottom: -0.5rem;
      left: 50%;
      transform: translateX(-50%);
    }

    .points {
      font-size: 0.4rem;
      height: 0.9rem;
      width: 0.9rem;
      border-radius: 0 0 0.4rem 0;
    }

    .points__modified {
      font-size: 0.4rem;
      height: 0.9rem;
      width: 0.9rem;
      border-radius: 0 0.4rem 0.4rem 0;
      top: 16px;
    }
  }

  .facedown {
    border: 3px double #c5a98a76;
  }

  @media only screen and (max-width: 800px) {
    .rarity-star { font-size: 0.2rem; }

    .card {
      width: 3.5rem;
      min-width: 3.5rem;
      height: 6rem;
      min-height: 6rem;
    }

    .card-title {
      height: 1rem;
      font-size: 0.45rem;
    }

  .bottom-section-wrapper::-webkit-scrollbar,
    .card-bottom-section::-webkit-scrollbar {
      background: transparent;
      width: 0;
    }

    .bottom-section-wrapper {
      padding-bottom: 0.9rem;
      font-size: 0.5rem;
      padding-top: 0.125rem;
    }

    .race {
      font-size: 0.4rem;
      height: 1rem;
      padding: 0.125rem;

      bottom: -0.5rem;
      left: 50%;
      transform: translateX(-50%);
    }

    .points {
      font-size: 0.4rem;
      height: 0.9rem;
      width: 0.9rem;
      border-radius: 0 0 0.4rem 0;
    }

    .points__modified {
      font-size: 0.4rem;
      height: 0.9rem;
      width: 0.9rem;
      border-radius: 0 0.4rem 0.4rem 0;
      top: 16px;
    }
  }
</style>
