// Ícones inline copiados 1:1 da referência (mesmos paths/tamanhos/strokes),
// para garantir fidelidade visual. Não substituir por lucide.
import type { JSX } from "react";

export function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth={1.6}>
      <path d="M12 21c-4.5-3.6-8-6.6-8-10.2A4.6 4.6 0 0 1 8.6 6c1.4 0 2.7.7 3.4 1.8A4.1 4.1 0 0 1 15.4 6 4.6 4.6 0 0 1 20 10.8c0 3.6-3.5 6.6-8 10.2Z" />
    </svg>
  );
}

export function BagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth={1.6}>
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </svg>
  );
}

export function BagBigIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" strokeWidth={1.4}>
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </svg>
  );
}

export function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A6606C" strokeWidth={1.8}>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

export function CheckNoteIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2F4A3C" strokeWidth={2}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function TruckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A6606C" strokeWidth={1.7}>
      <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17.5" cy="18" r="1.8" />
    </svg>
  );
}

export function HeartBenefitIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A6606C" strokeWidth={1.7}>
      <path d="M12 21c-4.5-3.6-8-6.6-8-10.2A4.6 4.6 0 0 1 8.6 6c1.4 0 2.7.7 3.4 1.8A4.1 4.1 0 0 1 15.4 6 4.6 4.6 0 0 1 20 10.8c0 3.6-3.5 6.6-8 10.2Z" />
    </svg>
  );
}

export function CardIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A6606C" strokeWidth={1.7}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

export function WhatsAppIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.6 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.3-.7.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.1-.7l.4-.5c.1-.2.1-.3.2-.5s0-.4 0-.5c-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.2-.3-.2-.6-.3Z" />
    </svg>
  );
}

export function CheckSuccessIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#A6606C" strokeWidth={2.4}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// Flor estilizada usada no fallback de imagem.
export function FlowerFallback(): JSX.Element {
  return (
    <svg viewBox="0 0 100 100" style={{ width: "46%", height: "auto", opacity: 0.8, margin: "auto" }}>
      <g transform="translate(50 42)">
        <ellipse rx="10" ry="22" fill="#C98A93" />
        <ellipse rx="10" ry="22" transform="rotate(60)" fill="#D9A5AC" />
        <ellipse rx="10" ry="22" transform="rotate(120)" fill="#C98A93" />
        <circle r="8" fill="#B08D57" />
      </g>
      <path d="M50 62v24M50 70l-9 12M50 70l9 12" stroke="#2F4A3C" strokeWidth={3} strokeLinecap="round" fill="none" />
    </svg>
  );
}
