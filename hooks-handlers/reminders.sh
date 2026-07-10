#!/usr/bin/env bash
# Reminders helper — wraps osascript for standup-sync
# Usage: reminders.sh <command> [args...]
#
# Commands:
#   get_lists
#   ensure_list <name>
#   get_reminders <list>
#   create_reminder <list> <title> <body> <priority>   (priority: 1=high 5=medium 9=low)
#   complete_reminder <list> <url>
#   update_reminder <list> <url> <title> <body> <priority>

set -euo pipefail

cmd="${1:-}"
shift || true

case "$cmd" in

get_lists)
  osascript << 'ASCRIPT'
tell application "Reminders"
  set output to ""
  repeat with l in lists
    set output to output & name of l & "
"
  end repeat
  return output
end tell
ASCRIPT
  ;;

ensure_list)
  list_name="$1"
  osascript - "$list_name" << 'ASCRIPT'
on run argv
  set listName to item 1 of argv
  tell application "Reminders"
    if not (exists list listName) then
      make new list with properties {name:listName}
    end if
    return "ok"
  end tell
end run
ASCRIPT
  ;;

get_reminders)
  list_name="$1"
  # Output: one reminder per line, fields separated by |||
  # Format: <title>|||<body>|||<priority>|||<completed>|||<id>
  osascript - "$list_name" << 'ASCRIPT'
on run argv
  set listName to item 1 of argv
  tell application "Reminders"
    if not (exists list listName) then return ""
    set output to ""
    repeat with r in reminders of list listName
      set output to output & name of r & "|||" & body of r & "|||" & priority of r & "|||" & completed of r & "|||" & id of r & "
"
    end repeat
    return output
  end tell
end run
ASCRIPT
  ;;

create_reminder)
  list_name="$1"; title="$2"; body="$3"; priority="$4"
  osascript - "$list_name" "$title" "$body" "$priority" << 'ASCRIPT'
on run argv
  set listName to item 1 of argv
  set rTitle to item 2 of argv
  set rBody to item 3 of argv
  set rPriority to item 4 of argv as integer
  tell application "Reminders"
    make new reminder in list listName with properties {name:rTitle, body:rBody, priority:rPriority}
    return "created"
  end tell
end run
ASCRIPT
  ;;

complete_reminder)
  list_name="$1"; url="$2"
  osascript - "$list_name" "$url" << 'ASCRIPT'
on run argv
  set listName to item 1 of argv
  set targetUrl to item 2 of argv
  tell application "Reminders"
    if not (exists list listName) then return "list not found"
    repeat with r in reminders of list listName
      if body of r contains targetUrl then
        set completed of r to true
        return "completed"
      end if
    end repeat
    return "not found"
  end tell
end run
ASCRIPT
  ;;

update_reminder)
  list_name="$1"; url="$2"; title="$3"; body="$4"; priority="$5"
  osascript - "$list_name" "$url" "$title" "$body" "$priority" << 'ASCRIPT'
on run argv
  set listName to item 1 of argv
  set targetUrl to item 2 of argv
  set newTitle to item 3 of argv
  set newBody to item 4 of argv
  set newPriority to item 5 of argv as integer
  tell application "Reminders"
    if not (exists list listName) then return "list not found"
    repeat with r in reminders of list listName
      if body of r contains targetUrl then
        set name of r to newTitle
        set body of r to newBody
        set priority of r to newPriority
        return "updated"
      end if
    end repeat
    return "not found"
  end tell
end run
ASCRIPT
  ;;

*)
  echo "Unknown command: $cmd" >&2
  echo "Usage: reminders.sh <get_lists|ensure_list|get_reminders|create_reminder|complete_reminder|update_reminder> [args]" >&2
  exit 1
  ;;
esac
