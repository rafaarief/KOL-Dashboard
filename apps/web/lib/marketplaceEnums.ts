// Shared literals for the free-text budgetType/feeType columns (no DB-level enum backs them —
// see packages/database/src/schema.ts). Centralized so a typo in a filter check can't silently
// stop matching anything; query filters and the <option value> lists that feed them should both
// import from here instead of retyping the string.
export const BUDGET_TYPE_BARTER = "barter" as const;
export const FEE_TYPE_BARTER = "barter" as const;
export const FEE_TYPE_PAID = "paid" as const;
