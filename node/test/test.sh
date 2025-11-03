#!/bin/sh

set -e

# clean up previous test
cleanup() {
  rm -rf .claude .config RENAME-ME.code-editor-agent.md output.txt tmp
}

# If test fails, comment line below to keep temporary files for inspect tmp/actual and tmp/expected
# trap cleanup EXIT

cleanup
mkdir tmp

compare() {
  local expected="$1"

  find .claude .config RENAME-ME.code-editor-agent.md output.txt -type f | sort | xargs cat > tmp/actual.txt
  (cd ../test-snapshots/"$expected" && find .claude .config RENAME-ME.code-editor-agent.md output.txt -type f | sort | xargs cat > ../../test/tmp/expected.txt)
  diff -u tmp/actual.txt tmp/expected.txt
}

# 00-initial
npx code-editor-agent cmd init
npx code-editor-agent test.sh > output.txt
npx code-editor-agent RENAME-ME.code-editor-agent.md >> output.txt
compare 00-initial

echo "All tests passed."
