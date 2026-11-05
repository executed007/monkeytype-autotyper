# monkeytype-autotyper
Tampermonkey auto-typing script for Monkeytype with human-like keystroke timing.
# What it does
Reads the active word on the page, types it, hits space, moves on. Toggle button in the bottom right or window.autoTyper.start(), .stop(), .toggle() from the console.
# Why the timing is weird on purpose
Based on my experience with most userscripts available online, results tend to start giving this error at around 130 WPM or higher : "Failed to save result: Possible bot detected", even on scripts claiming to be undetected or to bypass the anticheat.

I learned after reading a discord conversation between a user and Monkeytype's creator Miodec, that Monkeytype checks key hold duration and gap between keys on every test. A normal bot fires keys at a fixed rate so both have near-zero variance, which would explain why detection starts at the 130-140 WPM range.

So this does the opposite. Hold times and gaps come from a Gaussian distribution, common bigrams go a bit faster, punctuation and word boundaries slow down, and every now and then there's a longer pause like someone thinking about the next word. About 2 or 3% of letters also get typed wrong first, then backspaced and corrected.
