# Detective Timeline Puzzle - Implementation Plan

## Overview

This document provides the detailed implementation roadmap for building the detective timeline puzzle mini-game within the existing wolfy-module-kit framework.

## Phase 1: Core Infrastructure Setup

### 1.1 Update Configuration Schema

**File: `system/configuration.ts`**
```typescript
// Add timeline game configuration
const timelineGameConfig = z.object({
  selectedCase: z.enum(["WongTimeline", "midnightOilTimeline2", "beaumontTimeline2"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  maxAttempts: z.number().min(1).max(10).default(3),
  showHints: z.boolean().default(true),
  timeLimit: z.number().optional(), // seconds
});

const moduleConfiguration = z.object({
  resultAction: AppActionsSchema,
  ...timelineGameConfig.shape, // Merge timeline config
});
```

### 1.2 Update Form Fields

**File: `components/ConfigForm/formFields.ts`**
```typescript
export const FORM_FIELDS: FormFieldConfig[] = [
  {
    key: "selectedCase",
    label: "Detective Case",
    type: "select",
    options: [
      { value: "WongTimeline", label: "The Wong Family Murder" },
      { value: "midnightOilTimeline2", label: "The Midnight Oil" },
      { value: "beaumontTimeline2", label: "The Beaumont Gala Murder" }
    ],
    required: true,
  },
  {
    key: "difficulty",
    label: "Difficulty Level",
    type: "select",
    options: [
      { value: "easy", label: "Easy (6-8 evidence)" },
      { value: "medium", label: "Medium (8-10 evidence)" },
      { value: "hard", label: "Hard (10-12 evidence)" }
    ],
    required: true,
  },
  {
    key: "maxAttempts",
    label: "Maximum Attempts",
    type: "number",
    min: 1,
    max: 10,
    defaultValue: 3,
    required: true,
  },
  {
    key: "showHints",
    label: "Enable Hints",
    type: "checkbox",
    defaultValue: true,
  },
  // ... existing fields
];
```

### 1.3 Update Result Actions

**File: `system/actions.ts`**
```typescript
enum CustomActions {
  TimelinePerfect = 'timeline-perfect',    // All correct on first try
  TimelineSuccess = 'timeline-success',    // Completed successfully  
  TimelineFailed = 'timeline-failed',      // Exceeded max attempts
  TimelineAbandoned = 'timeline-abandoned', // Player quit
}
```

## Phase 2: Data Layer Implementation

### 2.1 Case Data Loader

**File: `system/case-loader.ts`**
```typescript
interface TimelineEvidence {
  id: string;
  name: string;
  description: string;
  type: string;
  imageUrl?: string;
  timeHappened?: string;
  timeDiscovered?: string;
  timeHappenedAnchor?: boolean;
  timeDiscoveredAnchor?: boolean;
  isHidden: boolean;
}

interface CaseData {
  evidence: TimelineEvidence[];
  gameSettings: {
    caseTitle: string;
    objective: string;
  };
  evidenceTypes: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

class CaseLoader {
  static async loadCase(caseId: string): Promise<CaseData> {
    const response = await fetch(`/cases/${caseId}.json`);
    return response.json();
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
      const step = Math.floor(nonAnchors.length / remaining);
      for (let i = 0; i < remaining && i * step < nonAnchors.length; i++) {
        selected.push(nonAnchors[i * step]);
      }
    }

    return selected.slice(0, targetCount);
  }

  static sortEvidenceByTime(evidence: TimelineEvidence[]): TimelineEvidence[] {
    return evidence.sort((a, b) => {
      const timeA = a.timeHappened || a.timeDiscovered || '9999-12-31';
      const timeB = b.timeHappened || b.timeDiscovered || '9999-12-31';
      return new Date(timeA).getTime() - new Date(timeB).getTime();
    });
  }
}
```

### 2.2 Timeline Validation Engine

**File: `system/timeline-validation.ts`**
```typescript
interface ValidationResult {
  isCorrect: boolean;
  score: number;
  errors: ValidationError[];
  perfectOrder: string[]; // Correct evidence IDs in order
}

interface ValidationError {
  evidenceId: string;
  expectedPosition: number;
  actualPosition: number;
  message: string;
}

class TimelineValidator {
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
        const evidence = correctOrder.find(e => e.id === evidenceId);
        const isAnchor = evidence?.timeHappenedAnchor || evidence?.timeDiscoveredAnchor;
        
        errors.push({
          evidenceId,
          expectedPosition: expectedPos,
          actualPosition: actualPos,
          message: isAnchor 
            ? "This is a key event - check its timing carefully!"
            : "This evidence belongs elsewhere in the timeline"
        });
        
        // Deduct more points for anchor evidence errors
        score -= isAnchor ? 15 : 10;
      }
    });
    
    return {
      isCorrect: errors.length === 0,
      score: Math.max(0, score),
      errors,
      perfectOrder: correctIds
    };
  }
}
```

