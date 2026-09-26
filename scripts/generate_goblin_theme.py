#!/usr/bin/env python3
"""ai generated: Render an original loopable fantasy-card-game sketch with no sampled audio."""

from array import array
import math
import random
import sys
import wave


# ai generated: Sixteen 4/4 bars at 100 BPM give the drums, horns, and chants room to breathe.
RATE = 44100
BEAT = 60 / 100
BARS = 16
DURATION = BARS * 4 * BEAT
COUNT = round(DURATION * RATE)
TAU = 2 * math.pi
track = array("f", [0.0]) * COUNT
noise = random.Random(70321)


def hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def put(start, length, voice):
    """ai generated: Wrap note tails across the boundary so the repeated song has no silent seam."""
    first = round(start * RATE) % COUNT
    for sample in range(round(length * RATE)):
        index = first + sample
        if index >= COUNT:
            index -= COUNT
        track[index] += voice(sample / RATE)


def lute(start, midi, strength=0.1):
    frequency = hz(midi)

    def voice(t):
        envelope = (1 - math.exp(-65 * t)) * math.exp(-4.8 * t)
        phase = TAU * frequency * t
        return strength * envelope * (
            math.sin(phase) + 0.39 * math.sin(2 * phase) + 0.15 * math.sin(3 * phase)
        )

    put(start, 0.95, voice)


def bass(start, midi, strength=0.13):
    frequency = hz(midi)

    def voice(t):
        envelope = (1 - math.exp(-35 * t)) * math.exp(-2.8 * t)
        phase = TAU * frequency * t
        return strength * envelope * (math.sin(phase) + 0.25 * math.sin(2 * phase))

    put(start, 1.2, voice)


def reed(start, midi, length=0.47, strength=0.065):
    frequency = hz(midi)

    def voice(t):
        release = min(1, max(0, (length - t) / 0.09))
        envelope = min(1, t / 0.06) * release
        phase = TAU * frequency * t + 0.015 * math.sin(TAU * 5 * t)
        return strength * envelope * (
            math.sin(phase) + 0.16 * math.sin(2 * phase) + 0.09 * math.sin(3 * phase)
        )

    put(start, length, voice)


def horn(start, midi, length=1.25, strength=0.10):
    frequency = hz(midi)

    def voice(t):
        sustain = min(1, t / 0.16)
        release = min(1, max(0, (length - t) / 0.28))
        envelope = sustain * release * (0.88 + 0.12 * math.sin(TAU * 5.1 * t))
        phase = TAU * frequency * t + 0.07 * math.sin(TAU * 4.8 * t)
        return strength * envelope * (
            math.sin(phase) + 0.46 * math.sin(2 * phase)
            + 0.31 * math.sin(3 * phase) + 0.17 * math.sin(4 * phase)
        )

    put(start, length, voice)


def chant(start, midi, length=0.62, strength=0.047):
    frequency = hz(midi)
    partials = (0.45, 0.72, 0.42, 0.15, 0.11, 0.08)

    def voice(t):
        envelope = min(1, t / 0.12) * min(1, max(0, (length - t) / 0.18))
        phase = TAU * frequency * t + 0.028 * math.sin(TAU * 4.2 * t)
        vowels = sum(amount * math.sin((index + 1) * phase) for index, amount in enumerate(partials))
        return strength * envelope * vowels

    put(start, length, voice)


def drum(start, size=1):
    """ai generated: A swept low tone and a short noisy skin attack suggest hand-played war drums."""
    phase = 0.0
    first = round(start * RATE) % COUNT
    for sample in range(round(0.5 * RATE)):
        t = sample / RATE
        frequency = (95 if size == 1 else 135) * math.exp(-13 * t) + (48 if size == 1 else 70)
        phase += TAU * frequency / RATE
        body = math.sin(phase) * math.exp(-11 * t) * (0.25 if size == 1 else 0.13)
        skin = noise.uniform(-1, 1) * math.exp(-33 * t) * 0.055
        track[(first + sample) % COUNT] += body + skin


