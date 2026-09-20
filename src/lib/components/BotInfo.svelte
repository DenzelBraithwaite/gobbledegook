<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';

  export let currentPath = 'Waiting for a turn';
  export let explanation = 'The bot has not made a decision yet.';
  export let debugEnabled = true;

  const dispatch = createEventDispatcher();
</script>

<div class="backdrop" transition:fade>
  <section class="bot-info" role="dialog" aria-modal="true" aria-labelledby="bot-info-title">
    <button class="close" on:click={() => dispatch('close')} aria-label="Close A.I. information">×</button>
    <h2 id="bot-info-title">Balanced A.I.</h2>
    <p>The bot uses the real game scoring rules, counts only cards it is allowed to know, and compares several possible race paths before discarding.</p>

    <h3>What it prioritizes</h3>
    <ul>
      <li>Strong points now, without throwing away rare leaders too cheaply.</li>
      <li>Reasonable chances of completing Goblins, Spirits, Cookies, or another race path.</li>
      <li>Whether boosts or traps are blocked and whether Neutralize can still appear.</li>
      <li>The risk that the human holds A.I. and can steal the bot race's points.</li>
      <li>A conservative simulated win chance before declaring Gobbledegook.</li>
    </ul>

    <div class="current-path">
      <strong>Current path:</strong> {currentPath}
      <p>{explanation}</p>
    </div>
    <p class="debug">Console explanations are {debugEnabled ? 'enabled' : 'disabled'}.</p>
  </section>
</div>

<style lang="scss">
  .backdrop {
    z-index: 10;
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: #000a;
  }

  .bot-info {
    position: relative;
    width: min(42rem, 92dvw);
    max-height: 85dvh;
    overflow-y: auto;
    padding: 1.5rem 2rem;
    color: #fff0d2;
    border: 2px solid #745f58;
    border-radius: 0.75rem;
    background: linear-gradient(145deg, #161616, #25211f);
    box-shadow: 0 0.75rem 2rem #000b;
  }

  h2, h3 {
    color: #9abd9d;
  }

  li {
    margin-bottom: 0.5rem;
  }

  .close {
    position: absolute;
    top: 0.5rem;
    right: 0.75rem;
    color: #fff0d2;
    border: 0;
    background: transparent;
    font-size: 2rem;
    cursor: pointer;
  }

  .current-path {
    margin-top: 1.25rem;
    padding: 0.9rem;
    border-left: 4px solid #d44215;
    background: #0006;
  }

  .current-path p {
    margin-bottom: 0;
  }

  .debug {
    color: #bdb6b2;
    font-size: 0.85rem;
  }
</style>
