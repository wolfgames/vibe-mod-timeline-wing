import React from 'react';

interface GameControlsProps {
  onCheckOrder: () => void;
  onReset: () => void;
  onHint: () => void;
  onShuffle: () => void;
  attemptsLeft: number;
  maxAttempts: number;
  showHints: boolean;
  isComplete: boolean;
  isLoading?: boolean;
  hintCount: number;
  maxHints?: number;
  className?: string;
}

const GameControls: React.FC<GameControlsProps> = ({
  onCheckOrder,
  onReset,
  onHint,
  onShuffle,
  attemptsLeft,
  maxAttempts,
  showHints,
  isComplete,
  isLoading = false,
  hintCount,
  maxHints = 3,
  className = ''
}) => {
  const canUseHint = showHints && hintCount < maxHints && !isComplete;
  const canCheck = !isComplete && !isLoading;

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      {/* Status Display */}
      <div className="text-center mb-4">
        <div className="flex justify-center items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Attempts:</span>
            <span className={`font-bold ${attemptsLeft <= 1 ? 'text-red-600' : 'text-blue-600'}`}>
              {attemptsLeft}/{maxAttempts}
            </span>
          </div>
          {showHints && (
            <div className="flex items-center gap-1">
              <span className="text-gray-600">Hints:</span>
              <span className={`font-bold ${hintCount >= maxHints ? 'text-red-600' : 'text-yellow-600'}`}>
                {hintCount}/{maxHints}
              </span>
            </div>
          )}
        </div>
        
        {isComplete && (
          <div className="mt-2 text-green-600 font-medium">
            🎉 Timeline Complete!
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {/* Check Order Button */}
        <button
          onClick={onCheckOrder}
          disabled={!canCheck}
          className={`
            col-span-2 py-3 px-4 rounded-lg font-medium text-white
            transition-all duration-200 touch-manipulation
            ${canCheck 
              ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 shadow-md hover:shadow-lg' 
              : 'bg-gray-300 cursor-not-allowed'
            }
            ${isLoading ? 'animate-pulse' : ''}
          `}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Checking...
            </div>
          ) : (
            '🔍 Check Timeline Order'
          )}
        </button>
        
        {/* Shuffle Button */}
        <button
          onClick={onShuffle}
          disabled={isComplete}
          className="
            py-2 px-3 rounded-lg font-medium text-gray-700 bg-gray-100
            hover:bg-gray-200 active:bg-gray-300 transition-all duration-200
            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
            touch-manipulation text-sm
          "
        >
          🔀 Shuffle
        </button>
        
        {/* Reset Button */}
        <button
          onClick={onReset}
          className="
            py-2 px-3 rounded-lg font-medium text-gray-700 bg-gray-100
            hover:bg-gray-200 active:bg-gray-300 transition-all duration-200
            touch-manipulation text-sm
          "
        >
          🔄 Reset
        </button>
        
        {/* Hint Button */}
        {showHints && (
          <button
            onClick={onHint}
            disabled={!canUseHint}
            className={`
              col-span-2 py-2 px-4 rounded-lg font-medium transition-all duration-200
              touch-manipulation text-sm
              ${canUseHint
                ? 'bg-yellow-500 text-white hover:bg-yellow-600 active:bg-yellow-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {hintCount >= maxHints ? '💡 No More Hints' : '💡 Get Hint'}
          </button>
        )}
      </div>

      {/* Progress Indicator */}
      {!isComplete && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{Math.round(((maxAttempts - attemptsLeft) / maxAttempts) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((maxAttempts - attemptsLeft) / maxAttempts) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Warning for Last Attempt */}
      {attemptsLeft === 1 && !isComplete && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-xs font-medium text-center">
            ⚠️ Last attempt! Double-check your timeline before submitting.
          </p>
        </div>
      )}
    </div>
  );
};

export default GameControls;