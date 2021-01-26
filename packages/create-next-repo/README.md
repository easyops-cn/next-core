# create-next-repo

Create new Brick-Next repositories. No worries!

## Usage

Run `create-next-repo my-repo`. Remember using your repository name instead of `my-repo`.

The new repo will use public npm registry for Brick-Next packages, by default.

Pass `--internal` as parameters if you want to create an Brick-Next internal repo, which use private npm registry on intranet.

Pass `--update` to update an existed repo. After that, usually you should also `cd my-repo` and run `yarn` + `yarn renew`.
