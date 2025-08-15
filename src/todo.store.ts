import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withState,
  withHooks
} from '@ngrx/signals';
import { withRequestStatus } from './with-request-status';
import { TodoService } from './todo.service';
import { eventGroup, Events, Dispatcher, withReducer, on, withEffects } from '@ngrx/signals/events';
import { EMPTY, catchError, mergeMap, of, tap, withLatestFrom } from 'rxjs';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}
  

interface TodoState {
  todos: Todo[];
}

const initialAppState: TodoState = {
  todos: [],
};

// 1. Define event groups
import { type } from '@ngrx/signals';

export const todoPageEvents = eventGroup({
  source: 'Todo Page',
  events: {
    get: type<void>(),
    add: type<Omit<Todo, 'id'>>(),
    update: type<Todo>(),
    remove: type<number>(),
  },
});

export const todoApiEvents = eventGroup({
  source: 'Todo API',
  events: {
    loadedSuccess: type<Todo[]>(),
    loadedFailure: type<string>(),
    addedSuccess: type<Todo>(),
    addedFailure: type<string>(),
    updatedSuccess: type<Todo>(),
    updatedFailure: type<string>(),
    removedSuccess: type<number>(),
    removedFailure: type<string>(),
  },
});


export const TodoStore = signalStore(
  { providedIn: 'root', protectedState: true },
  withState<TodoState>(initialAppState),
  withRequestStatus(['getTodos']),
  withReducer(
    on(todoApiEvents.loadedSuccess, ({ payload }) => ({ todos: payload, getTodosStatus: 'fulfilled' as any })),
    on(todoApiEvents.loadedFailure, ({ payload }) => ({ getTodosStatus: { error: payload } })),
    on(todoApiEvents.addedSuccess, ({ payload }, state) => {
      const todos = Array.isArray((state as any).todos) ? (state as TodoState).todos : [];
      return { todos: [...todos, payload] };
    }),
    on(todoApiEvents.updatedSuccess, ({ payload }, state) => {
      const todos = Array.isArray((state as any).todos) ? (state as TodoState).todos : [];
      return { todos: todos.map((x: Todo) => x.id === payload.id ? payload : x) };
    }),
    on(todoApiEvents.removedSuccess, ({ payload }, state) => {
      const todos = Array.isArray((state as any).todos) ? (state as TodoState).todos : [];
      return { todos: todos.filter((x: Todo) => x.id !== payload) };
    }),
  ),
  withEffects((store, events = inject(Events), todoService = inject(TodoService)) => {
    const dispatcher = inject(Dispatcher);
    return {
      loadTodos$: events.on(todoPageEvents.get).pipe(
        tap(() => patchState(store, { getTodosStatus: 'pending' as any })),
        mergeMap(() => todoService.getTodos().pipe(
          tap({
            next: (todos) => dispatcher.dispatch(todoApiEvents.loadedSuccess(todos)),
            error: (err) => dispatcher.dispatch(todoApiEvents.loadedFailure(err.message || 'Failed to load todos')),
          }),
          catchError(() => EMPTY)
        ))
      ),
      addTodo$: events.on(todoPageEvents.add).pipe(
        mergeMap(({ payload }) => todoService.postTodo(payload).pipe(
          tap({
            next: (todo) => dispatcher.dispatch(todoApiEvents.addedSuccess(todo)),
            error: (err) => dispatcher.dispatch(todoApiEvents.addedFailure(err.message || 'Failed to add todo')),
          }),
          catchError(() => EMPTY)
        ))
      ),
      updateTodo$: events.on(todoPageEvents.update).pipe(
        mergeMap(({ payload }) => todoService.putTodo(payload).pipe(
          tap({
            next: (todo) => dispatcher.dispatch(todoApiEvents.updatedSuccess(todo)),
            error: (err) => dispatcher.dispatch(todoApiEvents.updatedFailure(err.message || 'Failed to update todo')),
          }),
          catchError(() => EMPTY)
        ))
      ),
      removeTodo$: events.on(todoPageEvents.remove).pipe(
        mergeMap(({ payload }) => todoService.deleteTodo(payload).pipe(
          withLatestFrom(of(payload)),
          tap({
            next: ([_, id]) => dispatcher.dispatch(todoApiEvents.removedSuccess(id)),
            error: (err) => dispatcher.dispatch(todoApiEvents.removedFailure(err.message || 'Failed to remove todo')),
          }),
          catchError(() => EMPTY)
        ))
      ),
    };
  }),
  withHooks({
    onInit: () => {
      const dispatcher = inject(Dispatcher);
      dispatcher.dispatch(todoPageEvents.get());
    },
  })
);