## Phase 3: UI Components

### 3.1 Evidence Card Component

**File: `components/EvidenceCard.tsx`**
```typescript
interface EvidenceCardProps {
  evidence: TimelineEvidence;
  evidenceType: { name: string; color: string };
  isDragging?: boolean;
  isInTimeline?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const EvidenceCard: React.FC<EvidenceCardProps> = ({
  evidence,
  evidenceType,
  isDragging,
  isInTimeline,
  onDragStart,
  onDragEnd
}) => {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`
        bg-white rounded-lg shadow-md p-3 mb-2 cursor-move
        ${isDragging ? 'opacity-50 rotate-2' : ''}
        ${isInTimeline ? 'border-l-4 border-blue-500' : ''}
        touch-manipulation select-none
      `}
    >
      {/* Evidence Type Badge */}
      <div className="flex justify-between items-start mb-2">
        <span className={`px-2 py-1 rounded text-xs font-medium ${evidenceType.color}`}>
          {evidenceType.name}
        </span>
        {(evidence.timeHappenedAnchor || evidence.timeDiscoveredAnchor) && (
          <span className="text-yellow-500 text-sm">⭐</span>
        )}
      </div>
      
      {/* Evidence Image */}
      {evidence.imageUrl && (
        <img 
          src={evidence.imageUrl} 
          alt={evidence.name}
          className="w-full h-20 object-cover rounded mb-2"
        />
      )}
      
      {/* Evidence Name */}
      <h3 className="font-semibold text-sm mb-1 line-clamp-2">
        {evidence.name}
      </h3>
      
      {/* Evidence Description */}
      <p className="text-xs text-gray-600 line-clamp-3">
        {evidence.description}
      </p>
      
      {/* Drag Handle */}
      <div className="mt-2 text-center">
        <div className="inline-block w-6 h-1 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
};
```

### 3.2 Timeline Zone Component

**File: `components/TimelineZone.tsx`**
```typescript
interface TimelineZoneProps {
  evidence: TimelineEvidence[];
  onReorder: (newOrder: string[]) => void;
  validationResult?: ValidationResult;
}

const TimelineZone: React.FC<TimelineZoneProps> = ({
  evidence,
  onReorder,
  validationResult
}) => {
  const [draggedOver, setDraggedOver] = useState<number | null>(null);

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    
    // Reorder logic
    const newOrder = [...evidence.map(e => e.id)];
    const draggedIndex = newOrder.indexOf(draggedId);
    
    if (draggedIndex !== -1) {
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(dropIndex, 0, draggedId);
      onReorder(newOrder);
    }
    
    setDraggedOver(null);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 min-h-96">
      <div className="text-center mb-4">
        <h3 className="font-semibold text-gray-700">Timeline</h3>
        <p className="text-xs text-gray-500">Drag evidence here in chronological order</p>
      </div>
      
      {/* Timeline Markers */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
        
        {evidence.map((item, index) => (
          <div
            key={item.id}
            onDragOver={(e) => {
              e.preventDefault();
              setDraggedOver(index);
            }}
            onDrop={(e) => handleDrop(e, index)}
            className={`
              relative pl-8 pb-4
              ${draggedOver === index ? 'bg-blue-100' : ''}
            `}
          >
            {/* Timeline Dot */}
            <div className="absolute left-2.5 w-3 h-3 bg-blue-500 rounded-full -translate-x-1/2"></div>
            
            {/* Evidence Card */}
            <EvidenceCard
              evidence={item}
              evidenceType={getEvidenceType(item.type)}
              isInTimeline={true}
            />
            
            {/* Validation Feedback */}
            {validationResult?.errors.find(e => e.evidenceId === item.id) && (
              <div className="text-red-500 text-xs mt-1">
                ❌ {validationResult.errors.find(e => e.evidenceId === item.id)?.message}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3.3 Game Controls Component

**File: `components/GameControls.tsx`**
```typescript
interface GameControlsProps {
  onCheckOrder: () => void;
  onReset: () => void;
  onHint: () => void;
  attemptsLeft: number;
  showHints: boolean;
  isComplete: boolean;
}

