#!/bin/bash

echo "🔍 Searching for route.ts files under src/app/api..."

for file in $(find src/app/api -type f -name 'route.ts'); do
  echo ""
  echo "-----------------------------"
  echo "📄 Found: $file"
  echo "-----------------------------"
  echo "Current file preview:"
  head -n 10 "$file"
  echo ""

  printf "➡️  Insert 'export const dynamic = \"force-dynamic\";' below the comment(s)? (y/n): "
  read confirm

  if [[ "$confirm" == "y" ]]; then
    # Count how many lines at the top are comments
    comment_lines=$(awk '/^\/\// { count++ } !/^\/\// { exit } END { print count }' "$file")

    if [[ "$comment_lines" -gt 0 ]]; then
      # Insert after comment block
      awk -v n="$comment_lines" 'NR==n+1 { print ""; print "export const dynamic = \"force-dynamic\";" } 1' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    else
      # No comment block; insert at top
      sed -i '' '1s/^/export const dynamic = "force-dynamic";\n\n/' "$file"
    fi

    echo "✅ Updated $file"
  else
    echo "❌ Skipped $file"
  fi
done

echo ""
echo "🎉 Done! Run 'git diff' to review changes and commit when ready."
