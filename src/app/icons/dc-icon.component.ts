import { Component, Input } from '@angular/core';
import { LucideAngularModule, LucideIconData } from 'lucide-angular';
import * as customIcons from './custom-icons';

const iconRegistry: Record<string, LucideIconData> = {
  'diamond-filled': customIcons.DcDiamond,
  'bolt-circle': customIcons.DcBolt,
  'document-text': customIcons.DcDocument,
  'arrow-down-large': customIcons.DcArrowBigDown,
  'gauge-speed': customIcons.DcSpeedo,
  'test-tube': customIcons.DcSpecrometer,
};

@Component({
  selector: 'dc-icon',
  imports: [LucideAngularModule],
  template: `<lucide-icon [name]="customIcon ?? name" [size]="size" [strokeWidth]="strokeWidth" [color]="color" />`,
})
export class DcIconComponent {
  @Input({ required: true }) name!: string;
  @Input() size?: number;
  @Input() strokeWidth?: number;
  @Input() color?: string;

  get customIcon(): LucideIconData | undefined {
    return iconRegistry[this.name];
  }
}
