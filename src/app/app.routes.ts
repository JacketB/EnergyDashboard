import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'dashboard', 
    pathMatch: 'full' 
  },
  
  {
    path: 'dashboard',
    loadComponent: () => import('./Components/dashboard/dashboard.component')
      .then(m => m.DashboardComponent)
  },
  
//   {
//     path: 'cells',
//     loadComponent: () => import('./components/cells/cell-list.component')
//       .then(m => m.CellListComponent)
//   },
  { 
    path: '**', 
    redirectTo: 'dashboard' 
  }
];