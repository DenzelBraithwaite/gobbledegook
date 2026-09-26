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
  // ai generated: Exposed styling is a local display cue; it does not affect whether another player can see the card.
  export let exposed = false;

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
  <div on:contextmenu|preventDefault on:click={cardClickHandler} class="card bg-{race}{rarity === 'legendary' ? '-rare' : ''}" class:card--exposed={exposed} in:fly={{x: 100}} out:fade>
    <img class="card-img" src={img} alt="img of card">
    <!-- ai generated: This compact rarity badge mirrors the point badge on the opposite top corner. -->
    <p class="rarity {race}-rarity-star" aria-label="{capitalize($cardDetails[title].rarity)} rarity">
      <span aria-hidden="true">
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

    // ai generated: This wins over race backgrounds only for the local player's genuinely exposed cards.
    &.card--exposed {
      background: #00000082;
      outline: 4px dotted #000000f5;
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
    text-shadow: 0 2px 8px #00000096;
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
    padding-bottom: 2rem;
    font-size: 0.85rem;
    color: #ebebeb;
    text-shadow: 0 1px 3px #0000008f;
    padding-top: 0.5rem;
    overflow-y: scroll;
  }

  .points,
  .points__modified,
  .rarity,
  .race {
    z-index: 10;
    text-align: center;
    font-weight: normal;
    font-size: 0.9rem;
    letter-spacing: 1px;
    height: 1.75rem;
    width: 1.75rem;
    box-shadow: inset -2px -2px 8px #0000004d;
    position: absolute;
  }

  .race {
    color: #eee;
    font-size: 0.8rem;
    height: 1.6rem;
    width: 105%;
    padding: 0.125rem;
    box-shadow: none;
    border-radius: 25% 25% 0 0;
    
    bottom: 0px;
    right: 50%;
    transform: translate(50%, 4px);
  }

  .rarity {
    /* ai generated: Match the point badge's footprint, mirrored into the top-right corner. */
    border-radius: 0 0 0 6px;
    background-color: #00000060;
    box-shadow: inset -2px -2px 8px #0000004d;
    width: 10%;
    height: 48px;
    height: 22%;
    font-size: 0.75rem;
    padding: 0;
    writing-mode: vertical-lr;

    top: 0;
    right: 0;
  }

  .rarity-star {
    font-size: 0.45rem;
    line-height: 1;
    text-shadow: 0 1px 2px #00000045;
  }

  .rarity.human-rarity-star {
    background-color: #324277;
    color: #afd3cd;
  }

  .rarity.goblin-rarity-star {
    background-color: #327738;
    color: #b9d6af;
  }

  .rarity.elf-rarity-star {
    background-color: #726b7a;
    color: #dfcdec;
  }

  .rarity.dwarf-rarity-star {
    background-color: #774b32;
    color: #d8b3a2;
  }

  .rarity.beast-rarity-star {
    background-color: #55431e;
    color: #d2b889;
  }

  .rarity.bot-rarity-star {
    background-color: #424242;
    color: #ced1d2;
  }

  .rarity.xeno-rarity-star {
    background-color: #776832;
    color: #d5ca92;
  }

  .rarity.spirit-rarity-star {
    background-color: #b63bac;
    color: #dfb9d7;
  }

  .rarity.boost-rarity-star {
    background-color: #90beff;
    color: #c5dbe2;
  }

  .rarity.trap-rarity-star {
    background-color: #000000;
    color: #b9b9c2;
  }

  .rarity.neutral-rarity-star {
    background-color: #31273e;
    color: #d2c0dc;
  }

  .points {
    color: #eee;
    letter-spacing: 1px;
    border-radius: 0 0 0.75rem 0;

    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .points__modified {
    color: #2fdb2f;
    font-weight: bold;
    border-radius: 0 0.75rem 0.75rem 0;

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
    background: linear-gradient(353deg, #31273e, #933ce929 50%);
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
    border: 4px solid #324277a8;
    border-top: none;
    background-color: #324277;
    font-size: 0.85rem;
    height: 8%;
  }
  
  .goblin-race {
    background-color: #327738;
    border: 2px solid #327738;
  }

  .goblin-race-transparent {
    border: 4px solid #327738a8;
    border-top: none;
    background-color: #327738;
    font-size: 0.85rem;
    height: 8%;
  }

  .elf-race {
    background-color: #726b7a;
    border: 2px solid #726b7a;
  }

  .elf-race-transparent {
    border: 4px solid #726b7a;
    border-top: none;
    background-color: #726b7a;
    font-size: 0.85rem;
    height: 8%;
  }
  
  .dwarf-race {
    background-color: #774b32;
    border: 2px solid #774b32;
  }

  .dwarf-race-transparent {
    border: 4px solid #774b32a8;
    border-top: none;
    background-color: #774b32;
    font-size: 0.85rem;
    height: 8%;
  }

  .beast-race {
    background-color: #55431e;
    border: 2px solid #55431e;
  }

  .beast-race-transparent {
    border: 4px solid #55431e;
    border-top: none;
    background-color: #55431e;
    font-size: 0.85rem;
    height: 8%;
  }
  
  .bot-race {
    background-color: #424242;
    border: 2px solid #424242;
  }

  .bot-race-transparent {
    border: 4px solid #424242;
    border-top: none;
    background-color: #424242;
    font-size: 0.85rem;
    height: 8%;
  }
  
  .xeno-race {
    background-color: #8e7419;
    border: 2px solid #8e7419;
  }

  .xeno-race-transparent {
    border: 4px solid #957c1e;
    border-top: none;
    background-color: #8e7419;
    font-size: 0.85rem;
    height: 8%;
  }

  .spirit-race {
    background-color: #b63bac;
    border: 2px solid #b63bac;
  }

  .spirit-race-transparent {
    border: 4px solid #c173baa8;
    border-top: none;
    background-color: #b63bac;
    font-size: 0.85rem;
    height: 8%;
  }

  .boost-race {
    background-color: #a0aec8;
    border: 2px solid #a0aec8;
  }

  .boost-race-transparent {
    border: 4px solid #eeeeeed4;
    border-top: none;
    background-color: #a0aec8;
    font-size: 0.85rem;
    height: 8%;
  }

  .trap-race {
    background-color: #111;
    border: 2px solid #3e3e3e12;
  }

  .trap-race-transparent {
    border: 4px solid #111111;
    border-top: none;
    background-color: #111111;
    font-size: 0.85rem;
    height: 8%;
  }

  .neutral-race {
    background-color: #462e59;
    border: 2px solid #3b3b3b12;
  }

  .neutral-race-transparent {
    border: 4px solid #3d1f5a;
    border-top: none;
    background-color: #462e59;
    font-size: 0.85rem;
    height: 8%;
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
      width: 10px;
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

    .points {
      font-size: 0.6rem;
      height: 1rem;
      width: 1rem;
      border-radius: 0 0 0.4rem 0;
    }
    
    .points__modified {
      font-size: 0.6rem;
      height: 1rem;
      width: 1rem;
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
