import { useCallback, useEffect, useState } from 'react';
import { ActionMap, ChildModuleCommunicator, initModule, ResultPayload, ModuleResultType, AspectPermissions, AspectPermissionType } from 'wolfy-module-kit';

// region Frozen
import moduleConfig, { type ModuleConfig } from './configuration';
import { ModuleOperation, ModuleOperationType } from './operation';
import { originConfig } from './origins';
import { interpretResult } from './result-interpretation';
// endregion Frozen

// Timeline game imports
import { CaseLoader, TimelineEvidence, EvidenceType, CaseData } from './case-loader';
import { TimelineValidator, ValidationResult } from './timeline-validation';
import EvidencePool from '@/components/EvidencePool';
import TimelineZone from '@/components/TimelineZone';
import GameControls from '@/components/GameControls';

interface GameState {
  caseData: CaseData | null;
  selectedEvidence: TimelineEvidence[];
  poolEvidence: TimelineEvidence[];
  timelineEvidence: TimelineEvidence[];
  attemptsLeft: number;
  isComplete: boolean;
  validationResult: ValidationResult | null;
  hintCount: number;
  currentHint: string | null;
  isLoading: boolean;
}

const Component = ({ }) => {

  // region Frozen
  const [moduleCommunicator, setModuleCommunicator] = useState<ChildModuleCommunicator | null>(null);
  const [resultHandler, setResultHandler] = useState<((payload: ResultPayload<ModuleConfig>) => void) | null>(null);
  const [config, setConfig] = useState<ModuleConfig | null>(null);
  const [moduleUid, setModuleUid] = useState<string | null>(null)

  const [actions, setActions] = useState<ActionMap>({})
  const [aspectsPermissions, setAspectsPermissions] = useState<AspectPermissions>({});
  const [lastOperation, setLastOperation] = useState<ModuleOperation | null>(null);
  // endregion Frozen

  // state affected by operations
  const [title, setTitle] = useState<string>("Detective Timeline Puzzle");

  // aspects record
  const [aspects, setAspects] = useState<Record<string, any>>({});

  // Timeline game state
  const [gameState, setGameState] = useState<GameState>({
    caseData: null,
    selectedEvidence: [],
    poolEvidence: [],
    timelineEvidence: [],
    attemptsLeft: 3,
    isComplete: false,
    validationResult: null,
    hintCount: 0,
    currentHint: null,
    isLoading: false,
  });

  // Load case data when config changes
  useEffect(() => {
    if (config?.selectedCase) {
      setGameState(prev => ({ ...prev, isLoading: true }));
      
      CaseLoader.loadCase(config.selectedCase)
        .then(caseData => {
          const selectedEvidence = CaseLoader.filterEvidenceByDifficulty(
            caseData.evidence,
            config.difficulty
          );
          
          // Shuffle evidence for the pool
          const shuffledEvidence = CaseLoader.shuffleArray(selectedEvidence);
          
          setGameState(prev => ({
            ...prev,
            caseData,
            selectedEvidence,
            poolEvidence: shuffledEvidence,
            timelineEvidence: [],
            attemptsLeft: config.maxAttempts,
            isComplete: false,
            validationResult: null,
            hintCount: 0,
            currentHint: null,
            isLoading: false,
          }));
        })
        .catch(error => {
          console.error('Failed to load case:', error);
          setGameState(prev => ({ ...prev, isLoading: false }));
        });
    }
  }, [config]);

  useEffect(() => {
    if (!lastOperation) {
      return;
    }

    // Custom operations logic
    if (lastOperation.type === ModuleOperationType.SET_TITLE) {
      setTitle(lastOperation.value);
    } else {
      console.warn('Unknown operation type:', lastOperation.type);
    }
  }, [lastOperation]);

  // region Frozen
  useEffect(() => {
    let communicator: ChildModuleCommunicator | null = null;
    try {
      let currentAspectPermissions: AspectPermissions = {};

      const initCallback = (uid: string, actions: ActionMap, aspects: AspectPermissions) => {
        setModuleUid(uid)
        setActions(actions)
        setAspectsPermissions(aspects)
        // Avoids this effect needing to be re-run on every aspect update
        // This is a one-time setup for the module's aspect permissions.
        currentAspectPermissions = aspects;
      };

      const handleAspectUpdate = (key: string, value: any) => {
        if (currentAspectPermissions && key in currentAspectPermissions) {
          console.log(`✅ Aspect updated: ${key} =`, value);
          setAspects(prev => ({ ...prev, [key]: value }));
        } else {
          console.warn(`🚨 Ignored aspect update for "${key}". Not in permitted aspects for this module.`);
        }
      };
    
      const handleOperation = (operation: ModuleOperation) => {
        setLastOperation(operation);
      };

      const {
        communicator: effectCommunicator,
        resultHandler,
        config
      } = initModule({
        window,
        initCallback,
        configSchema: moduleConfig,
        interpretResult,
        originConfig,
      });

      communicator = effectCommunicator;

      communicator.onOperation(handleOperation);
      communicator.onAspectUpdate(handleAspectUpdate);

      communicator.sendReady();

      setModuleCommunicator(communicator);
      setResultHandler(() => resultHandler);
      setConfig(config);
    }
    catch (error) {
      console.error('Error initializing module:', error);
    }

    return () => {
      communicator?.cleanup()
    }
  }, []);
  // endregion Frozen

  const requestAspectChange = useCallback((aspectToChange: string, valueToSet: any) => {
    if (!moduleCommunicator || !aspectsPermissions) return;

    if (aspectsPermissions[aspectToChange] === AspectPermissionType.ReadWrite) {
      moduleCommunicator.requestAspectValueChange(aspectToChange, valueToSet);
    } else {
      console.log(`Module does not have write permission for aspect: ${aspectToChange}`);
    }
  }, [moduleCommunicator, aspectsPermissions]);

  // Game action handlers
  const handleMoveToTimeline = useCallback((evidenceId: string) => {
    setGameState(prev => {
      const evidence = prev.poolEvidence.find(e => e.id === evidenceId);
      if (!evidence) return prev;

      return {
        ...prev,
        poolEvidence: prev.poolEvidence.filter(e => e.id !== evidenceId),
        timelineEvidence: [...prev.timelineEvidence, evidence],
        validationResult: null, // Clear previous validation
      };
    });
  }, []);

  const handleTimelineReorder = useCallback((newOrder: string[]) => {
    setGameState(prev => {
      const reorderedEvidence = newOrder.map(id =>
        prev.timelineEvidence.find(e => e.id === id)!
      ).filter(Boolean);

      return {
        ...prev,
        timelineEvidence: reorderedEvidence,
        validationResult: null, // Clear previous validation
      };
    });
  }, []);

  const handleCheckOrder = useCallback(() => {
    if (!gameState.timelineEvidence.length || gameState.isComplete) return;

    setGameState(prev => ({ ...prev, isLoading: true }));

    // Simulate brief loading for better UX
    setTimeout(() => {
      const result = TimelineValidator.validateOrder(
        gameState.timelineEvidence.map(e => e.id),
        gameState.timelineEvidence
      );

      const newAttemptsLeft = result.isCorrect ? gameState.attemptsLeft : gameState.attemptsLeft - 1;
      const isComplete = result.isCorrect || newAttemptsLeft <= 0;

      setGameState(prev => ({
        ...prev,
        validationResult: result,
        attemptsLeft: newAttemptsLeft,
        isComplete,
        isLoading: false,
      }));

      // Report result to parent if game is complete
      if (isComplete && resultHandler && config && actions) {
        let actionKey = 'Done';
        
        if (result.isCorrect) {
          actionKey = result.score === 100 ? 'TimelinePerfect' : 'TimelineSuccess';
        } else {
          actionKey = 'TimelineFailed';
        }

        resultHandler({
          data: result.score,
          config,
          actions: { [actionKey]: actions[actionKey] || actions.Done }
        });
      }
    }, 500);
  }, [gameState, resultHandler, config, actions]);

  const handleReset = useCallback(() => {
    if (!config) return;

    const shuffledEvidence = CaseLoader.shuffleArray(gameState.selectedEvidence);
    
    setGameState(prev => ({
      ...prev,
      poolEvidence: shuffledEvidence,
      timelineEvidence: [],
      validationResult: null,
      currentHint: null,
    }));
  }, [config, gameState.selectedEvidence]);

  const handleShuffle = useCallback(() => {
    const shuffledPool = CaseLoader.shuffleArray(gameState.poolEvidence);
    const shuffledTimeline = CaseLoader.shuffleArray(gameState.timelineEvidence);
    
    setGameState(prev => ({
      ...prev,
      poolEvidence: shuffledPool,
      timelineEvidence: shuffledTimeline,
      validationResult: null,
    }));
  }, [gameState.poolEvidence, gameState.timelineEvidence]);

  const handleHint = useCallback(() => {
    if (gameState.hintCount >= 3 || !gameState.timelineEvidence.length) return;

    const hint = TimelineValidator.generateHint(
      gameState.timelineEvidence.map(e => e.id),
      gameState.timelineEvidence,
      gameState.hintCount + 1
    );

    setGameState(prev => ({
      ...prev,
      hintCount: prev.hintCount + 1,
      currentHint: hint,
    }));
  }, [gameState]);

  const reportExecutionResult = useCallback(() => {
    if (!resultHandler || !config || !moduleCommunicator || !actions) {
      const missingComponents = [];
      if (!resultHandler) missingComponents.push('Result handler');
      if (!config) missingComponents.push('Config');
      if (!moduleCommunicator) missingComponents.push('Communicator');
      if (!actions) missingComponents.push('Actions');
      console.error(`The following components are not initialized: ${missingComponents.join(', ')}`);
      return;
    }

    if (config.expectedResultType === ModuleResultType.Attempt) {
      resultHandler({
        data: gameState.validationResult?.score || 0,
        config,
        actions
      });
    }

    if (config.expectedResultType === ModuleResultType.Choice) {
      resultHandler({
        data: 0,
        config,
        actions
      });
    }
  }, [actions, config, resultHandler, moduleCommunicator, gameState.validationResult]);

  if (!config) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading detective case...</p>
        </div>
      </div>
    );
  }

  if (gameState.isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {gameState.caseData?.gameSettings.caseTitle || 'case'}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Game Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            🕵️ {gameState.caseData?.gameSettings.caseTitle || 'Detective Timeline Puzzle'}
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            {gameState.caseData?.gameSettings.objective}
          </p>
          <div className="text-xs text-gray-500">
            Difficulty: <span className="font-medium capitalize">{config.difficulty}</span>
          </div>
        </div>

        {/* Current Hint Display */}
        {gameState.currentHint && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">{gameState.currentHint}</p>
          </div>
        )}

        {/* Game Controls */}
        <GameControls
          onCheckOrder={handleCheckOrder}
          onReset={handleReset}
          onHint={handleHint}
          onShuffle={handleShuffle}
          attemptsLeft={gameState.attemptsLeft}
          maxAttempts={config.maxAttempts}
          showHints={config.showHints}
          isComplete={gameState.isComplete}
          isLoading={gameState.isLoading}
          hintCount={gameState.hintCount}
          className="mb-6"
        />

        {/* Evidence Pool */}
        {gameState.poolEvidence.length > 0 && (
          <EvidencePool
            evidence={gameState.poolEvidence}
            evidenceTypes={gameState.caseData?.evidenceTypes || []}
            onMoveToTimeline={handleMoveToTimeline}
            className="mb-6"
          />
        )}

        {/* Timeline Zone */}
        <TimelineZone
          evidence={gameState.timelineEvidence}
          evidenceTypes={gameState.caseData?.evidenceTypes || []}
          onReorder={handleTimelineReorder}
          validationResult={gameState.validationResult || undefined}
          className="mb-6"
        />

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
            <details>
              <summary className="font-bold cursor-pointer">Debug Info</summary>
              <div className="mt-2 space-y-2">
                <div>Module ID: {moduleUid}</div>
                <div>Config: {JSON.stringify(config, null, 2)}</div>
                <div>Game State: {JSON.stringify({
                  attemptsLeft: gameState.attemptsLeft,
                  isComplete: gameState.isComplete,
                  hintCount: gameState.hintCount,
                  poolCount: gameState.poolEvidence.length,
                  timelineCount: gameState.timelineEvidence.length,
                }, null, 2)}</div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default Component;