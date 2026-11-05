# monkeytype-autotyper
Tampermonkey auto-typing script for Monkeytype with human-like keystroke timing.
# What it does
Reads the active word on the page, types it, hits space, moves on. Toggle button in the bottom right or window.autoTyper.start(), .stop(), .toggle() from the console.
## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Open the Tampermonkey dashboard, click "Create a new script," paste the contents, save.
3. Open Monkeytype, click the test area once so the caret shows up, then click the yellow toggle in the bottom right to start.

The script starts typing the moment you toggle it on. There's no countdown, so make sure the test is ready before you click it.

If nothing types, check the console for `[auto-typer]` errors. Most of the time it's the `#wordsInput` selector. You can check with `document.querySelector('#wordsInput')`.
# Why the timing is weird on purpose
Based on my experience with most userscripts available online, results tend to start giving this error at around 130 WPM or higher : "Failed to save result: Possible bot detected", even on scripts claiming to be undetected or to bypass the anticheat.

I learned after reading a discord conversation between a user and Monkeytype's creator Miodec, that Monkeytype checks key hold duration and gap between keys on every test. A normal bot fires keys at a fixed rate so both have near-zero variance, which would explain why detection starts at the 130-140 WPM range.

You can actually see this yourself if you head over to [events.monkeytype.com](https://events.monkeytype.com/). It's a public log of test events, and flagged runs show up there with their keystroke data. Miodec pointed the user to it in that conversation, and the user's own log showed hold durations as low as 5ms and drops as low as 2.9ms, along with hold times randomly spiking to 150ms. That's the exact pattern the anticheat is picking up on.

So this does the opposite. Hold times and gaps come from a Gaussian distribution, common bigrams go a bit faster, punctuation and word boundaries slow down, and every now and then there's a longer pause like someone thinking about the next word. About 2 or 3% of letters also get typed wrong first, then backspaced and corrected.
# Calibration
`TARGET_WPM` isn't the number Monkeytype shows you. It sets the timing budget, and there's real overhead on top of it from `setTimeout` and from the page processing each key event before the next one fires, so the actual speed comes out a bit lower than what you asked for. `CALIBRATION` compensates for that. How much overhead you get depends on your machine, so it's worth measuring once.

To measure it, set `ERROR_RATE = 0`, `CALIBRATION = 1.0`, and `TARGET_WPM = 100`, run a 60 second test, then set `CALIBRATION = 100 / rawWPM`. From what I've tried, shorter tests like 15 and 30 seconds give less accurate results.

Calibration only fixes timing. Accuracy is separate, and it matters more than you'd think. Monkeytype's WPM number is based on correct words, so a word with a wrong letter doesn't count toward it even if most of the word was right. A few percent of errors costs you noticeably more than a few percent of your score.
## The 162 wall and how to get past it

Out of the box the script tops out around 162 WPM. That's not some hard limit, it's just what the default values happen to produce. There's a `Math.max` clamp on hold and spacing that sets a floor of roughly 70ms per character, and that's what caps it.

| Target | Reported |
|---|---|
| 130 | 137 |
| 140 | 140 |
| 150 | 150 |
| 180 | 161 |
| 200 | 162 |

Past about 160 the target stops mattering, because the clamps decide the speed at that point.

If you want to go higher you have to change whatever is creating the floor:

- **Lower `HOLD_MEAN`.** 55ms is comfortable. 40 or 35 is where it starts feeling fast but still plausible. Below 30 and it stops being human.
- **Lower the `Math.max` clamps.** The `Math.max(25, ...)` on hold duration and `Math.max(8, ...)` on spacing are what set the real floor.
- **Lower `HOLD_SD`.** Less variance means tighter runs that go slightly faster on average, but this is the one that gets flagged fastest.

## What I actually got when I pushed it

Here's the real data from a week of testing on my own account, ending the way you'd expect.

| Config | Target | Reported | Result |
|---|---|---|---|
| 55/12, no errors | 200 | 162 | passed |
| 42/12, no errors | 200 | 184 | passed |
| 25/10, no errors | 200 | - | **flagged** |
| 38/22, no errors | 220 | 204 | passed |
| 30/28, no errors | 240 | 190 | passed |
| 34/18, no errors | 260 | 215 | passed |
| 33/17, no errors | 260 | 218 | **flagged** |
| 34/18, no errors | 130 | 130 | **flagged twice** |
| 34/18, gap clamp 6 | 280 | - | **flagged** |
| **any config** | **any** | **-** | **account banned** |
## Presets

**Safe, probably won't get you banned:**

```js
const TARGET_WPM   = 130;
const CALIBRATION  = 1.15;
const ERROR_RATE   = 0.025;
const THINK_CHANCE = 0.08;
const HOLD_MEAN    = 50;
const HOLD_SD      = 22;
const PAUSE_MEAN   = 160;
const PAUSE_SD     = 60;
```
**Risky, probably fine for a short while:**
```js
const TARGET_WPM   = 160;
const CALIBRATION  = 1.15;
const ERROR_RATE   = 0.02;
const THINK_CHANCE = 0.06;
const HOLD_MEAN    = 42;
const HOLD_SD      = 20;
const PAUSE_MEAN   = 160;
const PAUSE_SD     = 60;
```
**Fast, will probably get you banned eventually:**
```js
const TARGET_WPM   = 260;
const CALIBRATION  = 1.15;
const ERROR_RATE   = 0;
const THINK_CHANCE = 0.04;
const HOLD_MEAN    = 34;
const HOLD_SD      = 18;
const PAUSE_MEAN   = 160;
const PAUSE_SD     = 60;
```
Keep in mind the fast config is what got me 215 after which I got banned when trying to push further. 
That doesn't necessarily mean it's the limit, you could probably get an even higher score without getting detected if you mess around enough with the parameters, but I'm too lazy for that.
## Install

1. Install Tampermonkey.
2. Create a new script, paste the contents, save.
3. Open Monkeytype, click the test area once so the caret shows up, toggle on.

If nothing types, check the console for `[auto-typer]` errors. Most of the time it's the `#wordsInput` selector. You can check with `document.querySelector('#wordsInput')`.
## Known issues and limitations

- The script begins typing the moment it is toggled on. There is no countdown or delay.
- Changing parameters (WPM, hold times, error rates, etc.) requires editing the script in Tampermonkey and saving. You have to re-paste the values into the text file every time. I might add a proper UI in the future.
- Quote and custom text modes aren't handled specially.
- Punctuation mode is untested.
- The toggle button remounts every 500ms and can shift slightly after navigation.
- The target WPM interacts with detection in ways that aren't obvious from the code. At `HOLD_MEAN = 34`, `HOLD_SD = 18`, target 260 passes and target 130 flags, with no other differences.
- Lowering the spacing clamp from 8 to 6 flagged at target 280. The pinned-gap regime seems to be what's passing at high targets.
