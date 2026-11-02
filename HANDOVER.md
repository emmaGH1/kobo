# Session handover

## Session / lane / branch
Docs lane, `docs` from `main`.

## Bounded task and checkpoints
Write a judge-facing README, accurately distinguishing `main` from work on feature branches.

## Changes and commits
README describes the intended judge flow, model paths, evaluation, setup and safety boundaries. No product code changed.

## Verification evidence
Compared `main` contents and setup against the README; checked the live-eval report on `core` and voice adapter on `channels`. Frozen install, typecheck, lint, one offline test and build passed. No paid API calls were made.

## Blockers / unresolved decisions
Main has only the setup scaffold. The landing URL and demo video are not available; the requested integrated chat and features are labelled coming rather than presented as live.

## Next single action
Integrate and verify the judge journey before publishing a working URL and updating the README's status.
