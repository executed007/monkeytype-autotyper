# monkeytype-autotyper
Tampermonkey auto-typing script for Monkeytype with human-like keystroke timing.
# What it does
Reads the active word on the page, types it, hits space, moves on. Toggle button in the bottom right or window.autoTyper.start(), .stop(), .toggle() from the console.
# Why the timing is weird on purpose
Based on my experience with most userscripts available online, results tend to start giving this error at around 130 WPM or higher : "Failed to save result: Possible bot detected", even on scripts claiming to be undetected or to bypass the anticheat.

I learned after reading a discord conversation between a user and Monkeytype's creator Miodec, that Monkeytype checks key hold duration and gap between keys on every test. A normal bot fires keys at a fixed rate so both have near-zero variance, which would explain why detection starts at the 130-140 WPM range.

You can actually see this yourself if you head over to [events.monkeytype.com](https://events.monkeytype.com/). It's a public log of test events, and flagged runs show up there with their keystroke data. Miodec pointed the user to it in that conversation, and the user's own log showed hold durations as low as 5ms and drops as low as 2.9ms, along with hold times randomly spiking to 150ms. That's the exact pattern the anticheat is picking up on.

So this does the opposite. Hold times and gaps come from a Gaussian distribution, common bigrams go a bit faster, punctuation and word boundaries slow down, and every now and then there's a longer pause like someone thinking about the next word. About 2 or 3% of letters also get typed wrong first, then backspaced and corrected.
# Calibration
`TARGET_WPM` isn't the number Monkeytype shows you. It sets the timing budget, and there's real overhead on top of it from `setTimeout` and from the page processing each key event before the next one fires, so the actual speed comes out a bit lower than what you asked for. `CALIBRATION` compensates for that. How much overhead you get depends on your machine, so it's worth measuring once.

To measure it, set `ERROR_RATE = 0`, `CALIBRATION = 1.0`, and `TARGET_WPM = 100`, run a 60 second test, then set `CALIBRATION = 100 / rawWPM`. From what I've tried, shorter tests like 15 and 30 seconds give less accurate results.

Calibration only fixes timing. Accuracy is separate, and it matters more than you'd think. Monkeytype's WPM number is based on correct words, so a word with a wrong letter doesn't count toward it even if most of the word was right. A few percent of errors costs you noticeably more than a few percent of your score.
