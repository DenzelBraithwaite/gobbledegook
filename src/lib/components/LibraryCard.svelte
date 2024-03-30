<script>
  export let displayTitle = 'Title here...';
  export let title = '';
  export let img = '/card-bg.png';
  export let points = 0;
  export let race = 'none';
  export let rarity = 'common';
  export let description = '';
  export let trait = '';
  export let traitTitle = '';

  $: if (race === 'goblin-ish') race = 'goblin';
</script>

<!-- If card is legendary, shows special race colors, otherwise matches race color -->
<article class="card bg-{race} border-{race} {rarity === 'legendary' ? '-rare' : ''}">
  <p class="points {race}-race">{points}</p>
  <div class="img-section">
    <img class="card-img" src={img} alt="img of card">
    <p class="card-title {race}-title position-bottom-left">{displayTitle}</p>
  </div>

  <div class="description-section">
    <h2 class="card-title {race}-title position-bottom-center">Description</h2>
    <p class="description">{description}</p>
  </div>

  <div class="trait-section">
    <h2 class="card-title {race}-title position-bottom-right">Trait</h2>
    <h2 class="trait-title">{traitTitle}</h2>
    <p class="trait">{trait}</p>
  </div>
</article>

<style lang="scss">
  .card {
    z-index: 1;
    cursor: pointer;
    position: relative;
    width: 100%;
    height: 16rem;
    border-radius: 0.25rem;
    box-shadow: 0 2px 8px #00000063;
    transition: scale 0.1s ease-out;

    display: flex;
    align-items: flex-start;
    justify-content: space-evenly;

    &:hover {
      scale: 1.1;
    }
  }

  .img-section,
  .description-section,
  .trait-section {
    height: 100%;
    flex: 1 1 100%;
  }

  .description-section,
  .trait-section {
    background-color: transparent;
    padding: 1rem;
    height: 75%;
    border-radius: 0.5rem;
    border-radius: 1rem;
    background-color: #f1f1f194;
    max-width: 30%;
    margin: 0.5rem auto 0;

    overflow-y: scroll;

    &::-webkit-scrollbar {
      width: 0;
      background: transparent;
    }
  }

  .img-section {
    margin-right: auto;
    max-width: 33%;
    background: linear-gradient(214deg, #ddceee99, #855a2a99, #69c0ad99, #78c06999, #c0736999, #c2a84c99);
  }

  .card-img {
    height: 100%;
    width: 100%;
    object-fit: contain;
    object-position: center;
    border-radius: 0.25rem 0.25rem 0 0;
  }

  .card-title {
    color: #fff0d2;
    width: 33%;
    padding: 0.5rem;
    text-shadow: 0 2px 8px #000000a8;
    font-size: 1.25rem;
    font-weight: bold;
    text-align: center;
    z-index: 6;
    white-space: nowrap;
    border-radius: 0.25rem 0.25rem 0 0;
  }

  .trait-title {
    font-size: 1.25rem;
    font-weight: bold;
    text-align: center;
    margin-bottom: 0.75rem;
  }

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

  /* bg color based on race */
  .bg-beast {
    background: linear-gradient(to top left, #55431e, #855a2a 50%);
  }
  
  .bg-beast-rare {
    background: linear-gradient(to top left, #614d22 5%, #e0de69b6, #855a2a 90%);
  }

  .bg-bot {
    background: linear-gradient(to top left, #424242, #7e7e7e 50%);
  }

  .bg-bot-rare {
    background: linear-gradient(to top left, #424242 5%, #e0de69, #7e7e7e 90%);
  }

  .bg-dwarf {
    background: linear-gradient(to top left, #774b32, #c07369 50%);
  }

  .bg-dwarf-rare {
    background: linear-gradient(to top left, #774b32 5%, #e0de69, #c07369 90%);
  }

  .bg-elf {
    background: linear-gradient(to top left, #726b7a, #ddceee 50%);
  }

  .bg-elf-rare {
    background: linear-gradient(to top left, #726b7a 5%, #e0de69, #ddceee 90%);
  }

  .bg-goblin {
    background: linear-gradient(to top left, #327738, #78c069 50%);
  }

  .bg-goblin-rare {
    background: linear-gradient(to top left, #327738 5%, #e0de69, #78c069 90%);
  }

  .bg-human {
    background: linear-gradient(to top left, #324277, #69c0ad 50%);
  }

  .bg-human-rare {
    background: linear-gradient(to top left, #324277 5%, #e0de69, #69c0ad 90%);
  }

  .bg-xeno {
    background: linear-gradient(to top left,#776832,#c2a84c 50%);
  }

  .bg-boost {
    background: linear-gradient(353deg, #90beff, #8bc8d13d 50%);
  }

  .bg-trap {
    background: linear-gradient(353deg, #000000, #ffffff4a 50%);
  }

  .bg-neutral {
    background: linear-gradient(353deg,#31273e,rgb(147 60 233 / 16%) 50%);
  }

  /* border color based on race */
  .border-beast {
    outline: 4px solid #55431e;
  }

  .border-beast-rare {
    outline: 4px solid #774b32a8;
  }
    
  .border-bot {
    outline: 4px solid #424242;
  }
  
  .border-bot-rare {
    outline: 4px solid #424242;
  }
  
  .border-dwarf {
    outline: 4px solid #774b32a8;
  }
  
  .border-dwarf-rare {
    outline: 4px solid #774b32a8;
  }
  
  .border-elf {
    outline: 4px solid #726b7a;
  }
  
  .border-elf-rare {
    outline: 4px solid #726b7a;
  }
  
  .border-goblin {
    outline: 4px solid #327738a8;
  }
  
  .border-goblin-rare {
    outline: 4px solid #327738a8;
  }
  
  .border-human {
    outline: 4px solid #324277a8;
  }

  .border-human-rare {
    border: 4px solid #324277a8;
  }

  .border-xeno {
    outline: 4px solid #957c1e;
  }

  .border-boost {
    outline: 4px solid #eeeeeed4;
  }

  .border-trap {
    outline: 4px solid #111111;
  }

  .border-neutral {
    outline: 4px solid #3d1f5a;
}

  /* Race text color */  
  .beast-race {
    background-color: #55431e;
    border: 2px solid #55431e;
  }
  
  .bot-race {
    background-color: #424242;
    border: 2px solid #424242;
  }
  
  .dwarf-race {
    background-color: #774b32;
    border: 2px solid #774b32;
  }
  
  .elf-race {
    background-color: #726b7a;
    border: 2px solid #726b7a;
  }
  
  .goblin-race {
    background-color: #327738;
    border: 2px solid #327738;
  }
  
  .human-race {
    background-color: #324277;
    border: 2px solid #324277;
  }
  
  .xeno-race {
    background-color: #8e7419;
    border: 2px solid #8e7419;
  }

  .boost-race {
    background-color: #a0aec8;
    border: 2px solid #a0aec8;
  }

  .trap-race {
    background-color: #111;
    border: 2px solid #3e3e3e12;
  }

  .neutral-race {
    background-color: #462e59;
    border: 2px solid rgb(59 59 59 / 7%);
  }

  /* race title color */
  .beast-title {
    background-color: #55431e96;
  }
  
  .bot-title {
    background-color: #42424296;
  }
  
  .dwarf-title {
    background-color: #774b3296;
  }
  
  .elf-title {
    background-color: #726b7a96;
  }
  
  .goblin-title {
    background-color: #32773896;
  }
  
  .human-title {
    background-color: #32427796;
  }
  
  .xeno-title {
    background-color: #8e741996;
  }

  .boost-title {
    background-color: #ffffff96;
  }

  .trap-title {
    background-color: #00000096;
  }

  .neutral-title {
    background-color: #3b1d4e96;
  }

  /* Utility */@at-root

  .position-bottom-left {
    position: absolute;
    bottom: 0;
    left: 0;
  }

  .position-bottom-center {
    position: absolute;
    bottom: 0;
    right: 50%;
    transform: translateX(50%)
  }

  .position-bottom-right {
    position: absolute;
    bottom: 0;
    right: 0;
  }

  @media only screen and (max-width: 1000px) {
    .card-title {
      font-size: 1.125rem;
    }

    .trait-title {
      font-size: 0.9rem;
    }

    .description,
    .trait {
      font-size: 0.85rem;
    }
  }

  @media only screen and (max-width: 800px) {
    .card-title {
      font-size: 0.8rem;
    }

    .trait-title {
      font-size: 0.8rem;
    }
    
    .description,
    .trait {
      font-size: 0.75rem;
    }
  }

  @media only screen and (max-width: 625px) {
    .card-title {
      font-size: 0.65rem;
    }

    .trait-title {
      font-size: 0.65rem;
    }
    
    .description,
    .trait {
      font-size: 0.6rem;
    }
  }
</style>