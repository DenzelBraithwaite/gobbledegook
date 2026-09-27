// ai generated: Only an actual draw of one of these cards plays its private, one-shot entrance sound.
export const drawSoundEffects: Readonly<Record<string, string>> = {
  emperor: '/music/emperor_laugh.mp3',
  goblinLord: '/music/goblin_entrance.mp3',
  longbeardLeader: '/music/longbeard_glass.mp3',
  elfKing: '/music/elf_king_taunt.mp3',
  ai: '/music/ai_charged.mp3',
  dreamDestroyer: '/music/dream_destroyer_roar.mp3',
  nightTerror: '/music/night_terror_roar.mp3',
  spiritKing: '/music/spirit_king_voice.mp3',
  sporax: '/music/xeno_noise.mp3',
  goblinLordsMark: '/music/intruder_sound.mp3'
};

export const gameSoundEffects = {
  draw: '/music/draw_sound.mp3',
  discard: '/music/discard_sound.mp3',
  flip: '/music/card_flip_sound.mp3',
  switcharoo: '/music/switcharoo_sound.mp3',
  shuffle: '/music/shuffle_sound.mp3'
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
