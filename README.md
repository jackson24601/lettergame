# Letter Lagoon

Letter Lagoon is a kid-friendly falling-block letter game. Uppercase and
lowercase letters fall into an ocean-themed board; match letter friends like
`A` and `a` to clear them with confetti and earn points.

## Play locally

```bash
npm start
```

Then open <http://localhost:4173>.

## Verify

```bash
npm run check
```

## Test on GitHub Pages

After this branch is merged, open the repository on GitHub and go to
**Settings > Pages**. Set **Build and deployment > Source** to **GitHub Actions**.
The included Pages workflow will publish the static game whenever `main` is
updated. You can also run it manually from **Actions > Deploy GitHub Pages**.

## Gameplay

- Steer falling letter blocks with the on-screen buttons or keyboard.
- Match uppercase letters with their lowercase versions for 1 point.
- The game starts with A, B, and C, then unlocks more letters as score grows.
- Falling speed increases over time, and the game ends when blocks reach the
  top of the board.
