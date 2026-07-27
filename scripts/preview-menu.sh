#!/bin/bash
# TUI Preview Menu

clear
echo
echo "╭─────────────────────────────────╮"
echo "│  Pi TUI Component Preview       │"
echo "╰─────────────────────────────────╯"
echo
echo "Select a component to preview:"
echo
echo "  1) Work Selector"
echo "  2) Complexity Router"
echo "  3) Activation Banner"
echo "  q) Quit"
echo
read -p "Choice: " choice

case $choice in
  1) node scripts/preview-tui.js 1 ;;
  2) node scripts/preview-tui.js 2 ;;
  3) node scripts/preview-tui.js 3 ;;
  q|Q) exit 0 ;;
  *) echo "Invalid choice" ; exit 1 ;;
esac
