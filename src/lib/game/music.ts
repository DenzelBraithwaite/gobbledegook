// ai generated: Track rules are pure so local-hand music changes can be tested without starting the game.
export type MusicTrack = { title: string; src: string };

export const mainMusicTracks: MusicTrack[] = [
  { title: 'Main-A', src: '/music/main.mp3' },
  { title: 'Main-B', src: '/music/main_2.mp3' }
];

// ai generated: Only these race cards unlock themes; boost, trap, and neutral legendaries do not.
export const leaderMusicTracks: Record<string, MusicTrack> = {
  emperor: { title: 'Humanity', src: '/music/humanity.mp3' },
  goblinLord: { title: 'Conquest', src: '/music/conquest.mp3' },
  longbeardLeader: { title: 'Tavern', src: '/music/tavern.mp3' },
  elfKing: { title: 'Gifted', src: '/music/gifted.mp3' },
  dreamDestroyer: { title: 'Prowl', src: '/music/prowl.mp3' },
  nightTerror: { title: 'Prowl', src: '/music/prowl.mp3' },
  spiritKing: { title: 'Serenade', src: '/music/serenade.mp3' },
  ai: { title: 'Warning', src: '/music/warning.mp3' },
  sporax: { title: 'Spaceship', src: '/music/spaceship.mp3' }
};

export const concertMusicTrack: MusicTrack = { title: 'Concert', src: '/music/concert.mp3' };

const bardMusicCards = new Set(['bardLute', 'bardFlute', 'bardHorn', 'bardDrum', 'bardSinger', 'leon']);

// ai generated: Two Beast leaders share Prowl; Leon counts toward five Bards but does not unlock a theme alone.
export function getUnlockedMusicTracks(hand: readonly string[], visibleOpponentSpiritKing = false): MusicTrack[] {
  const unlocked: MusicTrack[] = [];
  const seen = new Set<string>();
  let bardCount = 0;

  for (const card of hand) {
    if (bardMusicCards.has(card)) bardCount++;
    const track = leaderMusicTracks[card];
    if (track && !seen.has(track.src)) {
      unlocked.push(track);
      seen.add(track.src);
    }
  }

  if (bardCount >= 5) unlocked.push(concertMusicTrack);
  // ai generated: An opponent's visible Spirit King shares Serenade without revealing a masked hand.
  if (visibleOpponentSpiritKing && !seen.has(leaderMusicTracks.spiritKing.src)) unlocked.push(leaderMusicTracks.spiritKing);
  return unlocked;
}

// ai generated: A newly unlocked theme takes over; unchanged eligibility never restarts a playing song.
export function chooseMusicAfterHandChange(
  previous: readonly MusicTrack[],
  current: readonly MusicTrack[],
  selectedSrc: string
): string | null {
  if (!current.length) return previous.length ? mainMusicTracks[0].src : null;
  const previousSources = new Set(previous.map(track => track.src));
  const newlyUnlocked = current.filter(track => !previousSources.has(track.src));
  if (newlyUnlocked.length) return newlyUnlocked[newlyUnlocked.length - 1].src;
  if (!current.some(track => track.src === selectedSrc)) return current[0].src;
  return null;
}

// ai generated: The ordinary soundtrack always advances Main-A, Main-B, Main-A without manual skipping.
export function nextMainMusicTrack(currentSrc: string): MusicTrack {
  return mainMusicTracks[currentSrc === mainMusicTracks[0].src ? 1 : 0];
}
