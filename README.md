# tank-beyond-repair

Phaser 3 starter copied from cook-engine, with server side stripped away

- [tank-beyond-repair](#tank-beyond-repair)
- [How To Play](#how-to-play)
  - [Controls](#controls)
- [Getting started](#getting-started)
  - [How to read logs made with `log()`](#how-to-read-logs-made-with-log)
- [Tech Stack](#tech-stack)
- [License](#license)

# How To Play

Play here: https://vicksonzero.github.io/tank-beyond-repair

## Controls

P1: WASD to move, `C` to do actions

P2: Arrows to move, `/` to do actions

# Getting started

```sh
npm install
npm run watch-webpack # client
```

Entry point is client.ts  
Main Phaser scene is `MainScene.ts` (duh)  
All meat starts with the `create()` and `update()` calls

## How to read logs made with `log()`

1. open the game in browser
2. Open console
3. input `_Debug.enable('tank-beyond-repair:*')` and press enter
4. Replace `'tank-beyond-repair:*'` with any filter you want. consult `npm Debug.js` for more doc



# Tech Stack

- [x] typescript (For Static type)
- [x] webpack (For client side dependency management; server side will just use `require()` after running tsc)
- [x] phaser 3 (For Graphics and some game rules)
- [x] matter.js (From Phaser3, For Physics Engine)
- [x] debug.js (for logging with tags)

# License

BSD-3-Clause

- Can
    - Commercial Use
    - Modify
    - Distribute
    - Place Warranty
- Cannot
    - Use Trademark
    - Hold Liable
- Must
    - Include Copyright
    - Include License


