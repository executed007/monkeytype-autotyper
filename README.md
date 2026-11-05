# monkeytype-autotyper
Tampermonkey auto-typing script for Monkeytype with human-like keystroke timing.
# What it does
Reads the active word on the page, types it, hits space, moves on. Toggle button in the bottom right or window.autoTyper.start(), .stop(), .toggle() from the console.
# Why the timing is weird on purpose
Based on my experience with most userscripts available online, results tend to start giving this error at around 130 WPM or higher : "Failed to save result: Possible bot detected", even on scripts claiming to be undetected or to bypass the anticheat.

I learned after reading a discord conversation between a user and Monkeytype's creator Miodec, that Monkeytype checks key hold duration and gap between keys on every test. A normal bot fires keys at a fixed rate so both have near-zero variance, which would explain why detection starts at the 130-140 WPM range.

So this does the opposite. Hold times and gaps come from a Gaussian distribution, common bigrams go a bit faster, punctuation and word boundaries slow down, and every now and then there's a longer pause like someone thinking about the next word. About 2 or 3% of letters also get typed wrong first, then backspaced and corrected.
# Calibration
`TARGET_WPM` isn't the number Monkeytype shows you. It sets the timing budget, and the real overhead from `setTimeout` plus Monkeytype's own handlers adds maybe 5 to 15% on top depending on your machine. `CALIBRATION` is what corrects for that.

To measure it, set `ERROR_RATE = 0`, `CALIBRATION = 1.0`, and `TARGET_WPM = 100`, run a 60 second test, then set `CALIBRATION = 100 / rawWPM`. From what I've tried, shorter tests like 15 and 30 seconds give less accurate results.

Calibration only fixes timing. Accuracy is separate, and it matters more than you'd think. Monkeytype only counts characters from fully correct words, so one wrong letter means that whole word contributes nothing to your WPM even if the rest of it was right. A few percent of errors costs you noticeably more than a few percent of your score.
