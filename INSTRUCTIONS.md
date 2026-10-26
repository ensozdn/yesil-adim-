# Project Constitution: Yesil Adim (Green Step)

## 1. Project Overview & Scope
Yesil Adim is a mobile-first, QR-driven micro web application developed for an elective course project at Sakarya University. It delivers a native mobile app feel inside the mobile browser without complex backend, database, or server setups. All persistent states are handled purely through browser `localStorage`.

### Core Architecture Pillars
1. **Starbucks Rewards Style Star Progression & Wallet:**
   - Scan detection via URL query parameters (e.g., `?scan=plastic`, `?scan=paper`, `?scan=battery`, `?scan=glass`, `?scan=organic`).
   - Instant award of +1 Star per valid scan.
   - Dynamic visual wallet showing current star balance, level/tier status, and milestone progress bar (e.g., target rewards at 5 or 10 stars).
   - No generic quiz or QA tasks.
2. **Photo-Enabled AI Waste Sorting Assistant:**
   - Interactive chat interface accepting camera capture, image upload, or direct text queries for recycling guidance (e.g., greasy pizza box, disposable coffee cup, broken ceramic).
   - Hybrid engine: Uses Google AI Studio (Gemini Flash API) when an API key is provided, with an intelligent offline fallback engine when no key is present or connectivity is unavailable.
3. **Mock Authentication System:**
   - Frictionless profile access using Student Number and Full Name.
   - Profile state bound directly to `localStorage`. No backend authentication, passwords, or verification tokens.

### Design System & Visual Foundation
- Primary Palette:
  - `--green: #23633f`
  - `--green2: #3d8655`
  - `--lime: #d9eea5`
  - `--ink: #1c2a21`
  - `--muted: #69756c`
  - `--bg: #f5f7f2`
  - `--line: #e2e8df`
- Form factor: Mobile-first responsive container, fixed bottom navigation, smooth transitions, native iOS feel.

---

## 2. Non-Negotiable Coding Rules (Strict Enforcement)

### Rule 1: Native English Codebase
- Every filename, folder, variable, function, component, type definition, interface, and CSS class must use natural, professional English.
- Turkish is strictly reserved for user-facing UI labels, notification copy, and displayed messages.

### Rule 2: Zero Code Comments
- Absolutely no single-line comments (`//`), multi-line comments (`/* */`), or JSX/HTML comment blocks are allowed anywhere in the codebase.
- The code must be self-documenting through clean naming, modular structure, and clear signatures.

### Rule 3: Zero Emoji Policy
- Emojis are strictly prohibited across the entire project: in UI screens, button labels, notifications, source code, data fixtures, and development communications.

### Rule 4: Apple Design Standards & Custom Inline SVG Icons
- UI components must adhere to Apple Human Interface Guidelines: consistent radii, subtle borders, high-contrast typography, and tactile tap feedback.
- Icons must be hand-crafted or dedicated inline SVG components with unified geometric styling and uniform stroke weight (`stroke-width: 1.8` or `2.0`). No third-party emoji-like icon fonts.

### Rule 5: Modular, Neat & Organized Architecture
- All code, components, services, utilities, and assets must be strictly modular, well-organized, and cleanly decoupled.
- Avoid oversized monolithic files. Distinct functional domains (wallet, AI chat, rewards, modals, profile) must be decomposed into dedicated, single-responsibility components and service modules.
- Maintain a structured folder hierarchy (`components/`, `services/`, `types/`, `styles/`) with clean, reusable exports.

---

## 3. Operational Protocol
This document serves as the binding project constitution. Prior to starting any task or modifying any file, the agent must review and adhere to all specifications, color tokens, and strict constraints defined herein.
