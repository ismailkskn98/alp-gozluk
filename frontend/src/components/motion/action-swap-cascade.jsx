"use client";;
// beui.dev/components/motion/action-swap

import { ActionSwapButton, ActionSwapIcon, ActionSwapText } from "./action-swap";

export function ActionSwapCascadeButton(props) {
  return <ActionSwapButton {...props} animation="cascade" />;
}

export function ActionSwapCascadeText(props) {
  return <ActionSwapText {...props} animation="cascade" />;
}

export function ActionSwapCascadeIcon(props) {
  return <ActionSwapIcon {...props} animation="cascade" />;
}
