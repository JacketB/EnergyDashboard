import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnergyGridService } from '../../services/energy-grid.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { PowerCell } from '../../models/energy.model';

@Component({
  selector: 'app-cell-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cells-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CellListComponent {
  private gridService = inject(EnergyGridService);

  public cells = toSignal(this.gridService.getPowerCells(), { initialValue: [] as PowerCell[] });
  public selectedStatus = signal<string>('all');

  onToggleMaintenance(cellId: string): void {
    this.gridService.toggleCellMaintenance(cellId);
  }
}