# UX Decision — Halal terminology

Date: 2026-09-04

Visible UI terminology:
- Gate 1 PASS → HALALKONFORM
- Gate 1 FAIL → NICHT HALALKONFORM
- Gate 1 OPEN_REVIEW → PRÜFUNG OFFEN
- Raw/unknown status without a completed Gate 1 decision → UNGEPRÜFT

Technical engine states (PASS / FAIL / OPEN_REVIEW / UNKNOWN) may remain internal.
Gate 1 is authoritative for the Halal label shown on an open Investment-Akte.
