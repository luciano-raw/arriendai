'use client';
import { useEffect, useRef } from 'react';
export function useDialog(open:boolean,onClose:()=>void,busy:boolean){
 const close=useRef(onClose);close.current=onClose;
 useEffect(()=>{if(!open)return;const previous=document.activeElement as HTMLElement|null;const dialog=document.querySelector<HTMLElement>('.modal');const nodes=()=>Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not([type=hidden]), select')||[]);nodes()[0]?.focus();const listener=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!busy)close.current();if(event.key==='Tab'){const items=nodes();const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}};document.addEventListener('keydown',listener);return()=>{document.removeEventListener('keydown',listener);previous?.focus();};},[open,busy]);
}
