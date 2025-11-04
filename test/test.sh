#!/bin/sh

set -e

# Allow overriding the command via CMD environment variable
# Usage: CMD="npx code-editor-agent" ./test.sh
# Usage: CMD="../go/code-editor-agent" ./test.sh
CMD="${CMD:-npx code-editor-agent}"

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
$CMD cmd init
$CMD test.sh > output.txt
$CMD RENAME-ME.code-editor-agent.md >> output.txt
compare_with_snapshot 00-initial

# 01-ignorePatterns
cleanup_tmp
cp ../test-templates/01-ignorePatterns/basic.code-editor-agent.md tmp/rule.code-editor-agent.md
rm -rf .claude .config RENAME-ME.code-editor-agent.md output.txt
$CMD cmd init
rm RENAME-ME.code-editor-agent.md
$CMD cmd generate
$CMD tmp/test-file.ts > output.txt
$CMD tmp/ignored.ts >> output.txt
compare_output 01-ignorePatterns

# 02-tags-references
cleanup_tmp
cp ../test-templates/02-tags-references/*.code-editor-agent.md tmp/
rm -rf .claude .config RENAME-ME.code-editor-agent.md output.txt
$CMD cmd init
rm RENAME-ME.code-editor-agent.md
$CMD cmd generate
$CMD tmp/test-file.ts > output.txt
compare_output 02-tags-references

# 03-priority
cleanup_tmp
cp ../test-templates/03-priority/*.code-editor-agent.md tmp/
rm -rf .claude .config RENAME-ME.code-editor-agent.md output.txt
$CMD cmd init
rm RENAME-ME.code-editor-agent.md
$CMD cmd generate
$CMD tmp/test-file.ts > output.txt
compare_output 03-priority

# 04-order
cleanup_tmp
cp ../test-templates/04-order/*.code-editor-agent.md tmp/
rm -rf .claude .config RENAME-ME.code-editor-agent.md output.txt
$CMD cmd init
rm RENAME-ME.code-editor-agent.md
$CMD cmd generate
$CMD tmp/test-file.ts > output.txt
compare_output 04-order

# 05-combined
cleanup_tmp
cp ../test-templates/05-combined/*.code-editor-agent.md tmp/
rm -rf .claude .config RENAME-ME.code-editor-agent.md output.txt
$CMD cmd init
rm RENAME-ME.code-editor-agent.md
$CMD cmd generate
$CMD tmp/test-file.ts > output.txt
compare_output 05-combined

# 06-multi-agent
cleanup_tmp
cp ../test-templates/06-multi-agent/*.code-editor-agent.md tmp/
cp ../test-templates/06-multi-agent/*.code-reviewer.md tmp/
rm -rf .claude .config RENAME-ME.code-editor-agent.md output.txt
$CMD cmd init
rm RENAME-ME.code-editor-agent.md
cp ../test-templates/06-multi-agent/config.json .config/code-editor-agent.jsonc
$CMD cmd generate
$CMD tmp/test.ts > output.txt
$CMD reviewer tmp/test.ts >> output.txt
compare_output 06-multi-agent

echo "All tests passed."
