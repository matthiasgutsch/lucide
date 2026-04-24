import { Component, Input } from '@angular/core';
import { LucideAngularModule, LucideIconData } from 'lucide-angular';
import * as customIcons from './custom-icons';

const iconRegistry: Record<string, LucideIconData> = {
  diamond: customIcons.DcDiamond,
  bolt: customIcons.DcBolt,
  document: customIcons.DcDocument,
  'arrow-big-down': customIcons.DcArrowBigDown,
  speedo: customIcons.DcSpeedo,
  specrometer: customIcons.DcSpecrometer,
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
