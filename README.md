# Web Browser Game
## "Dwarves & Goblins" (Working Title)

## What is it
- Will contain sandbox, tower defense, MOBA elements
- Fun multiplayer for myself and friends initially
- WebGPU, WebTransport (fallback to WebSockets possibly)

## Status
- Just starting out. In development (pre-alpha).

## v0.0.1 Roadmap
- [ ] Player
    - [x] WASD Movement
    - [ ] Facing = movement direction
    - [ ] One melee attack:
        - [ ] Plays animation
        - [ ] Has cooldown
        - [ ] Deals fixed damage
- [ ] Tilemap
    - [ ] Static tilemap (no generation)
    - [ ] Single tileset
    - [x] Camera can move smoothly over it
- [ ] Enemy (Goblin)
    - [ ] Has position + health
    - [ ] Moves toward player (simple chase, no pathfinding)
    - [ ] Stops within attack range
    - [ ] Deals fixed damage on interval
    - [ ] Plays Animations
        - [ ] Walk
        - [ ] Attack
        - [ ] Death
- [ ] Combat
    - [ ] Player can damage enemy
    - [ ] Enemy can damage player
    - [ ] Enemy dies at 0 HP
    - [ ] Death animation plays, then entity removed
- [ ] Multiplayer
    - [ ] Server runs simulation
    - [ ] Two players connect
    - [ ] Each sees the other:
        - [ ] Position
        - [ ] Orientation
        - [ ] Animation (walk/attack)
    - [ ] Each sees enemy
        - [ ] Position
        - [ ] Orientation
        - [ ] Animation (walk/attack/death)
    - [ ] Both can attack the same enemy
    - [ ] Server resolves health (authoritative)
- [ ] Sound
    - [ ] Attack
    - [ ] Hit
    - [ ] Death
    - [ ] Footsteps

## License
MIT