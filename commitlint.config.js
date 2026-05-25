/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [
    // Sprint/milestone PR titles: "[1/2] Sprint name..." or "[2/2] Sprint name..."
    (commit) => /^\[\d+\/\d+\]/.test(commit),
    // Git merge commits
    (commit) => commit.startsWith('Merge '),
  ],
}
