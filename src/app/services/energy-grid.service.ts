import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Substation, PowerCell, EnergyLog } from '../models/energy.model';

@Injectable({
  providedIn: 'root'
})
export class EnergyGridService {
  private substations: Substation[] = [
    { id: 'sub-1', name: 'ПС 110кВ "Северная"', currentLoad: 0, requiredLoad: 45, connectedCellIds: [] },
    { id: 'sub-2', name: 'ПС 110кВ "Южная Центральная"', currentLoad: 0, requiredLoad: 60, connectedCellIds: [] },
    { id: 'sub-3', name: 'ПС 35кВ "Промзона-1"', currentLoad: 0, requiredLoad: 85, connectedCellIds: [] },
    { id: 'sub-4', name: 'ПС 110кВ "Жилой Массив Запад"', currentLoad: 0, requiredLoad: 30, connectedCellIds: [] },
    { id: 'sub-5', name: 'ПС 35кВ "Транспортное Депо"', currentLoad: 0, requiredLoad: 15, connectedCellIds: [] },
  ];

  private cells: PowerCell[] = Array.from({ length: 30 }, (_, i) => ({
    id: `cell-${i + 1}`,
    name: `Ячейка РУ-10кВ №${i + 1}`,
    nominalCapacity: 10,
    currentOutput: 0,
    status: 'idle',
    targetSubstationId: null,
    lastTelemetryTime: new Date()
  }));

  private substations$ = new BehaviorSubject<Substation[]>(this.substations);
  private cells$ = new BehaviorSubject<PowerCell[]>(this.cells);
  private logs$ = new BehaviorSubject<EnergyLog[]>([]);

  constructor() {
    this.initialGridDistribution();
    this.startGridSimulation();
  }

  getSubstations(): Observable<Substation[]> { return this.substations$.asObservable(); }
  getPowerCells(): Observable<PowerCell[]> { return this.cells$.asObservable(); }
  getLogs(): Observable<EnergyLog[]> { return this.logs$.asObservable().pipe(map(l => l.slice(0, 40))); }

  
  private initialGridDistribution(): void {
    let cellIndex = 0;
    this.substations.forEach(sub => {

      const cellsNeeded = Math.ceil(sub.requiredLoad / 10) + 1;
      for (let i = 0; i < cellsNeeded && cellIndex < this.cells.length; i++) {
        const cell = this.cells[cellIndex];
        cell.targetSubstationId = sub.id;
        cell.status = 'active';
        sub.connectedCellIds.push(cell.id);
        cellIndex++;
      }
    });
    this.recalculateGridMetrics();
  }

  private startGridSimulation(): void {
    interval(2000).pipe(
      tap(() => {
        this.substations = this.substations.map(sub => {
          const loadFlactuation = (Math.random() - 0.5) * 8;
          const newRequired = Math.max(5, parseFloat((sub.requiredLoad + loadFlactuation).toFixed(1)));
          return { ...sub, requiredLoad: newRequired };
        });

        this.recalculateGridMetrics();
      })
    ).subscribe();
  }

  private recalculateGridMetrics(): void {
  this.cells = this.cells.map(c => c.status !== 'maintenance' ? { ...c, targetSubstationId: null, currentOutput: 0, status: 'idle' } : c);

  this.substations = this.substations.map(sub => ({ ...sub, connectedCellIds: [], currentLoad: 0 }));

  const sortedSubstations = [...this.substations].sort((a, b) => b.requiredLoad - a.requiredLoad);

  sortedSubstations.forEach(sortedSub => {
    const sub = this.substations.find(s => s.id === sortedSub.id)!;
    let allocatedPower = 0;

    for (let cell of this.cells) {
      if (cell.status === 'maintenance' || cell.targetSubstationId !== null) continue;

      cell.targetSubstationId = sub.id;
      cell.status = 'active';
      sub.connectedCellIds.push(cell.id);

      const remainingNeed = sub.requiredLoad - allocatedPower;
      
      if (remainingNeed >= cell.nominalCapacity) {
        cell.currentOutput = cell.nominalCapacity;
      } else {
        cell.currentOutput = parseFloat(remainingNeed.toFixed(1));
      }

      allocatedPower += cell.currentOutput;

      if (allocatedPower >= sub.requiredLoad) {
        break;
      }
    }

    sub.currentLoad = parseFloat(allocatedPower.toFixed(1));

    if (sub.currentLoad < sub.requiredLoad - 0.5) {
      this.logOnce(`sub-deficit-${sub.id}`, 'critical', sub.name, 
        `Дефицит! Требуется ${sub.requiredLoad} МВт, сеть смогла выделить только ${sub.currentLoad} МВт. Свободных ячеек в пуле нет!`);
    }
  });

  this.substations$.next([...this.substations]);
  this.cells$.next([...this.cells]);
}

  private activeAlerts = new Set<string>();
  private logOnce(key: string, severity: 'info' | 'warning' | 'critical', source: string, message: string): void {
    if (this.activeAlerts.has(key)) return;
    
    this.activeAlerts.add(key);
    const newLog: EnergyLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      severity,
      source,
      message
    };
    this.logs$.next([newLog, ...this.logs$.value]);

    setTimeout(() => this.activeAlerts.delete(key), 15000);
  }

  public toggleCellMaintenance(cellId: string): void {
    this.cells = this.cells.map(cell => {
      if (cell.id !== cellId) return cell;
      
      const isRepair = cell.status === 'maintenance';
      const newStatus = isRepair ? 'active' : 'maintenance';
      
      this.logOnce(`maint-${cell.id}-${Date.now()}`, isRepair ? 'info' : 'warning', cell.name, 
        isRepair ? 'Ячейка введена в эксплуатацию после ТО' : 'Ячейка выведена в ремонт. Мощность перераспределяется.'
      );

      return { ...cell, status: newStatus };
    });

    this.recalculateGridMetrics();
  }
}