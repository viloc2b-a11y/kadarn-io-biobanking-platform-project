// ==========================================================================
// API Contract Validator — Validate API contracts and detect breaking changes
// Sprint 9.11 — External Integration APIs
// ==========================================================================

import type { ApiContract } from './types.js';

export class ApiContractValidator {
  /**
   * Validate that an API contract is structurally correct.
   */
  static validateContract(contract: ApiContract): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!contract.name) errors.push('Contract name is required');
    if (!contract.version) errors.push('Contract version is required');
    if (!contract.basePath) errors.push('Base path is required');
    if (!contract.basePath.startsWith('/')) errors.push('Base path must start with /');
    if (!contract.endpoints || contract.endpoints.length === 0) errors.push('At least one endpoint is required');

    for (const endpoint of contract.endpoints) {
      if (!endpoint.path.startsWith('/')) {
        errors.push(`Endpoint ${endpoint.method} ${endpoint.path}: path must start with /`);
      }
      if (!['GET', 'POST', 'PUT', 'DELETE'].includes(endpoint.method)) {
        errors.push(`Invalid HTTP method: ${endpoint.method}`);
      }
      if (!['none', 'bearer', 'api-key', 'basic'].includes(endpoint.auth)) {
        errors.push(`Invalid auth type: ${endpoint.auth}`);
      }
      if (!endpoint.responses || endpoint.responses.length === 0) {
        errors.push(`Endpoint ${endpoint.method} ${endpoint.path}: at least one response required`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Compare two API contracts and detect breaking changes.
   */
  static detectBreakingChanges(oldContract: ApiContract, newContract: ApiContract): string[] {
    const breaking: string[] = [];

    // Check removed endpoints
    for (const oldEp of oldContract.endpoints) {
      const newEp = newContract.endpoints.find(
        (e) => e.method === oldEp.method && e.path === oldEp.path,
      );
      if (!newEp) {
        breaking.push(`BREAKING: Endpoint ${oldEp.method} ${oldEp.path} removed`);
        continue;
      }
      // Check auth change
      if (oldEp.auth !== newEp.auth) {
        breaking.push(`BREAKING: Auth changed for ${oldEp.method} ${oldEp.path} (${oldEp.auth} → ${newEp.auth})`);
      }
      // Check removed required body fields
      if (oldEp.request?.body && newEp.request?.body) {
        for (const [field, spec] of Object.entries(oldEp.request.body)) {
          if (spec.required && !newEp.request.body[field]) {
            breaking.push(`BREAKING: Required field '${field}' removed from ${oldEp.method} ${oldEp.path}`);
          }
        }
      }
    }

    return breaking;
  }
}
