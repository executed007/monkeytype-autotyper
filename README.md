# monkeytype-autotyper
Tampermonkey auto-typing script for Monkeytype with human-like keystroke timing.
# What it does
Reads the active word on the page, types it, hits space, moves on. Toggle button in the bottom right or window.autoTyper.start(), .stop(), .toggle() from the console.
# Why the timing is weird on purpose
Monkeytype checks key hold duration and gap between keys on every test. A normal bot fires keys at a fixed rate so both have near-zero variance, which gets flagged immediately.

This pulls hold times and gaps from a Gaussian distribution instead, shortens common bigrams, lengthens punctuation and word boundaries, adds an occasional longer pause, and types a wrong letter about 2-3% of the time before backspacing and fixing it. The typos are the biggest human signal. A fast run with zero errors doesn't happen.
