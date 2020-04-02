# tank-beyond-repair

Phaser 3 starter copied from cook-engine, with server side stripped away

- [tank-beyond-repair](#tank-beyond-repair)
- [How To Play](#how-to-play)
  - [Controls](#controls)
- [Getting started](#getting-started)
  - [Dev](#dev)
    - [Docs](#docs)
    - [Important links](#important-links)
  - [Prod](#prod)
  - [How to read logs made with `log()`](#how-to-read-logs-made-with-log)
- [Tech Stack](#tech-stack)
- [Credits](#credits)
- [License](#license)

# How To Play

Play here: https://vicksonzero.github.io/tank-beyond-repair/

## Controls

P1: WASD to move, `C` to do actions

P2: Arrows to move, `/` to do actions

# Getting started

## Dev

```sh
npm install
npm run watch-webpack
```

It is a share-screen offline multiplayer game. we do all development work onto `master`, and it will be seen on gh-pages    
Entry point is `client.ts`  
Main Phaser scene is `MainScene.ts` (duh)  
All meat starts with the `create()` and `update()` calls

### Docs

https://photonstorm.github.io/phaser3-docs

### Important links

https://globalgamejam.org/2020/games/tank-beyond-repair-5  
https://github.com/vicksonzero/tank-beyond-repair  
https://globalgamejam.org/2020/jam-sites/hong-kong  


## Prod

```sh
npm install
npm run build
git add .
git commit
git push # into master
```

Built content will be put in `master`

## How to read logs made with `log()`

1. open the game in browser
2. Open console
3. input `_Debug.enable('tank-beyond-repair:*')` and press enter
4. Replace `'tank-beyond-repair:*'` with any filter you want. consult [npm package debug](https://www.npmjs.com/package/debug) for more doc



# Tech Stack

- [x] typescript (For Static type)
- [x] webpack (For client side dependency management; server side will just use `require()` after running tsc)
- [x] phaser 3 (For Graphics and some game rules)
- [x] box2d.ts (For Stand-alone Physics Engine)
- [x] debug.js (for logging with tags)


# Credits

- Programming
  - Dickson Chui (https://github.com/vicksonzero)
  - William Chong (https://github.com/williamchong007)
  - Sunday Ku (https://github.com/199911)
- Graphics
  - Kenney.nl (Once again!)
- Sound
  - `Music: Eric Skiff - Song Name - Resistor Anthems - Available at http://EricSkiff.com/music (CC-BY 4.0)`
  - https://freesound.org/people/LittleRobotSoundFactory/packs/16681/ (CC-BY 3.0)
  - https://freesound.org/people/Raclure/sounds/458867/ (CC0, but did not make it into the final game...)

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


