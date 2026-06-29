// ==========================================================================
// Financial Engine — Escrow state machine
// ==========================================================================

export type EscrowStatus =
  | 'pending'
  | 'funded'
  | 'partially_released'
  | 'released'
  | 'refunded'
  | 'disputed'
  | 'completed'
  | 'cancelled';

export interface EscrowState {
  status: EscrowStatus;
  totalAmount: number;
  releasedAmount: number;
  refundedAmount: number;
}

export const ESCROW_TRANSITIONS: Record<EscrowStatus, EscrowStatus[]> = {
  pending: ['funded', 'cancelled'],
  funded: ['released', 'partially_released', 'cancelled', 'disputed'],
  partially_released: ['released', 'funded', 'cancelled', 'disputed'],
  released: ['completed', 'refunded', 'disputed'],
  completed: [],
  cancelled: [],
  refunded: [],
  disputed: ['funded', 'refunded', 'cancelled'],
};

export function validateEscrowTransition(from: EscrowStatus, to: EscrowStatus): void {
  const allowed = ESCROW_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid escrow transition: ${from} → ${to}`);
  }
}

export function applyEscrowTransition(
  state: EscrowState,
  to: EscrowStatus,
  amount?: number,
): EscrowState {
  validateEscrowTransition(state.status, to);

  const next: EscrowState = { ...state, status: to };

  if (to === 'released' || to === 'completed') {
    next.releasedAmount = state.totalAmount;
  } else if (to === 'partially_released' && amount != null) {
    next.releasedAmount = Math.min(state.releasedAmount + amount, state.totalAmount);
  } else if (to === 'refunded') {
    next.refundedAmount = state.totalAmount;
  }

  return next;
}

export function isEscrowTerminal(status: EscrowStatus): boolean {
  return status === 'completed' || status === 'cancelled' || status === 'refunded';
}
