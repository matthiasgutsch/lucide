import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { DcIconComponent } from './icons/dc-icon.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LucideAngularModule, DcIconComponent],
  templateUrl: './app.html',
  styleUrl: './app.less',
})
export class App {
  protected readonly title = signal('lucide');
  protected strokeWidth = signal(2);
  protected size = signal(28);
}
