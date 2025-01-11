import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, catchError, mergeMap, of, pipe, tap, withLatestFrom } from 'rxjs';
import { TodoService } from './todo.service';
import { withRequestStatus } from './with-request-status';

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

export const TodoStore = signalStore(
{ providedIn : 'root', protectedState: true },
  withState(initialAppState),
  withRequestStatus(['getTodos']),
  withComputed(() => ({
  })),
  withMethods((
    store, 
    todoService = inject(TodoService)
    ) => {
    const setTodos = (todos: Todo[]) =>  {
        patchState(store, { todos });
      }

      const getTodos = rxMethod<void>(
        pipe(
          tap(() => patchState(store, { getTodosStatus: 'pending' })),
          mergeMap(() => todoService.getTodos()),
          tap((todos: Todo[]) => {
            patchState(store, { todos, getTodosStatus: 'fulfilled' })
          }),
          catchError((err) => {
            patchState(store, { getTodosStatus: { error: err } });
            return EMPTY;
          })
        )
      )
  
      const postTodo = rxMethod<Omit<Todo, "id">>(
        pipe(
          mergeMap((todo: Omit<Todo, "id">) => todoService.postTodo(todo)),
          tap((todo) => patchState(store, { todos: [...store.todos(), todo] })),
          catchError(() => {
            return EMPTY;
          })
        )
      )
  
      const putTodo = rxMethod<Todo>(
        pipe(
          mergeMap((todo: Todo) => todoService.putTodo(todo)),
          tap((todo) => {
            const todos = store.todos().map((x) => (x.id === todo.id ? todo : x));
            patchState(store, { todos });
          }),
          catchError(() => {
            return EMPTY;
          })
        )
      )
  
      const deleteTodo = rxMethod<number>(
        pipe(
          mergeMap((id: number) => todoService.deleteTodo(id).pipe(withLatestFrom(of(id)))),
          tap(([_, id]) => { // eslint-disable-line
            const todos = store.todos().filter((x) => x.id !== id);
            patchState(store, { todos });
          }),
          catchError(() => {
            return EMPTY;
          })
        )
      )
      return {
          getTodos,
          postTodo,
          putTodo,
          deleteTodo,
      }
  }),
  withHooks({
    onInit: (store) => {
        store.getTodos()
    },
  })
);
