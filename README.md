# cook-engine

robust multiplayer engine with high scripting capability

- [ludo-plus](#ludo-plus)
- [Design](#design)
  - [Actions](#actions)
  - [State](#state)
  - [Game Rule](#game-rule)
  - [Display Lists](#display-lists)
- [Tech Stack](#tech-stack)

# Play here

Nothing yet

# Getting started

```sh
npm i
npm run dev # server
npm run watch-webpack # client
```

# Tech Stack

- [x] typescript (For Static type)
- [x] express (For dev environment quick http server)
- [x] socket io (For Real time interactions)
- [x] webpack (For client side dependency management; server side will just use `require()` after running tsc)
- [x] phaser 3 (For Graphics and some game rules)
- [ ] box2d.ts (For Physics Engine)
- [ ] mongodb? (For Player Data)
- [ ] rxjs? (For advanced Game rules)

