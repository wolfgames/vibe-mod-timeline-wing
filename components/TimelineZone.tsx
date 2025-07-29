import React, { useState } from 'react';
import { TimelineEvidence, EvidenceType, CaseLoader } from '@/system/case-loader';
import { ValidationResult } from '@/system/timeline-validation';
import EvidenceCard from './EvidenceCard';

interface TimelineZoneProps {
  evidence: TimelineEvidence[];
  evidenceTypes: EvidenceType[];
  onReorder: (newOrder: string[]) => void;
  validationResult?: ValidationResult;
  className?: string;
}

const TimelineZone: React.FC<TimelineZoneProps> = ({
  evidence,
  evidenceTypes,
  onReorder,
  validationResult,
  className = ''
}) => {
  const [draggedOver, setDraggedOver] = useState<number | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOver(index);
  };

  const handleDragLeave = () => {
    setDraggedOver(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    
    if (!draggedId) return;

    // Reorder logic
    const currentOrder = evidence.map(e => e.id);
    const draggedIndex = currentOrder.indexOf(draggedId);
    
    if (draggedIndex !== -1 && draggedIndex !== dropIndex) {
      const newOrder = [...currentOrder];
      // Remove dragged item
      newOrder.splice(draggedIndex, 1);
      // Insert at new position
      newOrder.splice(dropIndex, 0, draggedId);
      onReorder(newOrder);
    }
    
    setDraggedOver(null);
    setDraggedItem(null);
  };

  const handleDragStart = (evidenceId: string) => {
    setDraggedItem(evidenceId);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOver(null);
  };

  const getEvidenceError = (evidenceId: string) => {
    return validationResult?.errors.find(e => e.evidenceId === evidenceId);
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-4 min-h-96 ${className}`}>
      {/* Timeline Header */}
      <div className="text-center mb-4">
        <h3 className="font-semibold text-gray-700 text-lg">Timeline</h3>
        <p className="text-xs text-gray-500 mt-1">
          Drag evidence here in chronological order (earliest to latest)
        </p>
        {validationResult && (
          <div className="mt-2">
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              validationResult.isCorrect 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              Score: {validationResult.score}/100
            </div>
          </div>
        )}
      </div>
      
      {/* Timeline Content */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300 z-0"></div>
        
        {/* Timeline Items */}
        {evidence.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <p>Drop evidence cards here to build the timeline</p>
          </div>
        ) : (
          evidence.map((item, index) => {
            const evidenceType = CaseLoader.getEvidenceType(item, evidenceTypes);
            const error = getEvidenceError(item.id);
            const isDragging = draggedItem === item.id;
            const isDropTarget = draggedOver === index;

            return (
              <div
                key={item.id}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`
                  relative pl-8 pb-4 transition-all duration-200
                  ${isDropTarget ? 'bg-blue-100 rounded-lg p-2' : ''}
                `}
              >
                {/* Timeline Dot */}
                <div className={`
                  absolute left-2.5 w-3 h-3 rounded-full -translate-x-1/2 z-10
                  ${error ? 'bg-red-500' : validationResult?.isCorrect ? 'bg-green-500' : 'bg-blue-500'}
                `}></div>
                
                {/* Position Number */}
                <div className="absolute left-0 top-0 w-6 h-6 bg-gray-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                
                {/* Evidence Card */}
                <EvidenceCard
                  evidence={item}
                  evidenceType={evidenceType}
                  isDragging={isDragging}
                  isInTimeline={true}
                  hasError={!!error}
                  errorMessage={error?.message}
                  onDragStart={() => handleDragStart(item.id)}
                  onDragEnd={handleDragEnd}
                />
                
                {/* Drop Zone Indicator */}
                {isDropTarget && (
                  <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50 bg-opacity-50 flex items-center justify-center">
                    <span className="text-blue-600 font-medium">Drop here</span>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Bottom Drop Zone */}
        {evidence.length > 0 && (
          <div
            onDragOver={(e) => handleDragOver(e, evidence.length)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, evidence.length)}
            className={`
              h-16 border-2 border-dashed border-gray-300 rounded-lg
              flex items-center justify-center text-gray-500 text-sm
              transition-all duration-200
              ${draggedOver === evidence.length ? 'border-blue-400 bg-blue-50 text-blue-600' : ''}
            `}
          >
            {draggedOver === evidence.length ? 'Drop here to add to end' : 'Drop zone'}
          </div>
        )}
      </div>

      {/* Validation Feedback */}
      {validationResult && !validationResult.isCorrect && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium">
            {validationResult.feedback}
          </p>
        </div>
      )}

      {/* Success Feedback */}
      {validationResult?.isCorrect && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">
            {validationResult.feedback}
          </p>
        </div>
      )}
    </div>
  );
};

export default TimelineZone;