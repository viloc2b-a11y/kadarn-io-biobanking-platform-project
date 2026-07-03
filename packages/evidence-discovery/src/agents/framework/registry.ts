// ==========================================================================
// Evidence Discovery — Agent Registry
// ==========================================================================
// Sprint 20A.4A.
// ==========================================================================

import type { DiscoveryAgent } from './types';
import type { SemanticRequestType } from '../../preparation/types.js';

export class AgentRegistry {
  constructor(private agents: DiscoveryAgent[] = []) {}

  register(agent: DiscoveryAgent): void {
    this.agents.push(agent);
  }

  find(requestType: SemanticRequestType): DiscoveryAgent {
    const agent = this.agents.find(a => a.supports(requestType));
    if (!agent) {
      throw new Error(`No agent supports request type: ${requestType}`);
    }
    return agent;
  }

  list(): DiscoveryAgent[] {
    return [...this.agents];
  }
}
