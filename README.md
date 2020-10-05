# Doable: Opinionated kanban

Hackable opinionated kanban board:
* Feels like Trello / github
* With smart autocompletion (thanks Wekan), including # for labels and / for dates

## Doable runs on conventions

See [opinionatedFeatures.js](client/config/opinionatedFeatures.js)
* `..` for waiting, 🔥 for urgent, ⭕ for risky, etc
* Filtering allows to quickly filter down to tag, emoji, important, or fulltext
* Dims delegated, waiting, and deferred tasks; multiple focus levels
* Adds support for dividers (which can shade for you)
* Works on mobile, but needs improvement
* Minimalistic fullscreen UI without clutter


-----------------
# Based on Wekan

Upstream repo: [wekan/wekan](https://github.com/wekan/wekan)

How to pull from upstream:
1. reset `staging/upstream-master` to `upstream-master`
1. merge `tweaks` into `staging/upstream-master`
    1. complicated conflicts: stash or create feature branches
1. reset `tweaks` to `staging/upstream-master`

# Original Wekan

See [original readme of wekan](README_wekan.md)
