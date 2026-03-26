import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { LucideAngularModule, Settings } from 'lucide-angular';

import { routes } from './app.routes';
import { MyDiamond, MyBolt, Speedo } from './icons/custom-icons';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    importProvidersFrom(
      LucideAngularModule.pick({ Settings, MyDiamond, MyBolt, Speedo })
    ),
  ]
};
