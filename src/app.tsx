// @refresh reload
import { Router } from '@solidjs/router'
import { FileRoutes } from '@solidjs/start'
import { Suspense } from 'solid-js'
import './app.css'
import Footer from './components/footer'
import SidebarNavigation from './components/sidebar-navigation'

export default function App() {
  return (
    <Router
      root={(props) => (
        <SidebarNavigation>
          <div class='flex h-full flex-col'>
            <div class='grow'>
              <Suspense>{props.children}</Suspense>
            </div>
            <Footer />
          </div>
        </SidebarNavigation>
      )}
    >
      <FileRoutes />
    </Router>
  )
}
