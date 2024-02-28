// @refresh reload
import { Router } from '@solidjs/router'
import { FileRoutes } from '@solidjs/start'
import { Suspense } from 'solid-js'
import './app.css'
import SidebarNavigation from './components/sidebar-navigation'

export default function App() {
  return (
    <Router
      root={(props) => (
        <SidebarNavigation>
          <Suspense>{props.children}</Suspense>
        </SidebarNavigation>
      )}
    >
      <FileRoutes />
    </Router>
  )
}
