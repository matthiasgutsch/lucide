import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { DcIconComponent } from './icons/dc-icon.component';
export type ButtonSize = 'sm' | 'md' | 'lg';

const SIZE_CONFIG: Record<ButtonSize, { size: number; strokeWidth: number }> = {
  sm: { size: 16, strokeWidth: 2.35 },
  md: { size: 20, strokeWidth: 2 },
  lg: { size: 24, strokeWidth: 2 },
};

const SIZE_CONFIG_DEFAULT: Record<ButtonSize, { size: number; strokeWidth: number }> = {
  sm: { size: 16, strokeWidth: 1.65 },
  md: { size: 20, strokeWidth: 1.65 },
  lg: { size: 24, strokeWidth: 1.65 },
};

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, LucideAngularModule, DcIconComponent],
  templateUrl: './app.html',
  styleUrl: './app.less',
})
export class App {
  protected readonly title = signal('lucide');
  protected selectedSize = signal<ButtonSize>('md');
  protected readonly sizes: ButtonSize[] = ['sm', 'md', 'lg'];

  protected strokeWidth = computed(() => SIZE_CONFIG[this.selectedSize()].strokeWidth);
  protected size = computed(() => SIZE_CONFIG[this.selectedSize()].size);

  protected iconConfig(s: ButtonSize) {
    return SIZE_CONFIG[s];
  }

  protected iconConfigDefault(s: ButtonSize) {
    return SIZE_CONFIG_DEFAULT[s];
  }
}