def rattle(start, strength=0.018):
    first = round(start * RATE) % COUNT
    previous = 0.0
    for sample in range(round(0.11 * RATE)):
        t = sample / RATE
        current = noise.uniform(-1, 1)
        high_pass = current - previous * 0.9
        previous = current
        track[(first + sample) % COUNT] += strength * high_pass * math.exp(-36 * t)


# ai generated: The G-minor, E-flat, F, D progression and melody are original to this generated loop.
chords = (
    (55, 58, 62, 67),
    (51, 55, 58, 63),
    (53, 57, 60, 65),
    (50, 54, 57, 62),
)
arpeggio = (0, 2, 1, 2, 3, 2, 1, 2)
for bar in range(BARS):
    start = bar * 4 * BEAT
    chord = chords[bar % 4]
    bass(start, chord[0] - 12, 0.16)
    bass(start + 2 * BEAT, chord[0] - 12, 0.13)

    for step, chord_note in enumerate(arpeggio):
        timing = start + step * BEAT / 2 + noise.uniform(-0.009, 0.009)
        lute(timing, chord[chord_note], 0.090 if step % 2 else 0.11)
        rattle(start + step * BEAT / 2, 0.012 if step % 2 else 0.017)

    drum(start, 1)
    drum(start + 2 * BEAT, 1 if bar % 4 == 3 else 2)
    if bar % 4 == 3:
        drum(start + 3 * BEAT, 2)
        drum(start + 3.5 * BEAT, 2)


# ai generated: Short reed phrases keep the background melodic without covering play decisions.
motifs = (
    ((0.5, 70), (1.5, 74), (2.5, 72), (3.5, 70)),
    ((0.5, 67), (1.5, 70), (2.5, 72)),
    ((0.0, 69), (1.0, 72), (2.5, 74), (3.5, 72)),
    ((0.5, 69), (1.5, 66), (2.5, 69)),
)
for bar in range(BARS):
    for beat, pitch in motifs[bar % 4]:
        if bar % 8 in (3, 7) and beat > 2:
            continue
        reed(bar * 4 * BEAT + beat * BEAT, pitch, 0.43, 0.058 if bar < 8 else 0.065)


# ai generated: Horn calls and vowel-like chants enter occasionally instead of playing over every bar.
for bar in (3, 7, 11, 15):
    start = bar * 4 * BEAT
    horn(start + 0.05, 50, 1.35, 0.09)
    horn(start + 0.05, 57, 1.35, 0.055)
    horn(start + 2.0 * BEAT, 62, 1.1, 0.075)
for bar in (6, 7, 14, 15):
    start = bar * 4 * BEAT
    chant(start + 1.0 * BEAT, 55, 0.62)
    chant(start + 2.75 * BEAT, 58, 0.62)
    if bar in (7, 15):
        drum(start + 2.5 * BEAT, 1)


# ai generated: Tiny stereo echoes and a wraparound crossfade soften the synthesis and avoid a hard loop click.
left_delay = round(0.12 * RATE)
right_delay = round(0.19 * RATE)
seam = round(0.035 * RATE)
peak = max(max(track), -min(track))
gain = 0.76 / peak if peak else 1
output = array("h")
for index in range(COUNT):
    if index >= COUNT - seam:
        blend = (index - (COUNT - seam)) / seam
        original = track[index] * (1 - blend) + track[index - (COUNT - seam)] * blend
    else:
        original = track[index]
    left = original + track[(index - left_delay) % COUNT] * 0.12
    right = original + track[(index - right_delay) % COUNT] * 0.16
    output.append(round(max(-1, min(1, left * gain)) * 32767))
    output.append(round(max(-1, min(1, right * gain)) * 32767))

with wave.open(sys.argv[1], "wb") as file:
    file.setnchannels(2)
    file.setsampwidth(2)
    file.setframerate(RATE)
    file.writeframes(output.tobytes())