const GameControls: React.FC<GameControlsProps> = ({
  onCheckOrder,
  onReset,
  onHint,
  attemptsLeft,
  showHints,
  isComplete
}) => {
  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Attempts Counter */}
      <div className="text-center">
        <span className="text-sm text-gray-600">
          Attempts remaining: <span className="font-bold">{attemptsLeft}</span>
        </span>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onCheckOrder}
          disabled={isComplete}
          className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg font-medium
                     disabled:bg-gray-300 disabled:cursor-not-allowed
                     active:bg-blue-600 touch-manipulation"
        >
          Check Order
        </button>
        
        <button
          onClick={onReset}
          className="bg-gray-500 text-white py-3 px-4 rounded-lg font-medium
                     active:bg-gray-600 touch-manipulation"
        >
          Reset
        </button>
        
        {showHints && (
          <button
            onClick={onHint}
            className="bg-yellow-500 text-white py-3 px-4 rounded-lg font-medium
                       active:bg-yellow-600 touch-manipulation"
          >
            Hint
          </button>
        )}
      </div>
    </div>
  );
};
```

## Phase 4: Main Game Component Integration

### 4.1 Update Main Component

**File: `system/component.tsx`**
```typescript
// Add timeline game state
const [gameState, setGameState] = useState<{
  selectedEvidence: TimelineEvidence[];
  playerOrder: string[];
  attemptsLeft: number;
  isComplete: boolean;
  validationResult?: ValidationResult;
}>({
  selectedEvidence: [],
  playerOrder: [],
  attemptsLeft: 3,
  isComplete: false,
});

// Load case data on config change
useEffect(() => {
  if (config?.selectedCase) {
    CaseLoader.loadCase(config.selectedCase).then(caseData => {
      const evidence = CaseLoader.filterEvidenceByDifficulty(
        caseData.evidence, 
        config.difficulty
      );
      
      setGameState(prev => ({
        ...prev,
        selectedEvidence: evidence,
        playerOrder: evidence.map(e => e.id), // Start with correct order shuffled
        attemptsLeft: config.maxAttempts,
      }));
    });
  }
}, [config]);

// Game action handlers
const handleCheckOrder = useCallback(() => {
  if (!gameState.selectedEvidence.length) return;
  
  const result = TimelineValidator.validateOrder(
    gameState.playerOrder,
    gameState.selectedEvidence
  );
  
  setGameState(prev => ({
    ...prev,
    validationResult: result,
    attemptsLeft: result.isCorrect ? prev.attemptsLeft : prev.attemptsLeft - 1,
    isComplete: result.isCorrect || prev.attemptsLeft <= 1,
  }));
  
  // Report result to parent if complete
  if (result.isCorrect || gameState.attemptsLeft <= 1) {
    const action = result.isCorrect 
      ? (gameState.attemptsLeft === config.maxAttempts ? 'timeline-perfect' : 'timeline-success')
      : 'timeline-failed';
      
    resultHandler({
      data: result.score,
      config,
      actions: { [action]: actions[action] }
    });
  }
}, [gameState, config, resultHandler, actions]);
```

## Phase 5: Mobile Optimization

### 5.1 Touch Interactions
- Implement long-press to start drag on mobile
- Add haptic feedback for successful drops
- Optimize touch targets (minimum 44px)
- Add visual drag previews

### 5.2 Responsive Design
- Portrait-first layout design
- Flexible evidence card sizing
- Collapsible sections for small screens
- Optimized typography for mobile reading

### 5.3 Performance
- Lazy load case data
- Optimize image loading with placeholders
- Minimize re-renders during drag operations
- Use CSS transforms for smooth animations

## Testing Strategy

### 5.1 Unit Tests
- Case data loading and validation
- Timeline sorting algorithms
- Evidence filtering by difficulty
- Validation logic accuracy

### 5.2 Integration Tests
- Complete game flow for each case
- Configuration changes
- Result reporting to parent system
- Mobile touch interactions

### 5.3 User Testing
- Timeline puzzle difficulty progression
- Mobile usability on various devices
- Evidence card readability
- Drag and drop responsiveness

This implementation plan provides a comprehensive roadmap for building the detective timeline puzzle game within the existing mini-game framework, ensuring mobile-first design and seamless integration with the parent game system.