import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { I18n } from './core/i18n';
import { Theme } from './core/theme';
import { Overlays } from './ui/overlays';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Overlays],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet /><app-overlays />`,
})
export class App {
  // Created here so the language/direction and theme effects run from the start.
  protected i18n = inject(I18n);
  protected theme = inject(Theme);
}
