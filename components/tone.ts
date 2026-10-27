'use client';
import {useEffect} from 'react';
import type {FrogColor} from '@/lib/character';

// The saved friend's color and a color being previewed while choosing; the preview wins while it lasts.
let saved:FrogColor|null=null;let preview:FrogColor|null=null;
function paint(){
 const color=preview??saved;const root=document.documentElement;
 if(color&&color!=='sky')root.dataset.tone=color;else delete root.dataset.tone;
}

/** Tints buttons, choices and highlights with the friend's color; none (or sky) keeps the team's sky palette. */
export function applyTone(color?:FrogColor|null){saved=color??null;paint();}

/** Shows a color's tone while it is being picked, then returns to the saved friend's tone. */
export function useTonePreview(color:FrogColor|null){
 useEffect(()=>{if(!color)return;preview=color;paint();return()=>{preview=null;paint();};},[color]);
}
