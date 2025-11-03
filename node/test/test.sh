#!/bin/sh

set -e

# clean up previous test
cleanup() {
  rm -rf .claude .config RENAME-ME.code-editor-agent.md output.txt tmp
}

cleanup_tmp() {
  rm -rf tmp/*
}

# If test fails, comment line below to keep temporary files for inspect tmp/actual and tmp/expected
trap cleanup EXIT

cleanup
mkdir tmp

compare_with_snapshot() {
  local expected="$1"

  find .claude .config RENAME-ME.code-editor-agent.md output.txt -type f | sort | xargs cat > tmp/actual.txt
  (cd ../test-snapshots/"$expected" && find .claude .config RENAME-ME.code-editor-agent.md output.txt -type f | sort | xargs cat > ../../test/tmp/expected.txt)
  diff -u tmp/actual.txt tmp/expected.txt
}

compare_output() {
  local expected="$1"

  cat output.txt > tmp/actual.txt
  diff -u tmp/actual.txt ../test-snapshots/"$expected"/output.txt
}

# 00-initial
npx code-editor-agent cmd init
npx code-editor-agent test.sh > output.txt
npx code-editor-agent RENAME-ME.code-editor-agent.md >> output.txt
compare_with_snapshot 00-initial

# 01-ignorePatterns
cleanup_tmp
cp ../test-templates/01-ignorePatterns/basic.code-editor-agent.md tmp/rule.code-editor-agent.md
rm -rf .claude .config RENAME-ME.code-editor-agent.md output.txt
npx code-editor-agent cmd init
rm RENAME-ME.code-editor-agent.md
npx code-editor-agent cmd generate
npx code-editor-agent tmp/test-file.ts > output.txt
npx code-editor-agent tmp/ignored.ts >> output.txt
compare_output 01-ignorePatterns

# 02-tags-references
cleanup_tmp
cp ../test-templates/02-tags-references/*.code-editor-agent.md tmp/
rm -rf .claude .config RENAME-ME.code-editor-agent.md output.txt
npx code-editor-agent cmd init
rm RENAME-ME.code-editor-agent.md
npx code-editor-agent cmd generate
npx code-editor-agent tmp/test-file.ts > output.txt
compare_output 02-tags-references

# 03-priority
cleanup_tmp
cp ../test-templates/03-priority/*.code-editor-agent.md tmp/
rm -rf .claude .config RENAME-ME.code-editor-agent.md output.txt
npx code-editor-agent cmd init
rm RENAME-ME.code-editor-agent.md
npx code-editor-agent cmd generate
npx code-editor-agent tmp/test-file.ts > output.txt
compare_output 03-priority

# 04-order
cleanup_tmp
cp ../test-templates/04-order/*.code-editor-agent.md tmp/
rm -rf .claude .config RENAME-ME.code-editor-agent.md output.txt
npx code-editor-agent cmd init
rm RENAME-ME.code-editor-agent.md
npx code-editor-agent cmd generate
npx code-editor-agent tmp/test-file.ts > output.txt
compare_output 04-order

# 05-combined
cleanup_tmp
cp ../test-templates/05-combined/*.code-editor-agent.md tmp/
rm -rf .claude .config RENAME-ME.code-editor-agent.md output.txt
npx code-editor-agent cmd init
rm RENAME-ME.code-editor-agent.md
npx code-editor-agent cmd generate
npx code-editor-agent tmp/test-file.ts > output.txt
compare_output 05-combined

echo "All tests passed."
