import React, { useState } from 'react';
import { TimelineEvidence, EvidenceType, CaseLoader } from '@/system/case-loader';
import EvidenceCard from './EvidenceCard';

interface EvidencePoolProps {
  evidence: TimelineEvidence[];
  evidenceTypes: EvidenceType[];
  onMoveToTimeline: (evidenceId: string) => void;
  className?: string;
}

const EvidencePool: React.FC<EvidencePoolProps> = ({
  evidence,
  evidenceTypes,
  onMoveToTimeline,
  className = ''
}) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleDragStart = (evidenceId: string) => {
    setDraggedItem(evidenceId);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleCardClick = (evidenceId: string) => {
    // On mobile, allow tap to move to timeline
    onMoveToTimeline(evidenceId);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      {/* Pool Header */}
      <div className="text-center mb-4">
        <h3 className="font-semibold text-gray-700 text-lg">Evidence Pool</h3>
        <p className="text-xs text-gray-500 mt-1">
          Drag evidence to the timeline or tap to add
        </p>
        <div className="text-sm text-gray-600 mt-1">
          {evidence.length} pieces remaining
        </div>
      </div>

      {/* Evidence Grid */}
      {evidence.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-sm">All evidence has been placed in the timeline!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
          {evidence.map((item) => {
            const evidenceType = CaseLoader.getEvidenceType(item, evidenceTypes);
            const isDragging = draggedItem === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item.id)}
                className="cursor-pointer"
              >
                <EvidenceCard
                  evidence={item}
                  evidenceType={evidenceType}
                  isDragging={isDragging}
                  isInTimeline={false}
                  onDragStart={() => handleDragStart(item.id)}
                  onDragEnd={handleDragEnd}
                  className="hover:scale-105 transition-transform duration-200"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-xs text-blue-800">
          <div className="font-medium mb-1">💡 How to play:</div>
          <ul className="space-y-1 text-xs">
            <li>• Drag evidence cards to the timeline</li>
            <li>• Arrange them in chronological order</li>
            <li>• Look for ⭐ anchor events - they're key!</li>
            <li>• Check timestamps and descriptions carefully</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EvidencePool;