import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Todo } from './todo.store';

@Injectable({
  providedIn: "root"
})
export class TodoService {
  id = 2;

  getTodos(): Observable<Todo[]> {
    return of([
      {
        id: 1,
        title: 'Todo 1',
        completed: false
      },
      {
        id: 2,
        title: 'Todo 2',
        completed: false
      }
    ]);
  }

  postTodo(todo: Omit<Todo, "id">): Observable<Todo> {
    return of({ ...todo, id: this.id++, title: todo.title + this.id });
  }

  putTodo(todo: Todo): Observable<Todo> {
    return of(todo);
  }

  deleteTodo(id: number): Observable<number> {
    return of(id);
  }
}
