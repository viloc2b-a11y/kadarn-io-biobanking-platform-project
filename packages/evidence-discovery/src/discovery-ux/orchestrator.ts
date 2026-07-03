// ==========================================================================
// Discovery UX — State Machine Orchestrator
// ==========================================================================
// Sprint 20B.7.
//
// Manages UX state transitions, progress tracking, and message generation.
// No UI code — pure state machine and data contracts.
// ==========================================================================

import type { InstitutionalProfile } from '../profile/types.js';
import type {
  DiscoveryUXState,
  DiscoveryUXEvent,
  DiscoveryPhase,
  DiscoveryPhaseStatus,
  OnboardingState,
  UploadingState,
  ProcessingState,
  ReviewState,
  CompleteState,
  ReviewItem,
  ReviewedItem,
  UXMessage,
  DiscoveryUXConfig,
} from './types';
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS, DEFAULT_UX_CONFIG } from './types';

// --------------------------------------------------------------------------
// UX Orchestrator
// --------------------------------------------------------------------------

export class DiscoveryUXOrchestrator {
  private state: DiscoveryUXState;
  private config: DiscoveryUXConfig;
  private messages: UXMessage[] = [];
  private startTime: number;
  private phaseStartTimes: Map<DiscoveryPhase, number> = new Map();

  constructor(config?: Partial<DiscoveryUXConfig>) {
    this.config = { ...DEFAULT_UX_CONFIG, ...config };
    this.startTime = Date.now();
    this.state = this.initialOnboardingState();
  }

  /** Get current UX state */
  getState(): DiscoveryUXState {
    return this.state;
  }

  /** Get accumulated UX messages */
  getMessages(): UXMessage[] {
    return [...this.messages];
  }

  /** Clear consumed messages */
  clearMessages(): void {
    this.messages = [];
  }

  /** Process a UX event and transition state */
  dispatch(event: DiscoveryUXEvent): DiscoveryUXState {
    switch (this.state.phase) {
      case 'onboarding':
        return this.handleOnboarding(event);
      case 'uploading':
        return this.handleUploading(event);
      case 'processing':
        return this.handleProcessing(event);
      case 'reviewing':
        return this.handleReviewing(event);
      case 'complete':
        return this.handleComplete(event);
    }
  }

  // ------------------------------------------------------------------------
  // Phase Handlers
  // ------------------------------------------------------------------------

  private handleOnboarding(event: DiscoveryUXEvent): DiscoveryUXState {
    if (event.type === 'INSTITUTION_SUBMITTED') {
      this.addMessage({
        type: 'recognition_moment',
        title: 'Institution recognized',
        description: `We're starting to build a profile for ${event.institutionName}.`,
        suggestedAction: 'Upload documents to begin discovery',
        requiresAttention: false,
      });

      this.state = {
        phase: 'uploading',
        status: 'idle',
        files: [],
        progress: 0,
      };
      this.phaseStartTimes.set('uploading', Date.now());
    }

    return this.state;
  }

  private handleUploading(event: DiscoveryUXEvent): DiscoveryUXState {
    const uploadState = this.state as UploadingState;

    switch (event.type) {
      case 'DOCUMENTS_UPLOADED': {
        const newFiles = Array.from({ length: event.fileCount }, (_, i) => ({
          fileName: `document-${uploadState.files.length + i + 1}`,
          size: 0,
          status: 'pending' as const,
        }));

        this.state = {
          ...uploadState,
          status: 'in_progress',
          files: [...uploadState.files, ...newFiles],
          progress: Math.min(100, Math.round((uploadState.files.length + event.fileCount) * 0.1)),
        };
        break;
      }

      case 'PIPELINE_STARTED': {
        this.addMessage({
          type: 'recognition_moment',
          title: 'Analysis in progress',
          description: 'Kadarn is analyzing your documents. This typically takes a few minutes.',
          suggestedAction: 'Wait for results',
          requiresAttention: false,
        });

        this.state = {
          phase: 'processing',
          status: 'in_progress',
          currentStage: PIPELINE_STAGES[0],
          overallProgress: 0,
          stageProgress: 0,
          completedStages: [],
        };
        this.phaseStartTimes.set('processing', Date.now());
        break;
      }

      case 'PIPELINE_FAILED': {
        this.addMessage({
          type: 'error',
          title: 'Processing failed',
          description: event.error,
          suggestedAction: 'Check your documents and try again',
          requiresAttention: true,
        });

        this.state = {
          ...uploadState,
          status: 'failed',
        };
        break;
      }
    }

    return this.state;
  }

