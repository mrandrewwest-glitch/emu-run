# Emu Run

A Roadrunner-style side-scrolling runner. You're an emu legging it across the outback with a dingo on your tail.

Open `index.html` in any browser (phone or desktop). No build step, no dependencies.

## Controls

| Touch | Keyboard | Move |
| --- | --- | --- |
| Tap | Space / Up | Jump over logs, rocks, termite mounds, wombats, goannas, kangaroos and cassowaries |
| Swipe down (hold to keep sliding) | Down (hold) | Duck under gum branches and swooping magpies, slide through long grass |
| Swipe right | Right | Zoomies dash: a burst of speed that smashes through saltbush (3.5 s cooldown) |

## How it works

- Hitting an obstacle lets the dingo close in. It drops back slowly while you run clean. If it catches you, the run is over.
- Running through long grass without sliding slows you down and lets the dingo gain.
- Collect quandong berries for points. A rare golden feather gives 5 seconds of invincibility.
- Score = metres run + 10 per berry + 25 per bush smashed.
- The top 5 scores are kept on the device (browser storage), with a name you can type in when you make the board.
- Get caught and the dingo sits down with a very full tummy, surrounded by floating emu feathers.
- The game gets faster the further you go, and new hazards appear: branches and termite mounds, then wombats and saltbush, then goannas, magpies, kangaroos and finally charging cassowaries. Fast animals get a flashing warning sign before they arrive.
