<script lang="ts">
  export let turn: number;
  export let landed = false;

  // ai generated: The sixteen positions cover every possible unlock turn, including both endpoints.
  const turns = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];

  // ai generated: Six full rotations end with the server-selected number directly under the top pointer.
  $: landingAngle = (360 * 6) - ((turn - 10) * 22.5);
</script>

<div class="reveal-overlay" role="dialog" aria-modal="true" aria-label="Gobbledegook unlock turn">
  <section class="reveal-panel">
    <p class="reveal-eyebrow">THE GOBLIN'S WHEEL</p>
    <h2>When can you call Gobbledegook?</h2>

    <div class="wheel-frame">
      <span class="wheel-pointer" aria-hidden="true">▼</span>

      <div class="wheel" style={`--landing-angle: ${landingAngle}deg;`} aria-hidden="true">
        {#each turns as option}
          <span
            class="wheel-number"
            class:chosen={landed && option === turn}
            style={`--number-angle: ${(option - 10) * 22.5}deg;`}
          >{option}</span>
        {/each}

      </div>

      <div class="wheel-hub">{landed ? turn : 'GDG'}</div>
    </div>

    <p class="reveal-result" aria-live="polite">
      {landed ? `Gobbledegook unlocks on turn ${turn}!` : 'The goblins are choosing...'}
    </p>
  </section>
</div>

<style lang="scss">
  .reveal-overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: grid;
    place-items: center;
    padding: 3vh 4vw;
    background: #090804ed;
  }

  .reveal-panel {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    border: 5px double #af6a2b;
    border-radius: 1rem;
    background: radial-gradient(circle at center, #573817 0%, #241b12 48%, #10120c 100%);
    box-shadow: 0 0 40px #d46d21a1, inset 0 0 65px #0a120d;
    color: #f5d6a3;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: clamp(0.3rem, 1.5vh, 1rem);
    overflow: hidden;
    text-align: center;
  }

  .reveal-eyebrow {
    margin: 0;
    color: #d88236;
    font-size: clamp(0.8rem, 2vw, 1.2rem);
    font-weight: 800;
    letter-spacing: 0.3em;
  }

  h2 {
    margin: 0;
    padding: 0 1rem;
    font-size: clamp(1.25rem, 3.2vw, 2.7rem);
    text-shadow: 0 3px 8px #000;
  }

  .wheel-frame {
    position: relative;
    width: min(65vh, 74vw, 560px);
    aspect-ratio: 1;
    flex: 0 1 auto;
    display: grid;
    place-items: center;
  }

  .wheel-pointer {
    position: absolute;
    top: -0.25em;
    left: 50%;
    z-index: 2;
    transform: translateX(-50%);
    color: #efad4e;
    font-size: clamp(2rem, 5vw, 3.8rem);
    text-shadow: 0 3px 9px #000;
  }

  .wheel {
    --number-radius: min(25vh, 28vw, 213px);
    position: relative;
    width: 88%;
    aspect-ratio: 1;
    border: clamp(8px, 1.4vw, 15px) solid #b46b25;
    border-radius: 50%;
    background: repeating-conic-gradient(
      from -11.25deg,
      #35582b 0deg 22.5deg,
      #904517 22.5deg 45deg,
      #69411e 45deg 67.5deg,
      #1d3421 67.5deg 90deg
    );
    box-shadow: 0 0 0 5px #2b1b0f, 0 15px 30px #0009, inset 0 0 22px #000a;
    animation: wheel-reveal 2.6s cubic-bezier(0.13, 0.65, 0.18, 1) forwards;
  }

  .wheel-number {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(var(--number-angle)) translateY(calc(-1 * var(--number-radius))) rotate(calc(-1 * var(--number-angle) - var(--landing-angle)));
    color: #fff0c2;
    font-size: clamp(0.75rem, 2vw, 1.4rem);
    font-weight: 900;
    text-shadow: 0 2px 5px #000;
  }

  .wheel-number.chosen {
    color: #fff;
    text-shadow: 0 0 10px #f8c874, 0 2px 5px #000;
  }

  .wheel-hub {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 1;
    width: 29%;
    aspect-ratio: 1;
    transform: translate(-50%, -50%);
    border: 5px solid #d98a36;
    border-radius: 50%;
    background: #10180f;
    color: #fac270;
    display: grid;
    place-items: center;
    font-size: clamp(1.5rem, 5vw, 3rem);
    font-weight: 900;
    box-shadow: 0 0 20px #000, inset 0 0 18px #40642d;
  }

  .reveal-result {
    min-height: 2.5rem;
    margin: 0;
    padding: 0 1rem;
    color: #bee496;
    font-size: clamp(1rem, 2.5vw, 1.8rem);
    font-weight: bold;
  }

  @keyframes wheel-reveal {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(var(--landing-angle));
    }
  }
</style>
