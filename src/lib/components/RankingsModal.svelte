<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';

  // ai generated: Game.svelte passes the same ordered thresholds used to choose the small in-game badges.
  export let ranks: { badge: string; label: string; threshold: string; minElo: number }[];
  const dispatch = createEventDispatcher<{ close: void }>();

  // ai generated: Escape mirrors the corner X without changing any game state.
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') dispatch('close');
  }
</script>

<svelte:window on:keydown={handleKeydown}/>

<!-- ai generated: A dark, scrollable modal displays the badge art at readable size, best rank first. -->
<div class="rankings-overlay" transition:fade={{ duration: 150 }}>
  <section class="rankings-modal" role="dialog" aria-modal="true" aria-labelledby="rankings-title">
    <button class="close-button" type="button" aria-label="Close rankings" on:click={() => dispatch('close')}>
      <!-- ai generated: Reuses the X shape and orange styling from the remaining-cards modal. -->
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <path d="m15 9-6 6"/>
        <path d="m9 9 6 6"/>
      </svg>
    </button>

    <h2 id="rankings-title">Rankings</h2>
    <ol class="ranking-list">
      {#each ranks as rank}
        <li class="ranking-row">
          <img src="/badges/{rank.badge}_badge.png" alt="{rank.label} badge"/>
          <div class="ranking-details">
            <h3>{rank.label}</h3>
            <p>{rank.threshold} ELO</p>
          </div>
        </li>
      {/each}
    </ol>
  </section>
</div>

<style lang="scss">
  .rankings-overlay {
    position: fixed;
    inset: 0;
    z-index: 10;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: #000000bd;
  }

  .rankings-modal {
    position: relative;
    width: min(30rem, 100%);
    max-height: 90dvh;
    overflow-y: auto;
    padding: 1.25rem;
    border: 2px solid #d44215;
    border-radius: 0.75rem;
    color: #fff0d2;
    background: #080808;
    box-shadow: 0 0.75rem 2rem #000;
  }

  h2 {
    margin: 0 3rem 1rem 0;
    font-size: 1.75rem;
  }

  .close-button {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0.125rem;
    border: 1px solid #d44215;
    border-radius: 0.5rem;
    color: #d44215;
    background: #0c0c0c;
    cursor: pointer;

    &:hover, &:focus-visible {
      border-color: #327738;
      color: #327738;
    }

    svg {
      width: 100%;
      height: 100%;
      stroke: currentColor;
      stroke-width: 1.5;
      fill: #d442158a;
    }
  }

  .ranking-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .ranking-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-height: 5.5rem;
    padding: 0.35rem 0.75rem;
    border: 1px solid #433020;
    border-radius: 0.5rem;
    background: #17110d;

    img {
      // ai generated: These are much larger than the in-game icons so players can inspect the artwork.
      width: clamp(5rem, 13dvh, 7rem);
      height: clamp(5rem, 13dvh, 7rem);
      object-fit: contain;
      flex: none;
    }
  }

  .ranking-details {
    h3, p { margin: 0; }
    h3 { font-size: 1.3rem; }
    p { color: #d9c4a5; }
  }
</style>
