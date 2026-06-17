import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnergyGridService } from '../../services/energy-grid.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Substation, PowerCell } from '../../models/energy.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private gridService = inject(EnergyGridService);

  public substations = toSignal(this.gridService.getSubstations(), { initialValue: [] as Substation[] });
  public cells = toSignal(this.gridService.getPowerCells(), { initialValue: [] as PowerCell[] });
  public logs = toSignal(this.gridService.getLogs(), { initialValue: [] });

  public getCellsForSubstation(substationId: string): PowerCell[] {
    return this.cells().filter(cell => cell.targetSubstationId === substationId);
  }  

  public totalRequiredLoad = computed(() => 
    this.substations().reduce((sum, sub) => sum + sub.requiredLoad, 0)
  );

  public totalCurrentLoad = computed(() => 
    this.substations().reduce((sum, sub) => sum + sub.currentLoad, 0)
  );

  public gridDeficit = computed(() => {
    const deficit = this.totalRequiredLoad() - this.totalCurrentLoad();
    return deficit > 0.5 ? parseFloat(deficit.toFixed(1)) : 0;
  });

  public activeCellsCount = computed(() => 
    this.cells().filter(c => c.status === 'active' || c.status === 'overload').length
  );

  public overloadedCellsCount = computed(() => 
    this.cells().filter(c => c.status === 'overload').length
  );
}