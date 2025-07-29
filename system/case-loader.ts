export interface TimelineEvidence {
  id: string;
  name: string;
  description: string;
  type: string;
  location?: string;
  imageUrl?: string;
  timeHappened?: string;
  timeDiscovered?: string;
  timeHappenedAnchor?: boolean;
  timeDiscoveredAnchor?: boolean;
  timeHappenedDescription?: string;
  timeDiscoveredDescription?: string;
  isHidden: boolean;
}

export interface EvidenceType {
  id: string;
  name: string;
  color: string;
  defaultImageUrl?: string;
}

export interface CaseData {
  evidence: TimelineEvidence[];
  gameSettings: {
    caseTitle: string;
    objective: string;
    questionText?: string;
  };
  evidenceTypes: EvidenceType[];
}

export class CaseLoader {
  static async loadCase(caseId: string): Promise<CaseData> {
    try {
      const response = await fetch(`/cases/${caseId}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load case: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error loading case ${caseId}:`, error);
      throw error;
    }
  }

  static filterEvidenceByDifficulty(
    evidence: TimelineEvidence[], 
    difficulty: 'easy' | 'medium' | 'hard'
  ): TimelineEvidence[] {
    // Filter visible evidence with timeline data
    const timelineEvidence = evidence.filter(e => 
      !e.isHidden && (e.timeHappened || e.timeDiscovered)
    );

    // Sort by timestamp
    const sorted = this.sortEvidenceByTime(timelineEvidence);

    // Select appropriate count based on difficulty
    const counts = { easy: 8, medium: 10, hard: 12 };
    const targetCount = Math.min(counts[difficulty], sorted.length);

    // Ensure anchor evidence is included
    const anchors = sorted.filter(e => e.timeHappenedAnchor || e.timeDiscoveredAnchor);
    const nonAnchors = sorted.filter(e => !e.timeHappenedAnchor && !e.timeDiscoveredAnchor);

    // Take all anchors plus fill remaining slots
    const selected = [...anchors];
    const remaining = targetCount - anchors.length;
    
    if (remaining > 0) {
      // Distribute remaining slots evenly across timeline
      const step = Math.max(1, Math.floor(nonAnchors.length / remaining));
      for (let i = 0; i < remaining && i * step < nonAnchors.length; i++) {
        selected.push(nonAnchors[i * step]);
      }
    }

    return selected.slice(0, targetCount);
  }

  static sortEvidenceByTime(evidence: TimelineEvidence[]): TimelineEvidence[] {
    return evidence.sort((a, b) => {
      const timeA = a.timeHappened || a.timeDiscovered || '9999-12-31T23:59:59';
      const timeB = b.timeHappened || b.timeDiscovered || '9999-12-31T23:59:59';
      return new Date(timeA).getTime() - new Date(timeB).getTime();
    });
  }

  static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static getEvidenceType(evidence: TimelineEvidence, evidenceTypes: EvidenceType[]): EvidenceType {
    return evidenceTypes.find(type => type.id === evidence.type) || {
      id: 'unknown',
      name: 'Unknown',
      color: 'bg-gray-100 text-gray-800'
    };
  }

  static formatTimeForDisplay(timestamp?: string): string {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timestamp;
    }
  }
}