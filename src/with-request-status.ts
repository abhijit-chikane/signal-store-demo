import { Signal, computed } from '@angular/core';
import { patchState, signalStoreFeature, withComputed, withMethods, withState } from '@ngrx/signals';

/**
 * Represents the status of a request.
 * Can be 'init', 'pending', 'fulfilled', or an object with an error string.
 */
export type RequestStatus =
  | 'init'
  | 'pending'
  | 'fulfilled'
  | {
      error: string;
    };

// Type definitions for generating keys based on request name
type StatusKey<Name extends string> = `${Name}Status`; 
type PendingKey<Name extends string> = `is${Capitalize<Name>}Pending`;
type FulfilledKey<Name extends string> = `is${Capitalize<Name>}Fulfilled`;
type ErrorKey<Name extends string> = `${Name}Error`;

/**
 * Represents the state of a request, containing the status.
 */
type RequestStatusState<Name extends string> = {
  [Key in StatusKey<Name>]: RequestStatus;
};

/**
 * Represents signals related to a request's status: pending, fulfilled, and error.
 */
type RequestStatusSignals<Name extends string> = {
  [Key in PendingKey<Name>]: Signal<boolean>;
} & { [Key in FulfilledKey<Name>]: Signal<boolean> } & {
  [Key in ErrorKey<Name>]: Signal<string | null>;
};

/**
 * A function that enhances a store with request status management capabilities.
 * It creates signals for pending, fulfilled, and error states for each request name provided.
 * @param requestNames An array of request names to manage.
 * @returns A signalStoreFeature function to be used with NgRx Signals.
 */
export function withRequestStatus<Name extends string>(
  requestNames: Name[], // Supporting previous implementation of single key
) {
  return signalStoreFeature(
    // Initialize the state with 'init' status for each request
    withState(
      requestNames.reduce(
        (acc, cur) => ({ ...acc, [`${cur}Status`]: 'init' }),
        {} as RequestStatusState<Name>,
      ),
    ),
    // Create computed signals for pending, fulfilled, and error states
    withComputed(
      (store: any) => // eslint-disable-line 
        requestNames.reduce((acc: RequestStatusSignals<Name>, cur: Name) => {
          // Generate keys for accessing the status and signals
          const statusKey: StatusKey<Name> = `${cur}Status`;
          const pendingKey: PendingKey<Name> = `is${capitalize(cur)}Pending`;
          const fulfilledKey: FulfilledKey<Name> = `is${capitalize( cur, )}Fulfilled`;
          const errorKey: ErrorKey<Name> = `${cur}Error`;
          
          // Create computed signals based on the request status
          return {
            ...acc,
            [pendingKey]: computed(() => store[statusKey]() === 'pending'),
            [fulfilledKey]: computed(() => store[statusKey]() === 'fulfilled'),
            [errorKey]: computed(() =>
              typeof store[statusKey]() === 'object'
                ? (store[statusKey]() as { error: string }).error
                : null,
            ),
          };
        }, {} as RequestStatusSignals<Name>), 
    ),
    withMethods((store) => ({
      resetStatus(request: Name) {
        patchState(store, { [`${request}Status`]: 'init' } as RequestStatusState<Name>);
      },
    })),
  );
}

/**
 * Capitalizes the first letter of a string.
 * @param text The string to capitalize.
 * @returns The capitalized string.
 */
function capitalize<T extends string>(text: T): Capitalize<T> {
  return (text.charAt(0).toUpperCase() + text.substring(1)) as Capitalize<T>;
}