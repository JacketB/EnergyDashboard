export interface Substation {
  id: string;
  name: string;
  currentLoad: number;
  requiredLoad: number;
  connectedCellIds: string[];
}

export interface PowerCell {
  id: string;
  name: string;
  nominalCapacity: number;
  currentOutput: number;
  status: 'active' | 'idle' | 'overload' | 'maintenance';
  targetSubstationId: string | null;
  lastTelemetryTime: Date;
}

export interface EnergyLog {
  id: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
  source: string;
  message: string;
}