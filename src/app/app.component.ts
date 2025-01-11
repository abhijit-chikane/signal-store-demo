import { Component, effect, inject, untracked } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TodoStore } from '../todo.store';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  todoStore = inject(TodoStore);

  constructor(){
    effect(() => {
      if(this.todoStore.isGetTodosFulfilled()){
        // if api succeed do your stuff
        // there should be a easy way to reset the state back to init
        untracked(()=> this.todoStore.resetRequestStatus('getTodos'));
      }
    })
  }
}
