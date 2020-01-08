# ludo-plus

robust multiplayer engine with solid definition of done

- [ludo-plus](#ludo-plus)
- [Design](#design)
  - [Actions](#actions)
  - [State](#state)
  - [Game Rule](#game-rule)
- [Tech Stack](#tech-stack)

# Design

## Actions
- dice
- move
- emote

## State
- piece location
- players
  - home count
  - win count

## Game Rule
- cell connectivity
- home stretch
- cut through
- eat
- wall
- take off


# Tech Stack

- [x] typescript (For Static type)
- [x] express (For REST API)
- [x] socket io (For Real time interactions)
- [x] webpack (For client side dependency management; server side just use `require()`)
- [x] phaser 3 (For Graphics and some game rules)
- [ ] planck.js (For Physics Engine)
- [ ] mongodb? (For Player Data)
- [ ] rxjs? (For advanced Game rules)

