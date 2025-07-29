import { TimelineEvidence, CaseLoader } from './case-loader';

export interface ValidationResult {
  isCorrect: boolean;
  score: number;
  errors: ValidationError[];
  perfectOrder: string[]; // Correct evidence IDs in order
  feedback: string;
}

export interface ValidationError {
  evidenceId: string;
  expectedPosition: number;
  actualPosition: number;
  message: string;
  isAnchorError: boolean;
}

export class TimelineValidator {
  static validateOrder(
    playerOrder: string[], 
    evidence: TimelineEvidence[]
  ): ValidationResult {
    const correctOrder = CaseLoader.sortEvidenceByTime(evidence);
    const correctIds = correctOrder.map(e => e.id);
    
    let score = 100;
    const errors: ValidationError[] = [];
    
    // Check each position
    playerOrder.forEach((evidenceId, actualPos) => {
      const expectedPos = correctIds.indexOf(evidenceId);
      
      if (expectedPos !== actualPos) {
        const evidenceItem = correctOrder.find(e => e.id === evidenceId);
        const isAnchor = evidenceItem?.timeHappenedAnchor || evidenceItem?.timeDiscoveredAnchor;
        
        errors.push({
          evidenceId,
          expectedPosition: expectedPos,
          actualPosition: actualPos,
          message: isAnchor 
            ? "This is a key event - check its timing carefully!"
            : "This evidence belongs elsewhere in the timeline",
          isAnchorError: isAnchor || false
        });
        
        // Deduct more points for anchor evidence errors
        score -= isAnchor ? 15 : 10;
      }
    });
    
    const isCorrect = errors.length === 0;
    const feedback = this.generateFeedback(isCorrect, errors, score);
    
    return {
      isCorrect,
      score: Math.max(0, score),
      errors,
      perfectOrder: correctIds,
      feedback
    };
  }

  private static generateFeedback(isCorrect: boolean, errors: ValidationError[], score: number): string {
    if (isCorrect) {
      if (score === 100) {
        return "Perfect! You've reconstructed the timeline flawlessly on your first try! 🎉";
      } else {
        return "Excellent work! You've successfully arranged the evidence in chronological order! ✅";
      }
    }

    const anchorErrors = errors.filter(e => e.isAnchorError).length;
    const totalErrors = errors.length;

    if (anchorErrors > 0) {
      return `${totalErrors} evidence pieces are misplaced, including ${anchorErrors} key events. Focus on the anchor points! ⭐`;
    } else {
      return `${totalErrors} evidence pieces need to be repositioned. Check the timestamps carefully! 🕐`;
    }
  }

  static generateHint(
    playerOrder: string[],
    evidence: TimelineEvidence[],
    hintCount: number
  ): string {
    const correctOrder = CaseLoader.sortEvidenceByTime(evidence);
    const correctIds = correctOrder.map(e => e.id);
    
    // Find first incorrect position
    for (let i = 0; i < playerOrder.length; i++) {
      if (playerOrder[i] !== correctIds[i]) {
        const evidenceItem = evidence.find(e => e.id === playerOrder[i]);
        const correctItem = evidence.find(e => e.id === correctIds[i]);
        
        if (hintCount === 1) {
          return `💡 Hint: The evidence "${evidenceItem?.name}" is not in the correct position.`;
        } else if (hintCount === 2) {
          return `💡 Hint: "${correctItem?.name}" should be in position ${i + 1}.`;
        } else {
          const timeDisplay = CaseLoader.formatTimeForDisplay(
            correctItem?.timeHappened || correctItem?.timeDiscovered
          );
          return `💡 Hint: "${correctItem?.name}" occurred at ${timeDisplay}.`;
        }
      }
    }
    
    return "💡 You're on the right track! Keep checking the timestamps.";
  }

  static calculatePositionScore(expectedPos: number, actualPos: number): number {
    const distance = Math.abs(expectedPos - actualPos);
    if (distance === 0) return 10; // Perfect position
    if (distance === 1) return 7;  // Close
    if (distance === 2) return 5;  // Somewhat close
    return 2; // Far off
  }

  static getTimelineProgress(playerOrder: string[], evidence: TimelineEvidence[]): number {
    const correctOrder = CaseLoader.sortEvidenceByTime(evidence);
    const correctIds = correctOrder.map(e => e.id);
    
    let correctPositions = 0;
    playerOrder.forEach((evidenceId, index) => {
      if (correctIds[index] === evidenceId) {
        correctPositions++;
      }
    });
    
    return Math.round((correctPositions / playerOrder.length) * 100);
  }
}