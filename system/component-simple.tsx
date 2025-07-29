import { useCallback, useEffect, useState } from 'react';
import { ActionMap, ChildModuleCommunicator, initModule, ResultPayload, ModuleResultType, AspectPermissions, AspectPermissionType } from 'wolfy-module-kit';

// region Frozen
import moduleConfig, { type ModuleConfig } from './configuration';
import { ModuleOperation, ModuleOperationType } from './operation';
import { originConfig } from './origins';
import { interpretResult } from './result-interpretation';
// endregion Frozen

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
        data: 1,
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
  }, [actions, config, resultHandler, moduleCommunicator]);

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

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Game Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            🕵️ Detective Timeline Puzzle
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            Timeline puzzle game is loading...
          </p>
          <div className="text-xs text-gray-500">
            Selected Case: <span className="font-medium">{config.selectedCase}</span>
          </div>
          <div className="text-xs text-gray-500">
            Difficulty: <span className="font-medium capitalize">{config.difficulty}</span>
          </div>
        </div>

        {/* Simple Test Interface */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h3 className="font-semibold text-gray-700 text-lg mb-4">Game Configuration</h3>
          <div className="space-y-2 text-sm">
            <div>Case: {config.selectedCase}</div>
            <div>Difficulty: {config.difficulty}</div>
            <div>Max Attempts: {config.maxAttempts}</div>
            <div>Show Hints: {config.showHints ? 'Yes' : 'No'}</div>
          </div>
          
          <button
            onClick={reportExecutionResult}
            className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
          >
            Complete Game (Test)
          </button>
        </div>

        {/* Debug Info */}
        <div className="bg-gray-100 rounded-lg p-4 text-xs">
          <details>
            <summary className="font-bold cursor-pointer">Debug Info</summary>
            <div className="mt-2 space-y-2">
              <div>Module ID: {moduleUid}</div>
              <div>Actions: {JSON.stringify(Object.keys(actions), null, 2)}</div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default Component;