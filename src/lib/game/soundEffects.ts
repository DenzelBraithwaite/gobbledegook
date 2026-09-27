// ai generated: Only an actual draw of one of these cards plays its private, one-shot entrance sound.
export const drawSoundEffects: Readonly<Record<string, string>> = {
  emperor: '/sounds/emperor_laugh_sound.mp3',
  goblinLord: '/sounds/goblin_entrance_sound.mp3',
  longbeardLeader: '/sounds/longbeard_glass_sound.mp3',
  elfKing: '/sounds/elf_king_taunt_sound.mp3',
  ai: '/sounds/ai_charged_sound.mp3',
  dreamDestroyer: '/sounds/dream_destroyer_roar_sound.mp3',
  nightTerror: '/sounds/night_terror_roar_sound.mp3',
  spiritKing: '/sounds/spirit_king_voice_sound.mp3',
  sporax: '/sounds/xeno_sound.mp3',
  goblinLordsMark: '/sounds/intruder_sound.mp3',
  charge: '/sounds/charge_sound.mp3',
  chastity: '/sounds/chastity_sound.mp3',
  chester: '/sounds/chester_sound.mp3',
  chjester: '/sounds/chjester_sound.mp3',
  // ai generated: The four whole Cookies share one cue; Cookie Crumbs have no cookie cue.
  oreoCookie: '/sounds/cookie_sound.mp3',
  chocoChipCookie: '/sounds/cookie_sound.mp3',
  thumbprintCookie: '/sounds/cookie_sound.mp3',
  oatmealCookie: '/sounds/cookie_sound.mp3',
  corruption: '/sounds/corruption_sound.mp3',
  dwarvenCall: '/sounds/dwarven_call_sound.mp3',
  echo: '/sounds/echo_sound.mp3',
  eradicate: '/sounds/eradicate_sound.mp3',
  exposed: '/sounds/exposed_sound.mp3',
  feast: '/sounds/feast_sound.mp3',
  gaze: '/sounds/gaze_sound.mp3',
  growth: '/sounds/growth_sound.mp3',
  infect: '/sounds/infect_sound.mp3',
  lost: '/sounds/lost_sound.mp3',
  neutralize: '/sounds/neutralize_sound.mp3',
  rejuvenate: '/sounds/rejuvenate_sound.mp3',
  sap: '/sounds/sap_sound.mp3',
  ticktock: '/sounds/tick_tock_sound.mp3',
  tocktick: '/sounds/tock_tick_sound.mp3',
  vision: '/sounds/vision_sound.mp3',
  xenoBloom: '/sounds/xeno_bloom_sound.mp3',
  xenoBlossom: '/sounds/xeno_blossom_sound.mp3',
  xenophobia: '/sounds/xenophobia_sound.mp3',
  shuffle: '/sounds/shuffle_sound.mp3',
  switcharoo: '/sounds/switcharoo_sound.mp3'
};

export const gameSoundEffects = {
  draw: '/sounds/draw_sound.mp3',
  discard: '/sounds/discard_sound.mp3',
  flip: '/sounds/card_flip_sound.mp3',
  switcharoo: '/sounds/switcharoo_sound.mp3',
  shuffle: '/sounds/shuffle_sound.mp3'
} as const;

export function getDrawSoundEffect(card: string): string | null {
  return drawSoundEffects[card] ?? null;
}

// ai generated: Sound follows the gameplay event, not a hand change, so sync/rematches never replay it.
export function getEventSoundEffect(event: string): string | null {
  if (event === 'revealed' || event === 'vision' || event === 'exposed') return gameSoundEffects.flip;
  if (event === 'switcharoo' || event === 'shuffle') return gameSoundEffects[event];
  return null;
}
