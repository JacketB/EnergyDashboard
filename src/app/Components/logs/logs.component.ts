import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnergyGridService } from '../../services/energy-grid.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogsComponent {
  private gridService = inject(EnergyGridService);

  public logs = toSignal(this.gridService.getLogs(), { initialValue: [] });
}