  private handleProcessing(event: DiscoveryUXEvent): DiscoveryUXState {
    const procState = this.state as ProcessingState;

    switch (event.type) {
      case 'PIPELINE_PROGRESS': {
        const stageIndex = PIPELINE_STAGES.indexOf(event.stage as any);
        const completedStages = stageIndex > 0
          ? PIPELINE_STAGES.slice(0, stageIndex)
          : procState.completedStages;

        const overallProgress = Math.round(
          ((stageIndex >= 0 ? stageIndex : 0) / PIPELINE_STAGES.length) * 100 +
            (event.percent / PIPELINE_STAGES.length),
        );

        this.state = {
          ...procState,
          currentStage: event.stage,
          overallProgress: Math.min(overallProgress, 99),
          stageProgress: event.percent,
          completedStages,
        };

        // Add milestone messages at key stages
        if (event.percent === 100) {
          this.addMilestoneMessage(event.stage);
        }
        break;
      }

      case 'PIPELINE_COMPLETED': {
        this.addMessage({
          type: 'recognition_moment',
          title: 'Discovery complete',
          description: `We identified ${event.profile.summary.confirmedCapabilities} capabilities and ${event.profile.summary.totalClaimCandidates} potential claims for ${event.profile.institutionName}.`,
          suggestedAction: 'Review the results',
          requiresAttention: true,
        });

        const reviewItems = this.buildReviewItems(event.profile);

        this.state = {
          phase: 'reviewing',
          status: reviewItems.length > 0 ? 'in_progress' : 'completed',
          profile: event.profile,
          currentReviewItem: reviewItems.length > 0 ? reviewItems[0] : null,
          pendingItems: reviewItems,
          reviewedItems: [],
          completed: reviewItems.length === 0,
        };
        this.phaseStartTimes.set('reviewing', Date.now());
        break;
      }

      case 'PIPELINE_FAILED': {
        this.addMessage({
          type: 'error',
          title: 'Analysis failed',
          description: event.error,
          suggestedAction: 'Review your documents and try again',
          requiresAttention: true,
        });

        this.state = {
          ...procState,
          status: 'failed',
        };
        break;
      }
    }

    return this.state;
  }

  private handleReviewing(event: DiscoveryUXEvent): DiscoveryUXState {
    const reviewState = this.state as ReviewState;

    switch (event.type) {
      case 'HUMAN_REVIEW_ACTION': {
        const remainingItems = reviewState.pendingItems.filter(
          i => i.itemId !== event.targetId,
        );
        const reviewedItem: ReviewedItem = {
          itemId: event.targetId,
          action: event.action,
          reviewedAt: new Date().toISOString(),
        };

        const reviewedItems = [...reviewState.reviewedItems, reviewedItem];

        if (remainingItems.length === 0) {
          // Review complete
          this.addMessage({
            type: 'complete',
            title: 'Review complete',
            description: 'All items have been reviewed. Your institutional profile is ready.',
            suggestedAction: 'View your institutional profile',
            requiresAttention: true,
          });

          this.state = {
            phase: 'complete',
            status: 'completed',
            profile: reviewState.profile,
            completedAt: new Date().toISOString(),
            exported: false,
          };
          this.phaseStartTimes.set('complete', Date.now());
        } else {
          this.state = {
            ...reviewState,
            pendingItems: remainingItems,
            reviewedItems,
            currentReviewItem: remainingItems[0],
          };
        }
        break;
      }

      case 'HUMAN_REVIEW_COMPLETED': {
        this.addMessage({
          type: 'complete',
          title: 'Review complete',
          description: 'Your institutional profile is ready.',
          suggestedAction: 'View your institutional profile',
          requiresAttention: true,
        });

        this.state = {
          phase: 'complete',
          status: 'completed',
          profile: reviewState.profile,
          completedAt: new Date().toISOString(),
          exported: false,
        };
        this.phaseStartTimes.set('complete', Date.now());
        break;
      }
    }

    return this.state;
  }

  private handleComplete(event: DiscoveryUXEvent): DiscoveryUXState {
    const completeState = this.state as CompleteState;

    if (event.type === 'PROFILE_EXPORTED') {
      this.state = {
        ...completeState,
        exported: true,
      };
    }

    return this.state;
  }

  // ------------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------------

  private initialOnboardingState(): OnboardingState {
    this.phaseStartTimes.set('onboarding', this.startTime);
    return {
      phase: 'onboarding',
      status: 'idle',
      institutionName: null,
      completed: false,
    };
  }

  private addMessage(message: UXMessage): void {
    this.messages.push(message);
  }

  private addMilestoneMessage(stage: string): void {
    const label = PIPELINE_STAGE_LABELS[stage as keyof typeof PIPELINE_STAGE_LABELS] ?? stage;

    this.addMessage({
      type: 'capability_discovered',
      title: `Stage complete: ${label}`,
      description: `The ${label.toLowerCase()} stage has completed successfully.`,
      suggestedAction: undefined,
      requiresAttention: false,
    });
  }

  private buildReviewItems(profile: InstitutionalProfile): ReviewItem[] {
    const items: ReviewItem[] = [];

    // Capabilities needing review
    for (const cap of profile.components.capabilities.capabilities) {
      if (cap.status === 'suspected') {
        items.push({
          itemId: cap.capabilityId,
          type: 'capability',
          label: cap.name,
          description: `Suspected capability (confidence: ${(cap.confidence * 100).toFixed(0)}%): ${cap.reasoning}`,
          sourceIds: cap.supportingEntityIds,
        });
      }
    }

    // Claims with low coverage
    for (const claim of profile.components.claims.candidates) {
      if (claim.evidenceCoverage < 0.5) {
        items.push({
          itemId: claim.claimId,
          type: 'claim',
          label: claim.summary.slice(0, 80),
          description: `Low evidence coverage (${(claim.evidenceCoverage * 100).toFixed(0)}%): ${claim.humanExplanation}`,
          sourceIds: claim.supportingEvidence.entityIds,
        });
      }
    }

    return items;
  }
}
