import React from 'react';
import { TimelineEvidence, EvidenceType, CaseLoader } from '@/system/case-loader';

interface EvidenceCardProps {
  evidence: TimelineEvidence;
  evidenceType: EvidenceType;
  isDragging?: boolean;
  isInTimeline?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  className?: string;
}

const EvidenceCard: React.FC<EvidenceCardProps> = ({
  evidence,
  evidenceType,
  isDragging = false,
  isInTimeline = false,
  hasError = false,
  errorMessage,
  onDragStart,
  onDragEnd,
  className = ''
}) => {
  const timeDisplay = CaseLoader.formatTimeForDisplay(
    evidence.timeHappened || evidence.timeDiscovered
  );

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', evidence.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(e);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={`
        bg-white rounded-lg shadow-md p-3 mb-2 cursor-move transition-all duration-200
        ${isDragging ? 'opacity-50 rotate-2 scale-105' : 'hover:shadow-lg'}
        ${isInTimeline ? 'border-l-4 border-blue-500' : ''}
        ${hasError ? 'border-2 border-red-400 bg-red-50' : ''}
        touch-manipulation select-none min-h-[120px]
        ${className}
      `}
    >
      {/* Header with Type Badge and Anchor Star */}
      <div className="flex justify-between items-start mb-2">
        <span className={`px-2 py-1 rounded text-xs font-medium ${evidenceType.color}`}>
          {evidenceType.name}
        </span>
        <div className="flex items-center gap-1">
          {timeDisplay && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {timeDisplay}
            </span>
          )}
          {(evidence.timeHappenedAnchor || evidence.timeDiscoveredAnchor) && (
            <span className="text-yellow-500 text-sm" title="Key Event">⭐</span>
          )}
        </div>
      </div>
      
      {/* Evidence Image */}
      {evidence.imageUrl && (
        <div className="mb-2">
          <img 
            src={evidence.imageUrl} 
            alt={evidence.name}
            className="w-full h-16 object-cover rounded"
            onError={(e) => {
              // Hide image if it fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      
      {/* Evidence Name */}
      <h3 className="font-semibold text-sm mb-1 text-gray-800 overflow-hidden" style={{
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical'
      }}>
        {evidence.name}
      </h3>
      
      {/* Evidence Description */}
      <p className="text-xs text-gray-600 mb-2 overflow-hidden" style={{
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical'
      }}>
        {evidence.description}
      </p>

      {/* Location */}
      {evidence.location && (
        <p className="text-xs text-gray-500 italic">
          📍 {evidence.location}
        </p>
      )}

      {/* Error Message */}
      {hasError && errorMessage && (
        <div className="mt-2 text-red-600 text-xs font-medium bg-red-100 p-2 rounded">
          ❌ {errorMessage}
        </div>
      )}
      
      {/* Drag Handle */}
      <div className="mt-2 text-center">
        <div className="inline-block w-6 h-1 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
};

export default EvidenceCard;